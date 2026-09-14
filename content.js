(() => {
  if (window.__ENHANCE_V2__) {
    return;
  }

  window.__ENHANCE_V2__ = true;

  let enabled = false;
  let compare = false;

  let motionBlurEnabled = false;
  let motionBlurStrength = 3;

  let video = null;
  let videoContainer = null;

  let compareOverlay = null;
  let compareCanvas = null;
  let compareContext = null;
  let divider = null;

  let originalLabel = null;
  let enhancedLabel = null;

  let motionLayer = null;
  let motionCanvas = null;
  let motionContext = null;

  let sliderPosition = 50;
  let dragging = false;

  let renderGeneration = 0;

  let history = [];
  let historyIndex = 0;
  let historyLength = 0;

  function findVideo() {
    return (
      document.querySelector(
        "video.html5-main-video"
      ) ||
      document.querySelector("video")
    );
  }

  function resetHistory() {
    history = [];
    historyIndex = 0;
    historyLength = 0;
  }

  function frameCount() {
    if (!motionBlurEnabled) {
      return 1;
    }

    return Math.max(
      2,
      Math.min(
        7,
        Math.round(
          1 +
          motionBlurStrength * 0.6
        )
      )
    );
  }

  function buildCompareOverlay() {
    compareOverlay =
      document.getElementById(
        "enhance-comparison"
      );

    if (compareOverlay) {
      compareCanvas =
        document.getElementById(
          "enhance-comparison-canvas"
        );

      compareContext =
        compareCanvas.getContext(
          "2d",
          {
            alpha: false,
            desynchronized: true
          }
        );

      divider =
        document.getElementById(
          "enhance-divider"
        );

      originalLabel =
        document.getElementById(
          "enhance-original-label"
        );

      enhancedLabel =
        document.getElementById(
          "enhance-enhanced-label"
        );

      return;
    }

    compareOverlay =
      document.createElement("div");

    compareOverlay.id =
      "enhance-comparison";

    compareCanvas =
      document.createElement(
        "canvas"
      );

    compareCanvas.id =
      "enhance-comparison-canvas";

    compareContext =
      compareCanvas.getContext(
        "2d",
        {
          alpha: false,
          desynchronized: true
        }
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

    compareOverlay.append(
      compareCanvas,
      divider,
      originalLabel,
      enhancedLabel
    );

    document.body.appendChild(
      compareOverlay
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
  }

  function buildMotionLayer() {
    if (
      !video ||
      !video.parentElement
    ) {
      return;
    }

    const newContainer =
      video.parentElement;

    if (
      motionLayer &&
      videoContainer === newContainer
    ) {
      return;
    }

    motionLayer?.remove();

    videoContainer =
      newContainer;

    const style =
      getComputedStyle(
        videoContainer
      );

    if (
      style.position === "static"
    ) {
      videoContainer.style.position =
        "relative";
    }

    motionLayer =
      document.createElement("div");

    motionLayer.id =
      "enhance-motion-layer";

    motionCanvas =
      document.createElement(
        "canvas"
      );

    motionCanvas.id =
      "enhance-motion-canvas";

    motionContext =
      motionCanvas.getContext(
        "2d",
        {
          alpha: false,
          desynchronized: true
        }
      );

    motionLayer.appendChild(
      motionCanvas
    );

    videoContainer.appendChild(
      motionLayer
    );
  }

  function attachVideo() {
    const found =
      findVideo();

    if (!found) {
      return;
    }

    if (found === video) {
      return;
    }

    if (video) {
      video.classList.remove(
        "enhance-active"
      );
    }

    video = found;

    buildMotionLayer();

    video.addEventListener(
      "seeking",
      resetHistory
    );

    video.addEventListener(
      "emptied",
      resetHistory
    );

    resetHistory();

    updateState();
  }

  function getVideoRect() {
    if (!video) {
      return null;
    }

    const rect =
      video.getBoundingClientRect();

    if (
      rect.width <= 0 ||
      rect.height <= 0
    ) {
      return null;
    }

    return rect;
  }

  function resizeCanvas(
    canvas,
    width,
    height
  ) {
    const ratio = Math.min(
      window.devicePixelRatio || 1,
      1.25
    );

    const targetWidth =
      Math.max(
        1,
        Math.floor(
          width * ratio
        )
      );

    const targetHeight =
      Math.max(
        1,
        Math.floor(
          height * ratio
        )
      );

    if (
      canvas.width !== targetWidth ||
      canvas.height !== targetHeight
    ) {
      canvas.width =
        targetWidth;

      canvas.height =
        targetHeight;

      resetHistory();
    }
  }

  function updateCompareBounds() {
    if (
      !video ||
      !compareOverlay
    ) {
      return;
    }

    const rect =
      getVideoRect();

    if (!rect) {
      return;
    }

    compareOverlay.style.left =
      `${rect.left}px`;

    compareOverlay.style.top =
      `${rect.top}px`;

    compareOverlay.style.width =
      `${rect.width}px`;

    compareOverlay.style.height =
      `${rect.height}px`;

    resizeCanvas(
      compareCanvas,
      rect.width,
      rect.height
    );

    updateSlider();
  }

  function updateMotionBounds() {
    if (
      !video ||
      !videoContainer ||
      !motionLayer
    ) {
      return;
    }

    const videoRect =
      getVideoRect();

    if (!videoRect) {
      return;
    }

    const containerRect =
      videoContainer.getBoundingClientRect();

    motionLayer.style.left =
      `${videoRect.left - containerRect.left}px`;

    motionLayer.style.top =
      `${videoRect.top - containerRect.top}px`;

    motionLayer.style.width =
      `${videoRect.width}px`;

    motionLayer.style.height =
      `${videoRect.height}px`;

    resizeCanvas(
      motionCanvas,
      videoRect.width,
      videoRect.height
    );
  }

  function updateSlider() {
    if (
      !compareCanvas ||
      !divider
    ) {
      return;
    }

    divider.style.left =
      `${sliderPosition}%`;

    compareCanvas.style.clipPath =
      `inset(0 0 0 ${sliderPosition}%)`;

    originalLabel.style.opacity =
      sliderPosition < 13
        ? "0"
        : "1";

    enhancedLabel.style.opacity =
      sliderPosition > 87
        ? "0"
        : "1";
  }

  function pointerPercent(event) {
    const rect =
      compareOverlay.getBoundingClientRect();

    return Math.max(
      3,
      Math.min(
        97,
        (
          (
            event.clientX -
            rect.left
          ) /
          rect.width
        ) *
        100
      )
    );
  }

  function startDrag(event) {
    dragging = true;

    sliderPosition =
      pointerPercent(event);

    updateSlider();

    event.preventDefault();
    event.stopPropagation();

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

    sliderPosition =
      pointerPercent(event);

    updateSlider();
  }

  function stopDrag() {
    dragging = false;
  }

  function ensureHistoryCanvas(
    index,
    width,
    height
  ) {
    if (!history[index]) {
      const canvas =
        document.createElement(
          "canvas"
        );

      history[index] = {
        canvas,
        context:
          canvas.getContext(
            "2d",
            {
              alpha: false
            }
          )
      };
    }

    const item =
      history[index];

    if (
      item.canvas.width !== width ||
      item.canvas.height !== height
    ) {
      item.canvas.width = width;
      item.canvas.height = height;
    }

    return item;
  }

  function captureFrame(
    width,
    height
  ) {
    const count =
      frameCount();

    while (
      history.length > count
    ) {
      history.pop();
    }

    if (
      historyIndex >= count
    ) {
      historyIndex = 0;
    }

    const item =
      ensureHistoryCanvas(
        historyIndex,
        width,
        height
      );

    try {
      item.context.drawImage(
        video,
        0,
        0,
        width,
        height
      );
    } catch {
      return;
    }

    historyIndex =
      (historyIndex + 1) %
      count;

    historyLength =
      Math.min(
        historyLength + 1,
        count
      );
  }

  function orderedFrames() {
    if (
      historyLength === 0
    ) {
      return [];
    }

    const count =
      frameCount();

    const output = [];

    const start =
      historyLength < count
        ? 0
        : historyIndex;

    for (
      let i = 0;
      i < historyLength;
      i++
    ) {
      const index =
        (
          start + i
        ) %
        count;

      if (history[index]) {
        output.push(
          history[index].canvas
        );
      }
    }

    return output;
  }

  function composeFrames(
    context,
    canvas
  ) {
    const frames =
      orderedFrames();

    if (!frames.length) {
      try {
        context.globalAlpha = 1;

        context.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );
      } catch {}

      return;
    }

    context.globalAlpha = 1;

    context.drawImage(
      frames[0],
      0,
      0,
      canvas.width,
      canvas.height
    );

    if (
      !motionBlurEnabled
    ) {
      return;
    }

    const blend =
      Math.max(
        0.33,
        0.54 -
        motionBlurStrength *
        0.018
      );

    for (
      let i = 1;
      i < frames.length;
      i++
    ) {
      context.globalAlpha =
        blend;

      context.drawImage(
        frames[i],
        0,
        0,
        canvas.width,
        canvas.height
      );
    }

    context.globalAlpha = 1;
  }

  function renderFrame() {
    if (
      !video ||
      video.readyState < 2
    ) {
      return;
    }

    let targetCanvas = null;
    let targetContext = null;

    if (compare) {
      targetCanvas =
        compareCanvas;

      targetContext =
        compareContext;
    } else if (
      enabled &&
      motionBlurEnabled
    ) {
      targetCanvas =
        motionCanvas;

      targetContext =
        motionContext;
    }

    if (
      !targetCanvas ||
      !targetContext
    ) {
      return;
    }

    captureFrame(
      targetCanvas.width,
      targetCanvas.height
    );

    composeFrames(
      targetContext,
      targetCanvas
    );
  }

  function startRenderer() {
    const generation =
      ++renderGeneration;

    function frame() {
      if (
        generation !==
        renderGeneration
      ) {
        return;
      }

      if (
        !enabled ||
        (
          !compare &&
          !motionBlurEnabled
        )
      ) {
        return;
      }

      if (compare) {
        updateCompareBounds();
      } else {
        updateMotionBounds();
      }

      renderFrame();

      if (
        typeof
          video
            ?.requestVideoFrameCallback ===
        "function"
      ) {
        video.requestVideoFrameCallback(
          frame
        );
      } else {
        requestAnimationFrame(
          frame
        );
      }
    }

    renderFrame();
    frame();
  }

  function stopRenderer() {
    renderGeneration++;
  }

  function updateState() {
    buildCompareOverlay();

    if (!video) {
      attachVideo();
    }

    if (!video) {
      return;
    }

    buildMotionLayer();

    stopRenderer();

    video.classList.remove(
      "enhance-active"
    );

    compareOverlay.classList.remove(
      "enhance-visible"
    );

    motionLayer.classList.remove(
      "enhance-visible"
    );

    if (!enabled) {
      compare = false;

      resetHistory();

      return;
    }

    if (compare) {
      compareOverlay.classList.add(
        "enhance-visible"
      );

      enhancedLabel.textContent =
        motionBlurEnabled
          ? "Enhanced + Motion"
          : "Enhanced";

      updateCompareBounds();

      resetHistory();

      startRenderer();

      return;
    }

    if (motionBlurEnabled) {
      motionLayer.classList.add(
        "enhance-visible"
      );

      updateMotionBounds();

      resetHistory();

      startRenderer();

      return;
    }

    video.classList.add(
      "enhance-active"
    );

    resetHistory();
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
        message.type === "GET_STATE"
      ) {
        sendResponse({
          enabled,
          compare,
          motionBlurEnabled,
          motionBlurStrength
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
            compare: false
          });

          return;
        }

        compare =
          !compare;

        chrome.storage.local.set({
          compareEnabled:
            compare
        });

        updateState();

        sendResponse({
          compare
        });

        return;
      }

      if (
        message.type ===
        "SET_MOTION_BLUR"
      ) {
        motionBlurEnabled =
          Boolean(
            message.enabled
          );

        resetHistory();

        updateState();

        sendResponse({
          motionBlurEnabled
        });

        return;
      }

      if (
        message.type ===
        "SET_MOTION_STRENGTH"
      ) {
        motionBlurStrength =
          Math.max(
            1,
            Math.min(
              10,
              Number(
                message.strength
              ) || 3
            )
          );

        resetHistory();

        updateState();

        sendResponse({
          motionBlurStrength
        });
      }
    }
  );

  chrome.storage.onChanged.addListener(
    (
      changes,
      area
    ) => {
      if (
        area !== "local"
      ) {
        return;
      }

      let changed = false;

      if (
        changes.enhanceEnabled
      ) {
        enabled =
          Boolean(
            changes
              .enhanceEnabled
              .newValue
          );

        changed = true;
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

        changed = true;
      }

      if (
        changes.motionBlurEnabled
      ) {
        motionBlurEnabled =
          Boolean(
            changes
              .motionBlurEnabled
              .newValue
          );

        changed = true;
      }

      if (
        changes.motionBlurStrength
      ) {
        motionBlurStrength =
          Number(
            changes
              .motionBlurStrength
              .newValue
          ) || 3;

        changed = true;
      }

      if (!enabled) {
        compare = false;
      }

      if (changed) {
        resetHistory();
        updateState();
      }
    }
  );

  window.addEventListener(
    "resize",
    () => {
      updateCompareBounds();
      updateMotionBounds();
    }
  );

  window.addEventListener(
    "scroll",
    () => {
      if (compare) {
        updateCompareBounds();
      }
    },
    true
  );

  document.addEventListener(
    "fullscreenchange",
    () => {
      setTimeout(
        () => {
          updateCompareBounds();
          updateMotionBounds();
        },
        100
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
        250
      );
    }
  );

  const observer =
    new MutationObserver(
      attachVideo
    );

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
      compareEnabled: false,
      motionBlurEnabled: false,
      motionBlurStrength: 3
    },
    settings => {
      enabled =
        Boolean(
          settings.enhanceEnabled
        );

      compare =
        Boolean(
          settings.compareEnabled
        );

      motionBlurEnabled =
        Boolean(
          settings.motionBlurEnabled
        );

      motionBlurStrength =
        Number(
          settings.motionBlurStrength
        ) || 3;

      if (!enabled) {
        compare = false;
      }

      buildCompareOverlay();

      attachVideo();

      updateState();
    }
  );
})();