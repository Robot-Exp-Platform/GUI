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
}

interface Window {
  electronAPI: ElectronAPI;
}
