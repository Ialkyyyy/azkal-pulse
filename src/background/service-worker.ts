chrome.runtime.onInstalled.addListener(() => {
  console.log("azkal-pulse installed");
});

chrome.action.onClicked.addListener((_tab) => {
  // Popup handles the UI, this is for future background tasks
});
