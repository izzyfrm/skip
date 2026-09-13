console.log("[skip.] loaded");

let enabled = true;
let lastAction = 0;

chrome.storage.local.get("enabled", data => {
  enabled = data.enabled ?? true;
});

chrome.storage.onChanged.addListener(changes => {
  if (changes.enabled) {
    enabled = changes.enabled.newValue;
  }
});

function visible(el) {
  if (!el) return false;

  const rect = el.getBoundingClientRect();

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    el.offsetParent !== null
  );
}

function findSkipButton() {
  const selectors = [
    ".ytp-skip-ad-button",
    ".ytp-ad-skip-button",
    ".ytp-ad-skip-button-modern",
    ".ytp-ad-skip-button-slot button",
    "button[aria-label*='Skip']",
    "button[aria-label*='skip']"
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);

    for (const el of elements) {
      if (!visible(el)) continue;

      const button =
        el.matches("button")
          ? el
          : el.closest("button") || el.querySelector("button") || el;

      if (visible(button)) {
        return button;
      }
    }
  }

  return null;
}

function realClick(button) {
  const rect = button.getBoundingClientRect();

  const options = {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2
  };

  button.focus();

  button.dispatchEvent(
    new PointerEvent("pointerdown", {
      ...options,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true
    })
  );

  button.dispatchEvent(
    new MouseEvent("mousedown", options)
  );

  button.dispatchEvent(
    new PointerEvent("pointerup", {
      ...options,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true
    })
  );

  button.dispatchEvent(
    new MouseEvent("mouseup", options)
  );

  button.click();
}

function adIsPlaying() {
  return document
    .querySelector("#movie_player")
    ?.classList.contains("ad-showing");
}

function fallbackSkip() {
  if (!adIsPlaying()) return;

  const video = document.querySelector("video");

  if (!video) return;

  if (
    Number.isFinite(video.duration) &&
    video.duration > 0
  ) {
    console.log("[skip.] using fallback");

    try {
      video.currentTime = Math.max(
        0,
        video.duration - 0.1
      );
    } catch {}
  }
}

function check() {
  if (!enabled) return;

  const button = findSkipButton();

  if (!button) return;

  const now = Date.now();

  if (now - lastAction < 1500) return;

  lastAction = now;

  console.log("[skip.] skip button found");

  realClick(button);

  setTimeout(() => {
    if (adIsPlaying()) {
      fallbackSkip();
    } else {
      console.log("[skip.] ad skipped ✓");
    }
  }, 600);
}

const observer = new MutationObserver(check);

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true
});

setInterval(check, 300);