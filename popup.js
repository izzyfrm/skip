const toggle = document.getElementById("enhanceToggle");
const compareButton = document.getElementById("compareButton");
const statusText = document.getElementById("statusText");

let compareActive = false;

async function getTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tab;
}

async function sendMessage(message) {
  try {
    const tab = await getTab();

    if (!tab?.id) {
      return null;
    }

    return await chrome.tabs.sendMessage(tab.id, message);
  } catch {
    return null;
  }
}

function updateUI(enabled) {
  toggle.checked = enabled;
  compareButton.disabled = !enabled;

  statusText.textContent = enabled
    ? "Video enhancement is on"
    : "Video enhancement is off";

  if (!enabled) {
    compareActive = false;
    compareButton.classList.remove("active");

    compareButton.querySelector("strong").textContent =
      "Before & After";
  }
}

async function loadState() {
  const saved = await chrome.storage.local.get({
    enhanceEnabled: false
  });

  updateUI(saved.enhanceEnabled);

  const state = await sendMessage({
    type: "GET_STATE"
  });

  if (state) {
    compareActive = Boolean(state.compare);

    compareButton.classList.toggle(
      "active",
      compareActive
    );

    compareButton.querySelector("strong").textContent =
      compareActive
        ? "Exit comparison"
        : "Before & After";
  }
}

toggle.addEventListener("change", async () => {
  const enabled = toggle.checked;

  await chrome.storage.local.set({
    enhanceEnabled: enabled
  });

  updateUI(enabled);

  await sendMessage({
    type: "SET_ENABLED",
    enabled
  });
});

compareButton.addEventListener("click", async () => {
  if (!toggle.checked) {
    return;
  }

  const result = await sendMessage({
    type: "TOGGLE_COMPARE"
  });

  if (!result) {
    return;
  }

  compareActive = Boolean(result.compare);

  compareButton.classList.toggle(
    "active",
    compareActive
  );

  compareButton.querySelector("strong").textContent =
    compareActive
      ? "Exit comparison"
      : "Before & After";
});

loadState();