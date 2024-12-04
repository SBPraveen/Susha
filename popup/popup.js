const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events.readonly",
];

// DOM Elements
const loginButton = document.getElementById("login-button");
const refreshButton = document.getElementById("refresh");
const loginContainer = document.getElementById("login-container");
const eventsContainer = document.getElementById("events-container");
const eventsList = document.getElementById("events-list");

async function fetchCalendarEvents(
  authToken,
  isBackgroundFile = false,
  makeApiCall = false
) {
  try {
    chrome.storage.local.get(["events"], async (data) => {
      if (data.events && !makeApiCall) {
        displayEvents(data.events);
      } else {
        // Fetch events from the calendar
        const response = await fetch(
          "https://www.googleapis.com/calendar/v3/calendars/primary/events?" +
            new URLSearchParams({
              timeMin: new Date().toISOString(),
              maxResults: 15,
              singleEvents: true,
              orderBy: "startTime",
            }),
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        const data = await response.json();
        const dataItems = data?.items?.map((item) => {
          const { id, updated, summary, start, end } = item;
          return { id, updated, summary, start, end };
        });
        console.log("fetchCalendarEvents API call made to calendar", dataItems);
        chrome.storage.local.set({ events: dataItems }, () => {
          console.log(
            "fetchCalendarEvents Events fetched and saved:",
            dataItems
          );
        });

        displayEvents(dataItems);
      }
    });
  } catch (error) {
    console.error("Error fetching events:", error);
  }
}

// Display Events in Popup
function displayEvents(events) {
  console.log("displayEvents intro", events);

  eventsList.innerHTML = ""; // Clear previous events

  if (events.length === 0) {
    eventsList.innerHTML = "<li>No upcoming events</li>";
    return;
  }

  events.forEach((event) => {
    const eventItem = document.createElement("li");
    eventItem.classList.add("event-item");

    const startTime = new Date(event.start.dateTime || event.start.date);
    eventItem.innerHTML = `
      <strong>${event.summary}</strong><br>
      ${startTime.toLocaleString()}
    `;

    eventsList.appendChild(eventItem);
  });
}
// Authentication Handler
function handleAuthentication() {
  chrome.identity.getAuthToken({ interactive: true }, function (token) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    chrome.storage.local.set({ authToken: token }, () => {
      console.log("User info saved:", token);
    });

    // Hide login, show events
    loginContainer.style.display = "none";
    eventsContainer.style.display = "block";

    // Fetch Calendar Events
    fetchCalendarEvents(token);
  });
}

// Event Listeners
loginButton.addEventListener("click", handleAuthentication);
refreshButton.addEventListener("click", () => {
  chrome.storage.local.get(["authToken"], function (data) {
    fetchCalendarEvents(data.authToken, false, true);
  });
});

// Check if already authenticated
chrome.storage.local.get(["authToken"], function (data) {
  if (data.authToken) {
    console.log("init check: authToken present", data.authToken);
    fetchCalendarEvents(data.authToken);
    loginContainer.style.display = "none";
    eventsContainer.style.display = "block";
  } else {
    console.log("init check: No authToken present");
    loginContainer.style.display = "flex";
    eventsContainer.style.display = "none";
  }
});
