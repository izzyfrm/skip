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

const selectors = [
  ".ytp-skip-ad-button",
  ".ytp-ad-skip-button",
  ".ytp-ad-skip-button-modern",
  ".ytp-ad-skip-button-slot button",
  "button[class*='skip-ad']",
  "[id*='skip-button'] button"
];

function isVisible(el) {
  if (!el) return false;

  const rect = el.getBoundingClientRect();

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    el.offsetParent !== null
  );
}

function findSkipButton() {
  const player = document.querySelector("#movie_player");

  if (!player) return null;

  for (const selector of selectors) {
    const buttons = player.querySelectorAll(selector);

    for (const button of buttons) {
      if (isVisible(button)) {
        return button;
      }
    }
  }

  for (const button of player.querySelectorAll("button")) {
    const text = (
      button.innerText ||
      button.getAttribute("aria-label") ||
      ""
    ).toLowerCase();

    if (
      isVisible(button) &&
      (
        text.includes("skip ad") ||
        text === "skip" ||
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

  console.log("[skip.] found skip button");

  button.click();

  console.log("[skip.] clicked");
}

const observer = new MutationObserver(check);

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true
});

setInterval(check, 250);