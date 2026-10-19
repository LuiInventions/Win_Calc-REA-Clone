const { ipcRenderer } = require("electron");

window.chrome = window.chrome || {};
window.chrome.webview = window.chrome.webview || {};
window.chrome.webview.postMessage = function (message) {
  ipcRenderer.send("host", String(message));
};

const GRIP = 6;
let gesture = null;

function edgeAt(event) {
  if (document.documentElement.classList.contains("maximized")) return null;
  const left = event.clientX < GRIP;
  const right = event.clientX >= window.innerWidth - GRIP;
  const top = event.clientY < GRIP;
  const bottom = event.clientY >= window.innerHeight - GRIP;
  if (!left && !right && !top && !bottom) return null;
  return { left: left, right: right, top: top, bottom: bottom };
}

function cursorFor(edge) {
  if (!edge) return "";
  if ((edge.top && edge.left) || (edge.bottom && edge.right)) return "nwse-resize";
  if ((edge.top && edge.right) || (edge.bottom && edge.left)) return "nesw-resize";
  if (edge.left || edge.right) return "ew-resize";
  return "ns-resize";
}

function isControl(target) {
  return !!(target && target.closest && target.closest("button, input, select, textarea, a, label"));
}

document.addEventListener("pointerdown", function (event) {
  if (event.button !== 0) return;
  const edge = edgeAt(event);
  if (edge) {
    gesture = "resize";
    document.documentElement.setPointerCapture(event.pointerId);
    ipcRenderer.send("pointer", { type: "resize-start", edge: edge });
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  const top = event.target.closest && event.target.closest(".top");
  if (!top || isControl(event.target)) return;
  gesture = "drag";
  document.documentElement.setPointerCapture(event.pointerId);
  ipcRenderer.send("pointer", { type: "drag-start" });
}, true);

document.addEventListener("pointermove", function (event) {
  if (!gesture) document.documentElement.style.cursor = cursorFor(edgeAt(event));
  if (gesture) ipcRenderer.send("pointer", { type: "move" });
}, true);

function endGesture(event) {
  if (!gesture) return;
  gesture = null;
  document.documentElement.style.cursor = "";
  if (event && document.documentElement.hasPointerCapture(event.pointerId)) {
    document.documentElement.releasePointerCapture(event.pointerId);
  }
  ipcRenderer.send("pointer", { type: "end" });
}

document.addEventListener("pointerup", endGesture, true);
document.addEventListener("pointercancel", endGesture, true);
