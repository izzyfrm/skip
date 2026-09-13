const defaults = {
  enabled: true,
  accent: "#3b82f6",
  rounded: true,
  hideShorts: false,
  channelOverlay: true
};

const elements = {
  enabled:
    document.getElementById("enabled"),

  accent:
    document.getElementById("accent"),

  rounded:
    document.getElementById("rounded"),

  hideShorts:
    document.getElementById("hideShorts"),

  channelOverlay:
    document.getElementById("channelOverlay")
};

function updateAccentUI(color) {
  document.documentElement.style.setProperty(
    "--accent",
    color
  );

  document
    .querySelectorAll(".color")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.color
          .toLowerCase() ===
        color.toLowerCase()
      );
    });
}

chrome.storage.local.get(
  defaults,
  settings => {
    elements.enabled.checked =
      settings.enabled;

    elements.accent.value =
      settings.accent;

    elements.rounded.checked =
      settings.rounded;

    elements.hideShorts.checked =
      settings.hideShorts;

    elements.channelOverlay.checked =
      settings.channelOverlay;

    updateAccentUI(
      settings.accent
    );
  }
);

elements.enabled.addEventListener(
  "change",
  () => {
    chrome.storage.local.set({
      enabled:
        elements.enabled.checked
    });
  }
);

elements.accent.addEventListener(
  "input",
  () => {
    const color =
      elements.accent.value;

    updateAccentUI(color);

    chrome.storage.local.set({
      accent: color
    });
  }
);

elements.rounded.addEventListener(
  "change",
  () => {
    chrome.storage.local.set({
      rounded:
        elements.rounded.checked
    });
  }
);

elements.hideShorts.addEventListener(
  "change",
  () => {
    chrome.storage.local.set({
      hideShorts:
        elements.hideShorts.checked
    });
  }
);

elements.channelOverlay.addEventListener(
  "change",
  () => {
    chrome.storage.local.set({
      channelOverlay:
        elements.channelOverlay.checked
    });
  }
);

document
  .querySelectorAll(".color")
  .forEach(button => {
    button.addEventListener(
      "click",
      () => {
        const color =
          button.dataset.color;

        elements.accent.value =
          color;

        updateAccentUI(color);

        chrome.storage.local.set({
          accent: color
        });
      }
    );
  });