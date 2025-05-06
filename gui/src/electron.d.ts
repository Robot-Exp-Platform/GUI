interface ElectronAPI {
  selectProjectDirectory: () => Promise<{
    success: boolean;
    projectPath?: string;
    projectName?: string;
    error?: string;
  }>;

  selectProjectFile: () => Promise<{
    success: boolean;
    projectPath?: string;
    projectName?: string;
    error?: string;
  }>;

  createProject: (projectInfo: {
    projectPath: string;
    projectName: string;
  }) => Promise<{
    success: boolean;
    projectPath?: string;
    projectName?: string;
    error?: string;
  }>;

  selectParentDirectory: () => Promise<{
    success: boolean;
    directoryPath?: string;
  }>;

  openDirectory: (dirPath: string) => Promise<{
    success: boolean;
  }>;

  // 新增：读取项目配置文件
  readProjectConfig: (configPath: string) => Promise<{
    success: boolean;
    config?: Record<string, unknown>;
    error?: string;
  }>;

  // 新增：写入项目配置文件
  writeProjectConfig: (
    configPath: string,
    configData: Record<string, unknown>
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;

  // 新增：导出配置文件
  exportConfigFile: (
    projectPath: string,
    configData: Record<string, unknown>
  ) => Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }>;
  
  // 新增：导出任务文件
  exportTaskFile: (
    projectPath: string,
    taskData: Record<string, unknown>[] | any[]
  ) => Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }>;

  // 新增：读取 UI 设计文件
  readUIFile: (filePath: string) => Promise<{
    success: boolean;
    design?: Record<string, unknown>;
    error?: string;
  }>;

  // 新增：写入 UI 设计文件
  writeUIFile: (
    filePath: string,
    designData: Record<string, unknown>
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;

  // 新增：选择图片文件
  selectImageFile: () => Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }>;
}

interface Window {
  electronAPI: ElectronAPI;
}
