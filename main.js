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
    win.loadFile("./gui/dist/index.html");
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
          robots: [],
          sensors: [],
          tasks: [],
          idCounters: {
            nextId: 1,
            pandaCounter: 0,
            urCounter: 0,
            sensorACounter: 0, 
            sensorBCounter: 0,
            taskCounter: 0
          },
          task_graph: []
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

  // 导出配置文件
  ipcMain.handle(
    "export-config-file",
    async (event, projectPath, configData) => {
      try {
        const configFilePath = path.join(projectPath, "config.json");
        // 写入紧凑格式的JSON文件（没有空格和换行）
        fs.writeFileSync(configFilePath, JSON.stringify(configData));
        return { 
          success: true,
          filePath: configFilePath
        };
      } catch (err) {
        return {
          success: false,
          error: `导出配置失败: ${err.message}`,
        };
      }
    }
  );

  // 导出任务文件
  ipcMain.handle(
    "export-task-file",
    async (event, projectPath, taskData) => {
      try {
        const taskFilePath = path.join(projectPath, "task.json");
        // 写入格式化的JSON文件（含有缩进和换行，便于阅读）
        fs.writeFileSync(taskFilePath, JSON.stringify(taskData, null, 2));
        return { 
          success: true,
          filePath: taskFilePath
        };
      } catch (err) {
        return {
          success: false,
          error: `导出任务文件失败: ${err.message}`,
        };
      }
    }
  );

  // 读取UI设计文件
  ipcMain.handle("read-ui-file", async (event, filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: "UI设计文件不存在",
        };
      }

      const designData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return {
        success: true,
        design: designData,
      };
    } catch (err) {
      return {
        success: false,
        error: `读取UI设计失败: ${err.message}`,
      };
    }
  });

  // 写入UI设计文件
  ipcMain.handle(
    "write-ui-file",
    async (event, filePath, designData) => {
      try {
        // 确保目录存在
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, JSON.stringify(designData, null, 2));
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: `保存UI设计失败: ${err.message}`,
        };
      }
    }
  );

  // 选择图片文件
  ipcMain.handle("select-image-file", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      filters: [
        { name: "图片文件", extensions: ["jpg", "jpeg", "png", "gif", "bmp", "svg"] }
      ]
    });
    
    if (canceled) return { success: false };
    
    try {
      const filePath = filePaths[0];
      return {
        success: true,
        filePath: filePath
      };
    } catch (err) {
      return {
        success: false,
        error: `选择图片失败: ${err.message}`,
      };
    }
  });
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
