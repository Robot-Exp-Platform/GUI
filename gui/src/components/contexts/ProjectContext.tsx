import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { Project, CounterType } from "~/types";

interface ProjectContextType {
  project: Project | null;
  setProject: (project: Project | null) => void;
  loadProject: (projectPath: string, projectName: string) => Promise<boolean>;
  updateProject: () => Promise<void>;
  getNextTypeCounter: (type: CounterType) => number;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [project, setProject] = useState<Project | null>(null);

  // 加载项目
  const loadProject = useCallback(
    async (projectPath: string, projectName: string): Promise<boolean> => {
      try {
        const loadedProject = await Project.load(projectPath);

        if (loadedProject) {
          setProject(loadedProject);
          return true;
        }
        // 如果无法加载，创建一个新的项目
        const newProject = new Project(projectName, projectPath);
        setProject(newProject);
        return await newProject.save();
      } catch (error) {
        console.error("加载项目失败:", error);
        return false;
      }
    },
    [],
  );

  const getNextTypeCounter = useCallback(
    (type: CounterType): number => {
      if (!project) {
        return -1;
      }
      return project.getNextTypeCounter(type);
    },
    [project],
  );

  // 更新组件状态以触发重新渲染，并自动保存项目配置
  const updateProject = useCallback(async () => {
    setProject((prev) => {
      if (!prev) {
        return null;
      }

      // 异步保存项目配置
      prev.save().catch((error) => {
        console.error("自动保存项目配置失败:", error);
      });

      // 返回原始 Project 实例，不创建新的实例
      return prev;
    });
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        project,
        setProject,
        loadProject,
        updateProject,
        getNextTypeCounter,
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
