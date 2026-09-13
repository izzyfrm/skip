let enabled = true;
let lastSkip = 0;

chrome.storage.local.get(["enabled"], data => {
  enabled = data.enabled ?? true;
});

chrome.storage.onChanged.addListener(changes => {
  if (changes.enabled) {
    enabled = changes.enabled.newValue;
  }
});

function visible(element) {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);

  return (
    rect.width > 5 &&
    rect.height > 5 &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    Number(style.opacity) > 0
  );
}

function findSkipButton() {
  const selectors = [
    ".ytp-skip-ad-button",
    ".ytp-ad-skip-button-modern",
    ".ytp-ad-skip-button",
    "button[aria-label^='Skip']",
    "button[aria-label*='Skip ad']"
  ];

  for (const selector of selectors) {
    const buttons = document.querySelectorAll(selector);

    for (const button of buttons) {
      if (visible(button)) {
        return button;
      }
    }
  }

  const buttons = document.querySelectorAll("button");

  for (const button of buttons) {
    const text = button.textContent.trim().toLowerCase();

    if (
      visible(button) &&
      (
        text === "skip" ||
        text === "skip ad" ||
        text === "skip ads"
      )
    ) {
      return button;
    }
  }

  return null;
}

function check() {
  if (!enabled) return;

  const button = findSkipButton();

  if (!button) return;

  const now = Date.now();

  if (now - lastSkip < 1500) return;

  const rect = button.getBoundingClientRect();

  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  lastSkip = now;

  console.log("[skip.] visible skip button found");

  chrome.runtime.sendMessage({
    type: "skip-ad",
    x,
    y
  });
}

const observer = new MutationObserver(check);

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true
});

setInterval(check, 300);