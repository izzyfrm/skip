console.log("[skip.] loaded");

let enabled = true;

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
    "button[aria-label*='Skip']"
  ];

  for (const selector of selectors) {
    const buttons = document.querySelectorAll(selector);

    for (const button of buttons) {
      if (visible(button)) {
        return button;
      }
    }
  }

  return null;
}

function checkForAd() {
  if (!enabled) return;

  const button = findSkipButton();

  if (!button) return;

  console.log("[skip.] skip button found");

  button.click();

  console.log("[skip.] clicked");
}

const observer = new MutationObserver(checkForAd);

observer.observe(document.body, {
  childList: true,
  subtree: true
});

setInterval(checkForAd, 250);