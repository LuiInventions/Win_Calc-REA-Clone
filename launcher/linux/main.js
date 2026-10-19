const { app, BrowserWindow, Menu, dialog, screen, ipcMain } = require("electron");
const path = require("path");

app.commandLine.appendSwitch("no-sandbox");
app.commandLine.appendSwitch("disable-setuid-sandbox");

const MIN_WIDTH = 320;
const MIN_HEIGHT = 500;

let win = null;
let gesture = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", function () {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });
}

function syncMaximized() {
  if (!win || win.isDestroyed()) return;
  const script = win.isMaximized()
    ? "document.documentElement.classList.add('maximized')"
    : "document.documentElement.classList.remove('maximized')";
  win.webContents.executeJavaScript(script).catch(function () {});
}

function applyGesture() {
  if (!gesture || !win || win.isDestroyed() || win.isMaximized()) return;
  const cursor = screen.getCursorScreenPoint();
  const dx = cursor.x - gesture.origin.x;
  const dy = cursor.y - gesture.origin.y;
  const start = gesture.bounds;
  if (gesture.kind === "drag") {
    win.setBounds({
      x: start.x + dx,
      y: start.y + dy,
      width: start.width,
      height: start.height,
    });
    return;
  }
  let x = start.x;
  let y = start.y;
  let width = start.width;
  let height = start.height;
  const edge = gesture.edge;
  if (edge.right) width = Math.max(MIN_WIDTH, start.width + dx);
  if (edge.bottom) height = Math.max(MIN_HEIGHT, start.height + dy);
  if (edge.left) {
    width = Math.max(MIN_WIDTH, start.width - dx);
    x = start.x + (start.width - width);
  }
  if (edge.top) {
    height = Math.max(MIN_HEIGHT, start.height - dy);
    y = start.y + (start.height - height);
  }
  win.setBounds({ x: x, y: y, width: width, height: height });
}

function createWindow() {
  win = new BrowserWindow({
    width: 320,
    height: 533,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    useContentSize: true,
    show: false,
    frame: false,
    backgroundColor: "#202020",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: false,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.once("ready-to-show", function () { win.show(); });
  win.on("maximize", syncMaximized);
  win.on("unmaximize", syncMaximized);
  win.webContents.setWindowOpenHandler(function () { return { action: "deny" }; });
  win.webContents.on("will-navigate", function (event, url) {
    if (!url.startsWith("file:")) event.preventDefault();
  });
  win.webContents.on("did-fail-load", function (_event, _code, description) {
    dialog.showErrorBox("Calculator", "The calculator could not be opened.\n\n" + description);
  });
  win.loadFile(path.join(__dirname, "index.html"));
}

ipcMain.on("host", function (_event, message) {
  if (!win || win.isDestroyed()) return;
  if (message === "min") win.minimize();
  else if (message === "max") {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  } else if (message === "close") win.close();
});

ipcMain.on("pointer", function (_event, payload) {
  if (!win || win.isDestroyed() || !payload) return;
  if (payload.type === "drag-start" || payload.type === "resize-start") {
    if (win.isMaximized()) return;
    gesture = {
      kind: payload.type === "drag-start" ? "drag" : "resize",
      edge: payload.edge || null,
      origin: screen.getCursorScreenPoint(),
      bounds: win.getBounds(),
    };
    return;
  }
  if (payload.type === "move") applyGesture();
  if (payload.type === "end") gesture = null;
});

app.whenReady().then(function () {
  Menu.setApplicationMenu(null);
  if (gotLock) createWindow();
});

app.on("window-all-closed", function () { app.quit(); });
