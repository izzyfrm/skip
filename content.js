const defaults = {
  enabled: true,
  accent: "#3b82f6",
  rounded: true,
  hideShorts: false,
  channelOverlay: true
};

let settings = { ...defaults };

let overlay = null;
let lastChannel = "";
let lastUrl = location.href;

function applySettings() {
  const root = document.documentElement;

  root.style.setProperty(
    "--tune-accent",
    settings.accent
  );

  root.classList.toggle(
    "tune-disabled",
    !settings.enabled
  );

  root.classList.toggle(
    "tune-rounded",
    settings.enabled && settings.rounded
  );

  root.classList.toggle(
    "tune-hide-shorts",
    settings.enabled && settings.hideShorts
  );

  root.classList.toggle(
    "tune-channel-overlay-enabled",
    settings.enabled && settings.channelOverlay
  );

  syncOverlay();
}

function getChannelName() {
  const selectors = [
    "ytd-watch-metadata #channel-name a",
    "ytd-watch-metadata #channel-name",
    "ytd-video-owner-renderer #channel-name a",
    "#upload-info #channel-name a"
  ];

  for (const selector of selectors) {
    const element =
      document.querySelector(selector);

    const name =
      element?.textContent?.trim();

    if (name) {
      return name;
    }
  }

  return "";
}

function removeOverlay() {
  if (overlay) {
    overlay.remove();
    overlay = null;
  }

  lastChannel = "";
}

function syncOverlay() {
  if (
    !settings.enabled ||
    !settings.channelOverlay ||
    !location.pathname.startsWith("/watch")
  ) {
    removeOverlay();
    return;
  }

  const player =
    document.querySelector("#movie_player");

  if (!player) {
    return;
  }

  const channelName =
    getChannelName();

  if (!channelName) {
    return;
  }

  if (
    overlay &&
    overlay.parentElement !== player
  ) {
    removeOverlay();
  }

  if (!overlay) {
    overlay =
      document.createElement("div");

    overlay.id =
      "tune-channel-overlay";

    player.appendChild(overlay);
  }

  if (channelName !== lastChannel) {
    overlay.textContent =
      channelName;

    lastChannel =
      channelName;
  }
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
    for (
      const [key, change]
      of Object.entries(changes)
    ) {
      settings[key] =
        change.newValue;
    }

    applySettings();
  }
);

document.addEventListener(
  "yt-navigate-finish",
  () => {
    lastUrl = location.href;

    setTimeout(
      syncOverlay,
      300
    );
  }
);

document.addEventListener(
  "yt-page-data-updated",
  () => {
    setTimeout(
      syncOverlay,
      250
    );
  }
);

setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;

    syncOverlay();
  }

  if (
    settings.enabled &&
    settings.channelOverlay
  ) {
    syncOverlay();
  }
}, 1500);