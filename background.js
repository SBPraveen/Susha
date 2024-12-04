(async () => {
  // If multiple requests are sent the the built in AI model threw error.
  class PromptQueue {
    constructor() {
      this.queue = [];
      this.isProcessing = false;
    }

    enqueue(prompt, session) {
      return new Promise((resolve, reject) => {
        this.queue.push({ prompt, session, resolve, reject });
        this.processQueue();
      });
    }

    async processQueue() {
      if (this.isProcessing || this.queue.length === 0) {
        return;
      }
      this.isProcessing = true;
      const { prompt, session, resolve, reject } = this.queue.shift();
      try {
        const result = await session.prompt(prompt);
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        this.isProcessing = false;
        this.processQueue(); // Process the next item in the queue
      }
    }
  }

  // Initializing the AI model
  let sessionWebsite;
  const { available } = await ai.languageModel.capabilities();
  if (available !== "no") {
    try {
      sessionWebsite = await ai.languageModel.create({
        systemPrompt: `You are a decision-making assistant. You will be given an input consisting of the website's URL, title, description, keywords and the user's current task. Your job is to decide whether the content of the website is relevant to the user's task. Your decision must prioritize the user's productivity and relevance to their task. Respond with "related" if it aligns with the task or "not related" if it does not. Do not provide any explanation or additional text.`,
      });
    } catch (error) {
      console.log("Error in model creation", error);
    }
  } else {
    alert("Chrome built in AI is not supported");
  }

  function closestTimePeriod(events) {
    const currentTime = new Date().getTime();
    for (const event of events) {
      const startTime = new Date(event.start.dateTime).getTime();
      const endTime = new Date(event.end.dateTime).getTime();
      if (currentTime >= startTime && currentTime <= endTime) {
        return event;
      }
    }
    return null;
  }

  const promptQueue = new PromptQueue();

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "WEB_PAGE_DETAILS") {
      const { title, description, keywords, url } = message;
      chrome.storage.local.get(["events"], async (data) => {
        const task = closestTimePeriod(data.events);
        //If the user has a task then the websites have to be filtered based on his task else no filtering is required
        if (task && sessionWebsite) {
          try {
            const prompt = `The websites url is ${url}, title is ${title}, description is ${description}, keywords are ${keywords} and my current task is ${task.summary}`;
            console.log("Prompt :", prompt);
            const clonedSession = await sessionWebsite.clone();
            result = promptQueue
              .enqueue(prompt, clonedSession)
              .then((result) => {
                console.log("Reply from the AI Model", message.title, result);
                clonedSession.destroy();
                sendResponse({ status: result, task });
              });
          } catch (error) {
            console.log("Error during the prompt execution", error);
            sendResponse({ status: "not related" });
          }
        }
      });
      return true;
    }
  });
})();


