const {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  shell,
  desktopCapturer,
} = require("electron");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { v4: uuidv4 } = require("uuid");

let win;

// 存储窗口源的缓存，用于快速检查窗口是否仍然存在
let windowSourcesCache = {};
let lastSourcesUpdateTime = 0;
const SOURCES_CACHE_TTL = 2000; // 缓存有效期2秒

// 存储所有运行中的机器人平台进程
let runningProcesses = {};

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

  // 获取所有可用窗口源
  ipcMain.handle("get-window-sources", async () => {
    try {
      // 获取所有窗口和屏幕源
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 300, height: 200 },
        fetchWindowIcons: true
      });
      
      // 更新缓存
      windowSourcesCache = {};
      sources.forEach(source => {
        windowSourcesCache[source.id] = {
          id: source.id,
          name: source.name,
          thumbnail: source.thumbnail.toDataURL(),
          appIcon: source.appIcon?.toDataURL(),
          display_id: source.display_id,
          timestamp: Date.now()
        };
      });
      lastSourcesUpdateTime = Date.now();
      
      // 返回简化后的窗口信息
      return {
        success: true,
        sources: sources.map(source => ({
          id: source.id,
          name: source.name,
          thumbnail: source.thumbnail.toDataURL(),
          appIcon: source.appIcon?.toDataURL(),
          display_id: source.display_id
        }))
      };
    } catch (error) {
      console.error('获取窗口源失败:', error);
      return {
        success: false,
        error: `获取窗口源失败: ${error.message}`
      };
    }
  });

  // 检查窗口是否仍然存在
  ipcMain.handle("check-window-exists", async (event, sourceId) => {
    try {
      // 如果缓存有效，直接从缓存中检查
      const now = Date.now();
      if (now - lastSourcesUpdateTime < SOURCES_CACHE_TTL) {
        return { 
          success: true,
          exists: !!windowSourcesCache[sourceId]
        };
      }
      
      // 缓存过期，重新获取窗口列表
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 150, height: 150 }
      });
      
      // 更新缓存
      windowSourcesCache = {};
      sources.forEach(source => {
        windowSourcesCache[source.id] = {
          id: source.id,
          name: source.name,
          timestamp: Date.now()
        };
      });
      lastSourcesUpdateTime = now;
      
      // 检查指定的窗口是否存在
      return {
        success: true,
        exists: sources.some(source => source.id === sourceId)
      };
    } catch (error) {
      console.error('检查窗口状态失败:', error);
      return {
        success: false,
        error: `检查窗口状态失败: ${error.message}`
      };
    }
  });

  // 开始捕获指定窗口（这个API实际上只返回相关信息，实际捕获在渲染进程中进行）
  ipcMain.handle("start-window-capture", async (event, sourceId) => {
    try {
      // 获取指定窗口的最新信息
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 300, height: 200 }
      });
      
      const source = sources.find(s => s.id === sourceId);
      if (!source) {
        return {
          success: false,
          error: "未找到指定的窗口"
        };
      }
      
      // 返回窗口信息，供渲染进程进行捕获
      return {
        success: true,
        source: {
          id: source.id,
          name: source.name,
          thumbnail: source.thumbnail.toDataURL()
        }
      };
    } catch (error) {
      console.error('启动窗口捕获失败:', error);
      return {
        success: false,
        error: `启动窗口捕获失败: ${error.message}`
      };
    }
  });

  // 获取系统摄像头列表
  ipcMain.handle("get-camera-sources", async () => {
    try {
      // 需要注意，在Electron主进程中无法直接访问navigator.mediaDevices API
      // 因此我们返回一个临时响应，实际的摄像头列表由渲染进程通过浏览器API获取
      return {
        success: true,
        sources: [
          {
            id: "default_camera",
            name: "默认摄像头",
            deviceId: "default"
          }
        ]
      };
    } catch (error) {
      console.error('获取摄像头列表失败:', error);
      return {
        success: false,
        error: `获取摄像头列表失败: ${error.message}`
      };
    }
  });

  // 开始捕获摄像头（这个API实际上只返回相关信息，实际捕获在渲染进程中进行）
  ipcMain.handle("start-camera-capture", async (event, deviceId) => {
    try {
      // 实际的媒体捕获将在渲染进程中通过navigator.mediaDevices.getUserMedia完成
      // 这里只返回一个成功信号
      return {
        success: true,
        source: {
          id: deviceId || "default",
          name: deviceId ? `摄像头 (${deviceId})` : "默认摄像头"
        }
      };
    } catch (error) {
      console.error('启动摄像头捕获失败:', error);
      return {
        success: false,
        error: `启动摄像头捕获失败: ${error.message}`
      };
    }
  });

  // 运行外部程序
  ipcMain.handle("run-external-program", async (event, options) => {
    try {
      const { program, args, workingDir } = options;
      
      // 验证参数
      if (!program) {
        return { success: false, error: "程序路径不能为空" };
      }
      
      // 检查程序文件是否存在
      if (!fs.existsSync(program)) {
        return { success: false, error: `程序文件不存在: ${program}` };
      }
      
      // 准备工作目录
      const cwd = workingDir || path.dirname(program);
      
      // 使用spawn启动子进程
      const childProcess = spawn(program, args || [], { cwd });
      
      let outputData = '';
      let errorData = '';
      
      childProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });
      
      childProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });
      
      // 返回一个Promise，在进程退出时resolve
      return new Promise((resolve) => {
        childProcess.on('close', (code) => {
          resolve({
            success: code === 0,
            exitCode: code,
            stdout: outputData,
            stderr: errorData
          });
        });
        
        childProcess.on('error', (err) => {
          resolve({
            success: false,
            error: `启动程序失败: ${err.message}`
          });
        });
      });
    } catch (err) {
      return {
        success: false,
        error: `运行外部程序失败: ${err.message}`,
      };
    }
  });
  
  // 运行机器人平台程序
  ipcMain.handle("run-robot-platform", async (event, { projectPath, taskJsonPath, port }) => {
    try {
      if (!projectPath) {
        return { success: false, error: "项目路径不能为空" };
      }
      
      // 构建路径
      const robotPlatformPath = path.join(app.getAppPath(), "bin", "robot_platform.exe");
      const configJsonPath = path.join(projectPath, "config.json");
      
      // 确定任务文件路径
      // 如果用户指定了路径则使用，否则使用项目目录下的默认文件
      const finalTaskJsonPath = taskJsonPath || path.join(projectPath, "task.json");
      
      // 检查程序文件是否存在
      if (!fs.existsSync(robotPlatformPath)) {
        return { success: false, error: `机器人平台程序不存在: ${robotPlatformPath}` };
      }
      
      // 检查配置文件是否存在
      if (!fs.existsSync(configJsonPath)) {
        return { success: false, error: `配置文件不存在: ${configJsonPath}` };
      }
      
      // 检查任务文件是否存在
      if (!fs.existsSync(finalTaskJsonPath)) {
        return { success: false, error: `任务文件不存在: ${finalTaskJsonPath}` };
      }
      
      // 准备命令行参数
      const args = ["-c", configJsonPath, "-t", finalTaskJsonPath];
      
      // 如果指定了端口，添加端口参数
      if (port) {
        args.push("-p", port.toString());
      }
      
      // 使用spawn启动子进程
      const cwd = path.dirname(robotPlatformPath);
      const childProcess = spawn(robotPlatformPath, args, { cwd, detached: true });
      
      // 生成唯一的进程ID
      const processId = uuidv4();
      
      // 存储进程引用，用于后续停止进程
      runningProcesses[processId] = {
        process: childProcess,
        startTime: Date.now()
      };
      
      let outputData = '';
      let errorData = '';
      
      childProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });
      
      childProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });
      
      // 当进程结束时，从运行列表中删除
      childProcess.on('close', (code) => {
        delete runningProcesses[processId];
      });
      
      childProcess.on('error', (err) => {
        delete runningProcesses[processId];
      });
      
      // 这里我们立即返回进程ID，不等待进程结束
      return {
        success: true,
        processId: processId,
        message: "机器人平台程序已启动"
      };
    } catch (err) {
      return {
        success: false,
        error: `运行机器人平台失败: ${err.message}`,
      };
    }
  });
  
  // 停止运行中的机器人平台进程
  ipcMain.handle("stop-robot-platform", async (event, processId) => {
    try {
      if (!processId || !runningProcesses[processId]) {
        return { 
          success: false, 
          error: "找不到指定的进程" 
        };
      }
      
      const processInfo = runningProcesses[processId];
      
      // 在 Windows 平台上使用 taskkill 确保子进程被终止
      if (process.platform === 'win32') {
        try {
          // 终止进程及其子进程
          processInfo.process.kill();
        } catch (err) {
          console.error(`终止进程失败: ${err.message}`);
        }
      } else {
        // 在非 Windows 平台上使用 kill 信号
        try {
          process.kill(-processInfo.process.pid);
        } catch (err) {
          console.error(`终止进程失败: ${err.message}`);
          processInfo.process.kill();
        }
      }
      
      // 从运行中进程列表移除
      delete runningProcesses[processId];
      
      return { 
        success: true,
        message: "进程已终止" 
      };
    } catch (err) {
      return {
        success: false,
        error: `停止进程失败: ${err.message}`
      };
    }
  });
  
  // 选择任务JSON文件
  ipcMain.handle("select-task-json-file", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      filters: [{ name: "任务JSON文件", extensions: ["json"] }],
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
        error: `选择任务JSON文件失败: ${err.message}`,
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
