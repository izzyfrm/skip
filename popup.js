const enhanceToggle =
  document.getElementById("enhanceToggle");

const motionToggle =
  document.getElementById("motionToggle");

const strengthSlider =
  document.getElementById("strengthSlider");

const strengthValue =
  document.getElementById("strengthValue");

const strengthArea =
  document.getElementById("strengthArea");

const compareButton =
  document.getElementById("compareButton");

const compareTitle =
  compareButton.querySelector("strong");

const statusText =
  document.getElementById("statusText");

let compareActive = false;

async function getTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tab;
}

async function ensureScript() {
  const tab = await getTab();

  if (
    !tab?.id ||
    !tab.url?.includes("youtube.com")
  ) {
    return false;
  }

  try {
    await chrome.tabs.sendMessage(
      tab.id,
      {
        type: "PING"
      }
    );

    return true;
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
      setTimeout(resolve, 120);
    });

    return true;
  } catch {
    return false;
  }
}

async function send(message) {
  const tab = await getTab();

  if (!tab?.id) {
    return null;
  }

  await ensureScript();

  try {
    return await chrome.tabs.sendMessage(
      tab.id,
      message
    );
  } catch {
    return null;
  }
}

function updateMotionUI() {
  const available =
    enhanceToggle.checked;

  motionToggle.disabled =
    !available;

  const sliderAvailable =
    available &&
    motionToggle.checked;

  strengthArea.classList.toggle(
    "disabled",
    !sliderAvailable
  );
}

function updateEnhanceUI() {
  const enabled =
    enhanceToggle.checked;

  compareButton.disabled =
    !enabled;

  statusText.textContent =
    enabled
      ? "Video enhancement is on"
      : "Video enhancement is off";

  if (!enabled) {
    compareActive = false;

    compareButton.classList.remove(
      "active"
    );

    compareTitle.textContent =
      "Before & After";
  }

  updateMotionUI();
}

async function load() {
  const settings =
    await chrome.storage.local.get({
      enhanceEnabled: false,
      compareEnabled: false,
      motionBlurEnabled: false,
      motionBlurStrength: 3
    });

  enhanceToggle.checked =
    settings.enhanceEnabled;

  motionToggle.checked =
    settings.motionBlurEnabled;

  strengthSlider.value =
    settings.motionBlurStrength;

  strengthValue.textContent =
    settings.motionBlurStrength;

  compareActive =
    settings.compareEnabled;

  compareButton.classList.toggle(
    "active",
    compareActive
  );

  compareTitle.textContent =
    compareActive
      ? "Exit comparison"
      : "Before & After";

  updateEnhanceUI();

  await ensureScript();
}

enhanceToggle.addEventListener(
  "change",
  async () => {
    const enabled =
      enhanceToggle.checked;

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

    updateEnhanceUI();

    await send({
      type: "SET_ENABLED",
      enabled
    });
  }
);

motionToggle.addEventListener(
  "change",
  async () => {
    const motionBlurEnabled =
      motionToggle.checked;

    await chrome.storage.local.set({
      motionBlurEnabled
    });

    updateMotionUI();

    await send({
      type: "SET_MOTION_BLUR",
      enabled: motionBlurEnabled
    });
  }
);

strengthSlider.addEventListener(
  "input",
  async () => {
    const strength =
      Number(
        strengthSlider.value
      );

    strengthValue.textContent =
      strength;

    await chrome.storage.local.set({
      motionBlurStrength:
        strength
    });

    await send({
      type:
        "SET_MOTION_STRENGTH",

      strength
    });
  }
);

compareButton.addEventListener(
  "click",
  async () => {
    if (
      !enhanceToggle.checked
    ) {
      return;
    }

    const response =
      await send({
        type: "TOGGLE_COMPARE"
      });

    if (!response) {
      statusText.textContent =
        "Refresh YouTube and try again";

      return;
    }

    compareActive =
      Boolean(response.compare);

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