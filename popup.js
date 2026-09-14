const toggle = document.getElementById("enhanceToggle");
const compareButton = document.getElementById("compareButton");
const statusText = document.getElementById("statusText");
const compareTitle = compareButton.querySelector("strong");

let compareActive = false;

async function getCurrentTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tabs[0];
}

async function ensureContentScript() {
  const tab = await getCurrentTab();

  if (!tab?.id) {
    return null;
  }

  if (!tab.url?.includes("youtube.com")) {
    return null;
  }

  try {
    return await chrome.tabs.sendMessage(tab.id, {
      type: "PING"
    });
  } catch {}

  try {
    await chrome.scripting.insertCSS({
      target: {
        tabId: tab.id
      },
      files: [
        "content.css"
      ]
    });

    await chrome.scripting.executeScript({
      target: {
        tabId: tab.id
      },
      files: [
        "content.js"
      ]
    });

    await new Promise(resolve => {
      setTimeout(resolve, 150);
    });

    return await chrome.tabs.sendMessage(tab.id, {
      type: "PING"
    });
  } catch (error) {
    console.error("Enhance injection failed:", error);
    return null;
  }
}

async function send(message) {
  const tab = await getCurrentTab();

  if (!tab?.id) {
    return null;
  }

  await ensureContentScript();

  try {
    return await chrome.tabs.sendMessage(
      tab.id,
      message
    );
  } catch (error) {
    console.error("Enhance message failed:", error);
    return null;
  }
}

function updateUI(enabled) {
  toggle.checked = enabled;

  statusText.textContent = enabled
    ? "Video enhancement is on"
    : "Video enhancement is off";

  compareButton.disabled = !enabled;

  if (!enabled) {
    compareActive = false;

    compareButton.classList.remove(
      "active"
    );

    compareTitle.textContent =
      "Before & After";
  }
}

async function load() {
  const saved = await chrome.storage.local.get({
    enhanceEnabled: false,
    compareEnabled: false
  });

  updateUI(saved.enhanceEnabled);

  await ensureContentScript();

  const state = await send({
    type: "GET_STATE"
  });

  if (!state) {
    return;
  }

  compareActive = Boolean(state.compare);

  compareButton.classList.toggle(
    "active",
    compareActive
  );

  compareTitle.textContent =
    compareActive
      ? "Exit comparison"
      : "Before & After";
}

toggle.addEventListener("change", async () => {
  const enabled = toggle.checked;

  if (!enabled) {
    compareActive = false;

    await chrome.storage.local.set({
      enhanceEnabled: false,
      compareEnabled: false
    });
  } else {
    await chrome.storage.local.set({
      enhanceEnabled: true
    });
  }

  updateUI(enabled);

  await send({
    type: "SET_ENABLED",
    enabled
  });
});

compareButton.addEventListener(
  "click",
  async () => {
    if (!toggle.checked) {
      return;
    }

    const response = await send({
      type: "TOGGLE_COMPARE"
    });

    if (!response) {
      statusText.textContent =
        "Refresh YouTube and try again";

      return;
    }

    compareActive =
      Boolean(response.compare);

    await chrome.storage.local.set({
      compareEnabled: compareActive
    });

    compareButton.classList.toggle(
      "active",
      compareActive
    );

    compareTitle.textContent =
      compareActive
        ? "Exit comparison"
        : "Before & After";
  }
);

load();