(function () {
  //Get the page meta_data
  const url = window.location.href;
  const titleMeta = document?.title;
  const title = titleMeta ? titleMeta : "not mentioned";
  const descriptionMeta = document?.querySelector('meta[name="description"]');
  const description = descriptionMeta
    ? descriptionMeta.content
    : "not mentioned";
  const keywordsMeta = document?.querySelector('meta[name="keywords"]');
  const keywords = keywordsMeta ? keywordsMeta.content : "not mentioned";
  const websiteMetaData = {
    type: "WEB_PAGE_DETAILS",
    title,
    description,
    keywords,
    url,
  };

  //send the page metadata to the background.js
  chrome.runtime.sendMessage(websiteMetaData, (res) => {
    if (res?.status === "not related") {
      //Overlay
      const overlayDiv = document.createElement("div");
      Object.assign(overlayDiv.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.75)", // Semi-transparent background
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
        zIndex: "999999",
        pointerEvents: "auto",
        flexDirection: "column",
      });
      const image = document.createElement("img");
      image.src = chrome.runtime.getURL("assets/achieve.svg");
      image.alt = "Achieve Image";
      image.style.maxWidth = "10%";
      overlayDiv.appendChild(image);
      const message1 = document.createElement("p");
      message1.textContent = `As per your schedule (${res?.task?.summary}), this seems like a distraction`;
      overlayDiv.appendChild(message1);
      const message2 = document.createElement("p");
      message2.textContent =
        "Confidence comes from keeping the promises you made to yourself";
      overlayDiv.appendChild(message2);
      document.body.appendChild(overlayDiv);
      document.body.style.overflow = "hidden";
    }
  });
})();
