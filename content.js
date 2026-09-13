console.log("[skip.] loaded");

let enabled = true;

let handlingAd = false;
let oldRate = 1;
let oldMuted = false;

chrome.storage.local.get("enabled", data => {
  enabled = data.enabled ?? true;
});

chrome.storage.onChanged.addListener(changes => {
  if (changes.enabled) {
    enabled = changes.enabled.newValue;
  }
});

function player() {
  return document.querySelector("#movie_player");
}

function video() {
  return (
    document.querySelector("#movie_player video.html5-main-video") ||
    document.querySelector("video")
  );
}

function visible(el) {
  if (!el) return false;

  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden"
  );
}

function getSkipButton() {
  const p = player();

  if (!p) return null;

  const selectors = [
    ".ytp-skip-ad-button",
    ".ytp-ad-skip-button",
    ".ytp-ad-skip-button-modern",
    ".ytp-ad-skip-button-slot button",
    ".ytp-ad-skip-button-container button",
    "button[class*='skip-ad']",
    "[id*='skip-button'] button"
  ];

  for (const selector of selectors) {
    const elements = p.querySelectorAll(selector);

    for (const el of elements) {
      if (visible(el)) {
        return el;
      }
    }
  }

  return null;
}

function adDetected() {
  const p = player();

  if (!p) return false;

  if (
    p.classList.contains("ad-showing") ||
    p.classList.contains("ad-interrupting")
  ) {
    return true;
  }

  if (getSkipButton()) {
    return true;
  }

  const markers = [
    ".ytp-ad-countdown",
    ".ytp-ad-simple-ad-badge",
    ".ytp-ad-persistent-progress-bar-container",
    ".ytp-ad-player-overlay-layout",
    ".ytp-ad-preview-container",
    ".ytp-ad-text",
    ".ytp-ad-player-overlay"
  ];

  for (const selector of markers) {
    const elements = p.querySelectorAll(selector);

    for (const el of elements) {
      if (visible(el)) {
        return true;
      }
    }
  }

  return false;
}

function startAd(v) {
  if (handlingAd) return;

  handlingAd = true;

  oldRate = v.playbackRate;
  oldMuted = v.muted;

  console.log("[skip.] AD DETECTED");
}

function finishAd(v) {
  if (!handlingAd) return;

  handlingAd = false;

  v.playbackRate = oldRate;
  v.muted = oldMuted;

  console.log("[skip.] content resumed");
}

function handle() {
  if (!enabled) return;

  const v = video();

  if (!v) return;

  const skip = getSkipButton();
  const ad = adDetected();

  if (!ad) {
    finishAd(v);
    return;
  }

  startAd(v);

  if (skip) {
    console.log("[skip.] skip button found");

    skip.click();

    try {
      skip.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window
        })
      );
    } catch {}
  }

  v.muted = true;

  if (
    Number.isFinite(v.duration) &&
    v.duration > 0 &&
    v.duration < 600
  ) {
    try {
      v.currentTime = Math.max(
        v.currentTime,
        v.duration - 0.1
      );
    } catch {}
  }

  v.playbackRate = 16;

  if (v.paused) {
    v.play().catch(() => {});
  }
}

const observer = new MutationObserver(handle);

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true
});

setInterval(handle, 150);