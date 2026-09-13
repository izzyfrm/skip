const button = document.getElementById("toggle");

function update(enabled) {
  button.textContent = enabled ? "Enabled" : "Disabled";
}

chrome.storage.local.get(["enabled"], (data) => {
  update(data.enabled ?? true);
});

button.addEventListener("click", () => {
  chrome.storage.local.get(["enabled"], (data) => {
    const enabled = !(data.enabled ?? true);

    chrome.storage.local.set({ enabled });

    update(enabled);
  });
});