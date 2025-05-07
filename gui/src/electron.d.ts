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
  
  // 新增：获取所有可用窗口源
  getWindowSources: () => Promise<{
    success: boolean;
    sources?: Array<{
      id: string;
      name: string;
      thumbnail: string;
      appIcon?: string;
      display_id: string;
    }>;
    error?: string;
  }>;
  
  // 新增：开始捕获指定窗口
  startWindowCapture: (sourceId: string) => Promise<{
    success: boolean;
    source?: {
      id: string;
      name: string;
      thumbnail: string;
    };
    error?: string;
  }>;
  
  // 新增：检查窗口是否仍然存在
  checkWindowExists: (sourceId: string) => Promise<{
    success: boolean;
    exists?: boolean;
    error?: string;
  }>;

  // 新增：获取系统摄像头列表
  getCameraSources: () => Promise<{
    success: boolean;
    sources?: Array<{
      id: string;
      name: string;
      deviceId: string;
    }>;
    error?: string;
  }>;
  
  // 新增：开始捕获摄像头
  startCameraCapture: (deviceId: string) => Promise<{
    success: boolean;
    source?: {
      id: string;
      name: string;
    };
    error?: string;
  }>;
  
  // 新增：运行外部程序
  runExternalProgram: (options: {
    program: string;
    args?: string[];
    workingDir?: string;
  }) => Promise<{
    success: boolean;
    exitCode?: number;
    stdout?: string;
    stderr?: string;
    error?: string;
  }>;
  
  // 新增：选择任务JSON文件
  selectTaskJsonFile: () => Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }>;

  // 新增：运行机器人平台程序
  runRobotPlatform: (options: {
    projectPath: string;
    taskJsonPath?: string;
    port?: number;
  }) => Promise<{
    success: boolean;
    processId?: string;
    message?: string;
    error?: string;
  }>;

  // 新增：停止运行中的机器人平台进程
  stopRobotPlatform: (processId: string) => Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }>;
}

interface Window {
  electronAPI: ElectronAPI;
}
