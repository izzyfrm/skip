console.log("[skip.] loaded");

let enabled = true;

let inAd = false;
let savedRate = 1;
let savedMuted = false;

chrome.storage.local.get("enabled", data => {
  enabled = data.enabled ?? true;
});

chrome.storage.onChanged.addListener(changes => {
  if (changes.enabled) {
    enabled = changes.enabled.newValue;
  }
});

function getPlayer() {
  return document.querySelector("#movie_player");
}

function getVideo() {
  return document.querySelector("#movie_player video.html5-main-video")
    || document.querySelector("video");
}

function isAdPlaying() {
  const player = getPlayer();

  return !!player && (
    player.classList.contains("ad-showing") ||
    player.classList.contains("ad-interrupting")
  );
}

function getSkipButton() {
  const player = getPlayer();
  if (!player) return null;

  const selectors = [
    ".ytp-skip-ad-button",
    ".ytp-ad-skip-button",
    ".ytp-ad-skip-button-modern",
    ".ytp-ad-skip-button-slot button",
    ".ytp-ad-skip-button-container button",
    ".ytp-ad-player-overlay-layout__skip-or-preview-container button"
  ];

  for (const selector of selectors) {
    const button = player.querySelector(selector);

    if (!button) continue;

    const rect = button.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      return button;
    }
  }

  return null;
}

function enterAd(video) {
  if (inAd) return;

  inAd = true;

  savedRate = video.playbackRate;
  savedMuted = video.muted;

  console.log("[skip.] ad detected");
}

function leaveAd(video) {
  if (!inAd) return;

  inAd = false;

  video.playbackRate = savedRate;
  video.muted = savedMuted;

  console.log("[skip.] content resumed");
}

function handleAd() {
  if (!enabled) return;

  const video = getVideo();

  if (!video) return;

  if (!isAdPlaying()) {
    leaveAd(video);
    return;
  }

  enterAd(video);

  const skip = getSkipButton();

  if (skip) {
    skip.click();
  }

  if (!isAdPlaying()) {
    return;
  }

  video.muted = true;

  if (
    Number.isFinite(video.duration) &&
    video.duration > 0 &&
    video.duration < 600
  ) {
    try {
      video.currentTime = Math.max(
        video.currentTime,
        video.duration - 0.05
      );
    } catch {}
  }

  video.playbackRate = 16;

  if (video.paused) {
    video.play().catch(() => {});
  }
}

setInterval(handleAd, 100);