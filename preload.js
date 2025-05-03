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
});
