const { app, BrowserWindow, Menu } = require("electron");

app.whenReady().then(() => {
  const win = new BrowserWindow({
    height: 800,
    width: 1000,
  });

  Menu.setApplicationMenu(null);

  if (app.isPackaged) {
    win.loadFile("./gui/build/index.html");
  } else {
    win.loadURL("http://localhost:3000");
  }
});
