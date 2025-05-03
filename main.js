const {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  shell,
} = require("electron");
const fs = require("fs");
const path = require("path");

let win;

function createWindow() {
  win = new BrowserWindow({
    height: 800,
    width: 1000,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Menu.setApplicationMenu(null);

  if (app.isPackaged) {
    win.loadFile("./gui/build/index.html");
  } else {
    win.loadURL("http://localhost:5173");
  }
}

app.whenReady().then(() => {
  createWindow();

  // 处理选择项目目录
  ipcMain.handle("select-project-directory", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });

    if (canceled) return { success: false };

    const dirPath = filePaths[0];
    const configPath = path.join(dirPath, ".roplat");

    if (fs.existsSync(configPath)) {
      try {
        const configData = JSON.parse(fs.readFileSync(configPath, "utf8"));
        return {
          success: true,
          projectPath: dirPath,
          projectName: configData.projectName || path.basename(dirPath),
        };
      } catch (err) {
        return {
          success: false,
          error: "配置文件损坏或无效",
        };
      }
    } else {
      return {
        success: false,
        error: "所选文件夹不是有效的项目文件夹",
      };
    }
  });

  // 处理选择项目配置文件
  ipcMain.handle("select-project-file", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      filters: [{ name: "项目配置文件", extensions: ["roplat"] }],
    });

    if (canceled) return { success: false };

    try {
      const filePath = filePaths[0];
      const dirPath = path.dirname(filePath);
      const configData = JSON.parse(fs.readFileSync(filePath, "utf8"));

      return {
        success: true,
        projectPath: dirPath,
        projectName: configData.projectName || path.basename(dirPath),
      };
    } catch (err) {
      return {
        success: false,
        error: "配置文件损坏或无效",
      };
    }
  });

  // 创建新项目
  ipcMain.handle(
    "create-project",
    async (event, { projectPath, projectName }) => {
      if (!projectPath || !projectName) {
        return { success: false, error: "项目路径或名称不能为空" };
      }

      const dirPath = path.join(projectPath, projectName);

      try {
        // 检查目录是否已存在
        if (fs.existsSync(dirPath)) {
          // 检查目录是否为空
          const files = fs.readdirSync(dirPath);
          if (files.length > 0) {
            return { success: false, error: "所选目录不为空" };
          }
        } else {
          // 创建目录
          fs.mkdirSync(dirPath, { recursive: true });
        }

        // 创建项目配置文件
        const configPath = path.join(dirPath, ".roplat");
        const configData = {
          projectName: projectName,
          createdAt: new Date().toISOString(),
          nextId: 1, // 初始化ID计数器
        };

        fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

        return {
          success: true,
          projectPath: dirPath,
          projectName: projectName,
        };
      } catch (err) {
        return {
          success: false,
          error: `创建项目失败: ${err.message}`,
        };
      }
    }
  );

  // 选择项目父目录
  ipcMain.handle("select-parent-directory", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });

    if (canceled) return { success: false };
    return { success: true, directoryPath: filePaths[0] };
  });

  // 打开项目目录
  ipcMain.handle("open-directory", async (event, dirPath) => {
    if (dirPath) {
      shell.openPath(dirPath);
      return { success: true };
    }
    return { success: false };
  });

  // 读取项目配置文件
  ipcMain.handle("read-project-config", async (event, configPath) => {
    try {
      if (!fs.existsSync(configPath)) {
        return {
          success: false,
          error: "配置文件不存在",
        };
      }

      const configData = JSON.parse(fs.readFileSync(configPath, "utf8"));
      return {
        success: true,
        config: configData,
      };
    } catch (err) {
      return {
        success: false,
        error: `读取配置失败: ${err.message}`,
      };
    }
  });

  // 写入项目配置文件
  ipcMain.handle(
    "write-project-config",
    async (event, configPath, configData) => {
      try {
        fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: `保存配置失败: ${err.message}`,
        };
      }
    }
  );
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
