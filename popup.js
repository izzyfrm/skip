const defaults = {
  enabled: true,
  accent: "#3b82f6",
  rounded: true,
  hideShorts: false,
  channelOverlay: true
};

const enabled =
  document.getElementById("enabled");

const accent =
  document.getElementById("accent");

const rounded =
  document.getElementById("rounded");

const hideShorts =
  document.getElementById("hideShorts");

const channelOverlay =
  document.getElementById("channelOverlay");

chrome.storage.local.get(
  defaults,
  settings => {
    enabled.checked =
      settings.enabled;

    accent.value =
      settings.accent;

    rounded.checked =
      settings.rounded;

    hideShorts.checked =
      settings.hideShorts;

    channelOverlay.checked =
      settings.channelOverlay;
  }
);

enabled.addEventListener(
  "change",
  () => {
    chrome.storage.local.set({
      enabled: enabled.checked
    });
  }
);

accent.addEventListener(
  "input",
  () => {
    chrome.storage.local.set({
      accent: accent.value
    });
  }
);

rounded.addEventListener(
  "change",
  () => {
    chrome.storage.local.set({
      rounded: rounded.checked
    });
  }
);

hideShorts.addEventListener(
  "change",
  () => {
    chrome.storage.local.set({
      hideShorts: hideShorts.checked
    });
  }
);

channelOverlay.addEventListener(
  "change",
  () => {
    chrome.storage.local.set({
      channelOverlay:
        channelOverlay.checked
    });
  }
);

document
  .querySelectorAll("[data-color]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const color =
          button.dataset.color;

        accent.value =
          color;

        chrome.storage.local.set({
          accent: color
        });

      }
    );

  });