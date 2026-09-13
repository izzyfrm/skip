const attached = new Set();

async function attach(tabId) {
  if (attached.has(tabId)) return true;

  try {
    await chrome.debugger.attach(
      { tabId },
      "1.3"
    );

    attached.add(tabId);

    return true;
  } catch (error) {
    console.error("[skip.] debugger attach failed:", error);
    return false;
  }
}

async function click(tabId, x, y) {
  const ready = await attach(tabId);

  if (!ready) return;

  const target = { tabId };

  try {
    await chrome.debugger.sendCommand(
      target,
      "Input.dispatchMouseEvent",
      {
        type: "mouseMoved",
        x,
        y
      }
    );

    await chrome.debugger.sendCommand(
      target,
      "Input.dispatchMouseEvent",
      {
        type: "mousePressed",
        x,
        y,
        button: "left",
        buttons: 1,
        clickCount: 1
      }
    );

    await chrome.debugger.sendCommand(
      target,
      "Input.dispatchMouseEvent",
      {
        type: "mouseReleased",
        x,
        y,
        button: "left",
        buttons: 0,
        clickCount: 1
      }
    );

    console.log("[skip.] ad skipped");
  } catch (error) {
    console.error("[skip.] click failed:", error);
  }
}

chrome.runtime.onMessage.addListener((message, sender) => {
  if (
    message.type !== "skip-ad" ||
    !sender.tab?.id
  ) {
    return;
  }

  click(
    sender.tab.id,
    message.x,
    message.y
  );
});

chrome.debugger.onDetach.addListener(source => {
  if (source.tabId) {
    attached.delete(source.tabId);
  }
});