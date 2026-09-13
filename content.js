let enabled = true;

chrome.storage.local.get(["enabled"], (data) => {
  enabled = data.enabled ?? true;
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    enabled = changes.enabled.newValue;
  }
});

setInterval(() => {
  if (!enabled) return;

  const skipButton =
    document.querySelector(".ytp-ad-skip-button") ||
    document.querySelector(".ytp-skip-ad-button") ||
    document.querySelector(".ytp-ad-skip-button-modern");

  if (skipButton) {
    skipButton.click();
  }
}, 250);