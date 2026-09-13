const defaults = {
  enabled: true,
  accent: "#3b82f6",
  rounded: true,
  hideShorts: false,
  channelOverlay: true
};

let settings = { ...defaults };

function applySettings() {
  document.documentElement.style.setProperty(
    "--tune-accent",
    settings.accent
  );

  document.documentElement.classList.toggle(
    "tune-disabled",
    !settings.enabled
  );

  document.documentElement.classList.toggle(
    "tune-rounded",
    settings.enabled && settings.rounded
  );

  document.documentElement.classList.toggle(
    "tune-hide-shorts",
    settings.enabled && settings.hideShorts
  );

  document.documentElement.classList.toggle(
    "tune-channel-overlay",
    settings.enabled && settings.channelOverlay
  );

  updateChannelOverlay();
}

function getChannelName() {
  const selectors = [
    "ytd-watch-metadata #channel-name a",
    "ytd-watch-metadata #owner #channel-name",
    "#upload-info #channel-name a",
    "ytd-video-owner-renderer #channel-name a"
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);

    const name = element?.textContent?.trim();

    if (name) {
      return name;
    }
  }

  return "";
}

function updateChannelOverlay() {
  let overlay = document.getElementById(
    "tune-channel-overlay"
  );

  if (
    !settings.enabled ||
    !settings.channelOverlay ||
    !location.pathname.startsWith("/watch")
  ) {
    overlay?.remove();
    return;
  }

  const player = document.querySelector(
    "#movie_player"
  );

  if (!player) {
    overlay?.remove();
    return;
  }

  const channelName = getChannelName();

  if (!channelName) {
    return;
  }

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "tune-channel-overlay";

    player.appendChild(overlay);
  }

  overlay.textContent = channelName;
}

chrome.storage.local.get(
  defaults,
  data => {
    settings = {
      ...defaults,
      ...data
    };

    applySettings();
  }
);

chrome.storage.onChanged.addListener(
  changes => {
    for (const [key, value] of Object.entries(changes)) {
      settings[key] = value.newValue;
    }

    applySettings();
  }
);

const observer = new MutationObserver(() => {
  if (
    settings.enabled &&
    settings.channelOverlay
  ) {
    updateChannelOverlay();
  }
});

observer.observe(
  document.documentElement,
  {
    childList: true,
    subtree: true
  }
);