(() => {
  if (window.__ENHANCE_LOADED__) {
    return;
  }

  window.__ENHANCE_LOADED__ = true;

  let enabled = false;
  let compare = false;

  let video = null;

  let overlay = null;
  let canvas = null;
  let context = null;

  let rightSide = null;
  let rightInner = null;

  let divider = null;

  let originalLabel = null;
  let enhancedLabel = null;

  let position = 50;

  let dragging = false;

  let animationFrame = null;
  let videoFrame = null;

  function getVideo() {
    return (
      document.querySelector(
        "video.html5-main-video"
      ) ||
      document.querySelector("video")
    );
  }

  function buildOverlay() {
    if (
      document.getElementById(
        "enhance-comparison"
      )
    ) {
      overlay =
        document.getElementById(
          "enhance-comparison"
        );

      return;
    }

    overlay =
      document.createElement("div");

    overlay.id =
      "enhance-comparison";

    canvas =
      document.createElement("canvas");

    canvas.id =
      "enhance-canvas";

    context = canvas.getContext(
      "2d",
      {
        alpha: false,
        desynchronized: true
      }
    );

    rightSide =
      document.createElement("div");

    rightSide.id =
      "enhance-right-side";

    rightInner =
      document.createElement("div");

    rightInner.id =
      "enhance-right-inner";

    rightSide.appendChild(
      rightInner
    );

    divider =
      document.createElement("div");

    divider.id =
      "enhance-divider";

    originalLabel =
      document.createElement("div");

    originalLabel.id =
      "enhance-original-label";

    originalLabel.className =
      "enhance-label";

    originalLabel.textContent =
      "Original";

    enhancedLabel =
      document.createElement("div");

    enhancedLabel.id =
      "enhance-enhanced-label";

    enhancedLabel.className =
      "enhance-label";

    enhancedLabel.textContent =
      "Enhanced";

    overlay.appendChild(canvas);

    overlay.appendChild(
      rightSide
    );

    overlay.appendChild(
      divider
    );

    overlay.appendChild(
      originalLabel
    );

    overlay.appendChild(
      enhancedLabel
    );

    document.body.appendChild(
      overlay
    );

    divider.addEventListener(
      "pointerdown",
      startDrag
    );

    window.addEventListener(
      "pointermove",
      moveDrag,
      true
    );

    window.addEventListener(
      "pointerup",
      stopDrag,
      true
    );

    updateSlider();
  }

  function attachVideo() {
    const found = getVideo();

    if (!found) {
      return;
    }

    if (video === found) {
      return;
    }

    if (video) {
      video.classList.remove(
        "enhance-active"
      );
    }

    video = found;

    updateState();
    updateBounds();
  }

  function updateBounds() {
    if (
      !video ||
      !overlay
    ) {
      return;
    }

    const rect =
      video.getBoundingClientRect();

    if (
      rect.width <= 0 ||
      rect.height <= 0
    ) {
      return;
    }

    overlay.style.left =
      `${rect.left}px`;

    overlay.style.top =
      `${rect.top}px`;

    overlay.style.width =
      `${rect.width}px`;

    overlay.style.height =
      `${rect.height}px`;

    const ratio = Math.min(
      window.devicePixelRatio || 1,
      1.25
    );

    const width = Math.floor(
      rect.width * ratio
    );

    const height = Math.floor(
      rect.height * ratio
    );

    if (
      canvas.width !== width ||
      canvas.height !== height
    ) {
      canvas.width = width;
      canvas.height = height;
    }

    rightInner.style.width =
      `${rect.width}px`;

    updateSlider();
  }

  function updateSlider() {
    if (
      !overlay ||
      !divider ||
      !rightSide ||
      !rightInner
    ) {
      return;
    }

    divider.style.left =
      `${position}%`;

    const right =
      100 - position;

    rightSide.style.left =
      `${position}%`;

    rightSide.style.width =
      `${right}%`;

    rightInner.style.right = "0";

    canvas.style.clipPath =
      `inset(0 0 0 ${position}%)`;

    originalLabel.style.opacity =
      position < 13
        ? "0"
        : "1";

    enhancedLabel.style.opacity =
      position > 87
        ? "0"
        : "1";
  }

  function pointerPercent(event) {
    if (!overlay) {
      return position;
    }

    const rect =
      overlay.getBoundingClientRect();

    const value =
      ((event.clientX - rect.left) /
        rect.width) *
      100;

    return Math.max(
      3,
      Math.min(97, value)
    );
  }

  function startDrag(event) {
    dragging = true;

    event.preventDefault();
    event.stopPropagation();

    position =
      pointerPercent(event);

    updateSlider();

    try {
      divider.setPointerCapture(
        event.pointerId
      );
    } catch {}
  }

  function moveDrag(event) {
    if (!dragging) {
      return;
    }

    position =
      pointerPercent(event);

    updateSlider();
  }

  function stopDrag() {
    dragging = false;
  }

  function draw() {
    if (
      !video ||
      !canvas ||
      !context ||
      !enabled ||
      !compare
    ) {
      return;
    }

    if (
      video.readyState >= 2
    ) {
      try {
        context.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );
      } catch {}
    }
  }

  function stopRenderer() {
    if (animationFrame) {
      cancelAnimationFrame(
        animationFrame
      );

      animationFrame = null;
    }

    videoFrame = null;
  }

  function startRenderer() {
    stopRenderer();

    if (!video) {
      return;
    }

    const renderRAF = () => {
      if (
        !enabled ||
        !compare
      ) {
        return;
      }

      draw();
      updateBounds();

      animationFrame =
        requestAnimationFrame(
          renderRAF
        );
    };

    animationFrame =
      requestAnimationFrame(
        renderRAF
      );
  }

  function updateState() {
    buildOverlay();
    attachVideo();

    if (!video) {
      return;
    }

    if (!enabled) {
      compare = false;

      video.classList.remove(
        "enhance-active"
      );

      overlay.classList.remove(
        "enhance-visible"
      );

      stopRenderer();

      return;
    }

    if (compare) {
      video.classList.remove(
        "enhance-active"
      );

      overlay.classList.add(
        "enhance-visible"
      );

      updateBounds();
      updateSlider();

      startRenderer();

      return;
    }

    overlay.classList.remove(
      "enhance-visible"
    );

    video.classList.add(
      "enhance-active"
    );

    stopRenderer();
  }

  chrome.runtime.onMessage.addListener(
    (
      message,
      sender,
      sendResponse
    ) => {
      if (
        message.type === "PING"
      ) {
        sendResponse({
          ok: true
        });

        return;
      }

      if (
        message.type ===
        "GET_STATE"
      ) {
        sendResponse({
          enabled,
          compare
        });

        return;
      }

      if (
        message.type ===
        "SET_ENABLED"
      ) {
        enabled =
          Boolean(
            message.enabled
          );

        if (!enabled) {
          compare = false;
        }

        chrome.storage.local.set({
          enhanceEnabled:
            enabled,

          compareEnabled:
            compare
        });

        updateState();

        sendResponse({
          enabled,
          compare
        });

        return;
      }

      if (
        message.type ===
        "TOGGLE_COMPARE"
      ) {
        if (!enabled) {
          sendResponse({
            enabled,
            compare: false
          });

          return;
        }

        compare = !compare;

        chrome.storage.local.set({
          compareEnabled:
            compare
        });

        updateState();

        sendResponse({
          enabled,
          compare
        });
      }
    }
  );

  chrome.storage.onChanged.addListener(
    (changes, area) => {
      if (
        area !== "local"
      ) {
        return;
      }

      if (
        changes.enhanceEnabled
      ) {
        enabled =
          Boolean(
            changes
              .enhanceEnabled
              .newValue
          );
      }

      if (
        changes.compareEnabled
      ) {
        compare =
          Boolean(
            changes
              .compareEnabled
              .newValue
          );
      }

      if (!enabled) {
        compare = false;
      }

      updateState();
    }
  );

  window.addEventListener(
    "resize",
    updateBounds
  );

  window.addEventListener(
    "scroll",
    updateBounds,
    true
  );

  document.addEventListener(
    "fullscreenchange",
    () => {
      setTimeout(
        updateBounds,
        100
      );

      setTimeout(
        updateBounds,
        500
      );
    }
  );

  document.addEventListener(
    "yt-navigate-finish",
    () => {
      setTimeout(
        () => {
          attachVideo();
          updateState();
        },
        300
      );
    }
  );

  const observer =
    new MutationObserver(() => {
      attachVideo();
    });

  observer.observe(
    document.documentElement,
    {
      childList: true,
      subtree: true
    }
  );

  chrome.storage.local.get(
    {
      enhanceEnabled: false,
      compareEnabled: false
    },
    result => {
      enabled =
        Boolean(
          result.enhanceEnabled
        );

      compare =
        Boolean(
          result.compareEnabled
        );

      if (!enabled) {
        compare = false;
      }

      buildOverlay();
      attachVideo();
      updateState();

      setInterval(
        () => {
          attachVideo();

          if (compare) {
            updateBounds();
          }
        },
        1000
      );
    }
  );
})();