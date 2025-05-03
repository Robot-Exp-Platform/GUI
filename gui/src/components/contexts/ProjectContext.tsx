import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";

interface ProjectConfig {
  nextId?: number;
  robots?: Array<{ id: number; name: string }>;
  sensors?: Array<{ id: number; name: string }>;
  [key: string]: any; // 允许添加其他配置
}

interface ProjectInfo {
  projectPath: string;
  projectName: string;
  config?: ProjectConfig;
}

interface ProjectContextType {
  projectInfo: ProjectInfo | null;
  setProjectInfo: (info: ProjectInfo | null) => void;
  updateProjectConfig: (configUpdate: Partial<ProjectConfig>) => void;
  saveProjectConfig: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);

  // 从配置文件加载配置
  useEffect(() => {
    if (projectInfo?.projectPath) {
      loadProjectConfig();
    }
  }, [projectInfo?.projectPath]);

  // 加载项目配置
  const loadProjectConfig = async () => {
    if (!projectInfo?.projectPath) return;

    try {
      const configPath = `${projectInfo.projectPath}/.roplat`;
      const result = await window.electronAPI.readProjectConfig(configPath);

      if (result.success && result.config) {
        setProjectInfo((prev) => ({
          ...prev!,
          config: result.config,
        }));
      }
    } catch (error) {
      console.error("加载项目配置失败:", error);
    }
  };

  // 更新项目配置（内存中）
  const updateProjectConfig = (configUpdate: Partial<ProjectConfig>) => {
    if (!projectInfo) return;

    setProjectInfo((prev) => {
      if (!prev) return null;

      const updatedConfig = {
        ...(prev.config || {}),
        ...configUpdate,
      };

      return {
        ...prev,
        config: updatedConfig,
      };
    });
  };

  // 保存项目配置到文件
  const saveProjectConfig = async () => {
    if (!projectInfo?.projectPath || !projectInfo?.config) return;

    try {
      const configPath = `${projectInfo.projectPath}/.roplat`;
      const configData = {
        projectName: projectInfo.projectName,
        ...projectInfo.config,
      };

      await window.electronAPI.writeProjectConfig(configPath, configData);
    } catch (error) {
      console.error("保存项目配置失败:", error);
    }
  };

  // 配置更改后自动保存
  useEffect(() => {
    if (projectInfo?.config) {
      saveProjectConfig();
    }
  }, [projectInfo?.config]);

  return (
    <ProjectContext.Provider
      value={{
        projectInfo,
        setProjectInfo,
        updateProjectConfig,
        saveProjectConfig,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};
