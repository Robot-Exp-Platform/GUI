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
}

interface Window {
  electronAPI: ElectronAPI;
}