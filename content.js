let enabled = false;
let compareMode = false;

let video = null;
let parent = null;

let overlay = null;
let canvas = null;
let context = null;
let divider = null;

let originalLabel = null;
let enhancedLabel = null;

let originalInlineFilter = "";

let comparePosition = 50;
let dragging = false;

let frameToken = 0;
let resizeObserver = null;

function createFilter() {
  if (document.getElementById("enhance-filter-svg")) {
    return;
  }

  const wrapper = document.createElement("div");

  wrapper.innerHTML = `
    <svg
      id="enhance-filter-svg"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter
          id="enhance-video-filter"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          color-interpolation-filters="sRGB"
        >
          <feColorMatrix
            type="matrix"
            values="
              1.07 0    0    0 -0.015
              0    1.06 0    0 -0.010
              0    0    1.05 0 -0.005
              0    0    0    1  0
            "
            result="color"
          />

          <feConvolveMatrix
            in="color"
            order="3"
            kernelMatrix="
               0    -0.12  0
              -0.12  1.48 -0.12
               0    -0.12  0
            "
            divisor="1"
            bias="0"
            preserveAlpha="true"
          />
        </filter>
      </defs>
    </svg>
  `;

  const svg = wrapper.firstElementChild;

  document.documentElement.appendChild(svg);
}

function getVideo() {
  return document.querySelector("video.html5-main-video")
    || document.querySelector("video");
}

function attachVideo(nextVideo) {
  if (!nextVideo || nextVideo === video) {
    return;
  }

  cleanupVideo();

  video = nextVideo;
  parent = video.parentElement;

  if (!parent) {
    return;
  }

  originalInlineFilter = video.style.filter || "";

  const computedPosition = getComputedStyle(parent).position;

  if (computedPosition === "static") {
    parent.style.position = "relative";
  }

  createComparisonUI();

  resizeObserver = new ResizeObserver(() => {
    updateOverlayLayout();
  });

  resizeObserver.observe(video);

  video.addEventListener(
    "loadedmetadata",
    updateOverlayLayout
  );

  video.addEventListener(
    "emptied",
    findAndAttachVideo
  );

  updateMode();
}

function cleanupVideo() {
  frameToken++;

  resizeObserver?.disconnect();
  resizeObserver = null;

  if (video) {
    video.style.filter = originalInlineFilter;
  }

  overlay?.remove();

  overlay = null;
  canvas = null;
  context = null;
  divider = null;

  originalLabel = null;
  enhancedLabel = null;

  video = null;
  parent = null;
}

function createComparisonUI() {
  overlay = document.createElement("div");
  overlay.id = "enhance-comparison-layer";
  overlay.classList.add("enhance-hidden");

  canvas = document.createElement("canvas");
  canvas.id = "enhance-comparison-canvas";

  context = canvas.getContext("2d", {
    alpha: false,
    desynchronized: true
  });

  divider = document.createElement("div");
  divider.id = "enhance-divider";

  originalLabel = document.createElement("div");
  originalLabel.id = "enhance-label-original";
  originalLabel.className = "enhance-label";
  originalLabel.textContent = "Original";

  enhancedLabel = document.createElement("div");
  enhancedLabel.id = "enhance-label-enhanced";
  enhancedLabel.className = "enhance-label";
  enhancedLabel.textContent = "Enhanced";

  overlay.append(
    canvas,
    divider,
    originalLabel,
    enhancedLabel
  );

  parent.appendChild(overlay);

  divider.addEventListener(
    "pointerdown",
    startDrag
  );

  window.addEventListener(
    "pointermove",
    drag
  );

  window.addEventListener(
    "pointerup",
    stopDrag
  );

  updateOverlayLayout();
  updateComparisonPosition();
}

function updateOverlayLayout() {
  if (!video || !parent || !overlay) {
    return;
  }

  const videoRect = video.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();

  const width = videoRect.width;
  const height = videoRect.height;

  if (!width || !height) {
    return;
  }

  overlay.style.left =
    `${videoRect.left - parentRect.left}px`;

  overlay.style.top =
    `${videoRect.top - parentRect.top}px`;

  overlay.style.width = `${width}px`;
  overlay.style.height = `${height}px`;

  const pixelRatio = Math.min(
    window.devicePixelRatio || 1,
    1.25
  );

  const targetWidth = Math.round(
    width * pixelRatio
  );

  const targetHeight = Math.round(
    height * pixelRatio
  );

  if (
    canvas.width !== targetWidth ||
    canvas.height !== targetHeight
  ) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  updateComparisonPosition();
}

function startDrag(event) {
  if (!compareMode) {
    return;
  }

  dragging = true;

  divider.setPointerCapture?.(
    event.pointerId
  );

  setPositionFromPointer(event);
}

function drag(event) {
  if (!dragging || !compareMode) {
    return;
  }

  setPositionFromPointer(event);
}

function stopDrag() {
  dragging = false;
}

function setPositionFromPointer(event) {
  if (!overlay) {
    return;
  }

  const rect = overlay.getBoundingClientRect();

  let percent =
    ((event.clientX - rect.left) / rect.width) * 100;

  percent = Math.max(
    4,
    Math.min(96, percent)
  );

  comparePosition = percent;

  updateComparisonPosition();
}

function updateComparisonPosition() {
  if (!overlay || !canvas || !divider) {
    return;
  }

  divider.style.left =
    `${comparePosition}%`;

  canvas.style.clipPath =
    `inset(0 0 0 ${comparePosition}%)`;

  const leftWidth = comparePosition;
  const rightWidth = 100 - comparePosition;

  originalLabel.style.opacity =
    leftWidth < 16 ? "0" : "1";

  enhancedLabel.style.opacity =
    rightWidth < 16 ? "0" : "1";
}

function getEnhancedFilter() {
  const base = originalInlineFilter.trim();

  if (base) {
    return `${base} url("#enhance-video-filter")`;
  }

  return 'url("#enhance-video-filter")';
}

function updateMode() {
  if (!video) {
    return;
  }

  frameToken++;

  if (!enabled) {
    compareMode = false;

    video.style.filter =
      originalInlineFilter;

    overlay?.classList.add(
      "enhance-hidden"
    );

    return;
  }

  if (compareMode) {
    video.style.filter =
      originalInlineFilter;

    overlay?.classList.remove(
      "enhance-hidden"
    );

    updateOverlayLayout();
    startComparisonRenderer();

    return;
  }

  overlay?.classList.add(
    "enhance-hidden"
  );

  video.style.filter =
    getEnhancedFilter();
}

function startComparisonRenderer() {
  const token = ++frameToken;

  function render() {
    if (
      token !== frameToken ||
      !enabled ||
      !compareMode ||
      !video ||
      !canvas ||
      !context
    ) {
      return;
    }

    drawFrame();

    if (
      typeof video.requestVideoFrameCallback ===
      "function"
    ) {
      video.requestVideoFrameCallback(render);
    } else {
      requestAnimationFrame(render);
    }
  }

  render();
}

function drawFrame() {
  if (
    !video ||
    !canvas ||
    !context ||
    video.readyState < 2
  ) {
    return;
  }

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

function findAndAttachVideo() {
  const nextVideo = getVideo();

  if (
    nextVideo &&
    nextVideo !== video
  ) {
    attachVideo(nextVideo);
  } else if (
    nextVideo &&
    overlay
  ) {
    updateOverlayLayout();
  }
}

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    if (message.type === "SET_ENABLED") {
      enabled = Boolean(
        message.enabled
      );

      if (!enabled) {
        compareMode = false;
      }

      updateMode();

      sendResponse({
        enabled,
        compare: compareMode
      });

      return;
    }

    if (message.type === "TOGGLE_COMPARE") {
      if (!enabled) {
        sendResponse({
          enabled,
          compare: false
        });

        return;
      }

      compareMode = !compareMode;

      updateMode();

      sendResponse({
        enabled,
        compare: compareMode
      });

      return;
    }

    if (message.type === "GET_STATE") {
      sendResponse({
        enabled,
        compare: compareMode
      });
    }
  }
);

chrome.storage.onChanged.addListener(
  (changes, area) => {
    if (
      area !== "local" ||
      !changes.enhanceEnabled
    ) {
      return;
    }

    enabled = Boolean(
      changes.enhanceEnabled.newValue
    );

    if (!enabled) {
      compareMode = false;
    }

    updateMode();
  }
);

document.addEventListener(
  "yt-navigate-finish",
  () => {
    setTimeout(
      findAndAttachVideo,
      250
    );
  }
);

document.addEventListener(
  "fullscreenchange",
  () => {
    setTimeout(
      updateOverlayLayout,
      100
    );
  }
);

window.addEventListener(
  "resize",
  updateOverlayLayout
);

const observer = new MutationObserver(() => {
  findAndAttachVideo();
});

observer.observe(
  document.documentElement,
  {
    childList: true,
    subtree: true
  }
);

createFilter();

chrome.storage.local.get(
  {
    enhanceEnabled: false
  },
  result => {
    enabled = Boolean(
      result.enhanceEnabled
    );

    findAndAttachVideo();
  }
);