const { contextBridge, ipcRenderer } = require("electron");

// 向渲染进程暴露API
contextBridge.exposeInMainWorld("electronAPI", {
  // 选择项目目录
  selectProjectDirectory: () => ipcRenderer.invoke("select-project-directory"),

  // 选择项目配置文件
  selectProjectFile: () => ipcRenderer.invoke("select-project-file"),

  // 创建新项目
  createProject: (projectInfo) =>
    ipcRenderer.invoke("create-project", projectInfo),

  // 选择父目录
  selectParentDirectory: () => ipcRenderer.invoke("select-parent-directory"),

  // 打开目录
  openDirectory: (dirPath) => ipcRenderer.invoke("open-directory", dirPath),

  // 读取项目配置
  readProjectConfig: (configPath) =>
    ipcRenderer.invoke("read-project-config", configPath),

  // 写入项目配置
  writeProjectConfig: (configPath, configData) =>
    ipcRenderer.invoke("write-project-config", configPath, configData),
    
  // 导出配置文件
  exportConfigFile: (projectPath, configData) =>
    ipcRenderer.invoke("export-config-file", projectPath, configData),
    
  // 导出任务文件
  exportTaskFile: (projectPath, taskData) =>
    ipcRenderer.invoke("export-task-file", projectPath, taskData),

  // UI设计器相关API
  // 读取UI设计文件
  readUIFile: (filePath) => 
    ipcRenderer.invoke("read-ui-file", filePath),
  
  // 写入UI设计文件
  writeUIFile: (filePath, designData) =>
    ipcRenderer.invoke("write-ui-file", filePath, designData),
  
  // 选择图片文件
  selectImageFile: () => ipcRenderer.invoke("select-image-file"),
  
  // 窗口捕获相关API
  // 获取所有可用窗口源
  getWindowSources: () => ipcRenderer.invoke("get-window-sources"),
  
  // 开始捕获指定窗口
  startWindowCapture: (sourceId) => ipcRenderer.invoke("start-window-capture", sourceId),
  
  // 检查窗口是否仍然存在
  checkWindowExists: (sourceId) => ipcRenderer.invoke("check-window-exists", sourceId),

  // 摄像头相关API
  // 获取系统摄像头列表
  getCameraSources: () => ipcRenderer.invoke("get-camera-sources"),

  // 开始捕获摄像头
  startCameraCapture: (deviceId) => ipcRenderer.invoke("start-camera-capture", deviceId),
  
  // 运行外部程序
  runExternalProgram: (options) => ipcRenderer.invoke("run-external-program", options),
  
  // 选择任务JSON文件
  selectTaskJsonFile: () => ipcRenderer.invoke("select-task-json-file"),
  
  // 运行机器人平台程序
  runRobotPlatform: (options) => ipcRenderer.invoke("run-robot-platform", options),
  
  // 停止运行中的机器人平台进程
  stopRobotPlatform: (processId) => ipcRenderer.invoke("stop-robot-platform", processId),
});
