import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { Project, ProjectConfig } from "~/types/Project";
import { Robot } from "~/types/Robot";
import { Sensor } from "~/types/Sensor";
import { Task } from "~/types/Task";

interface ProjectContextType {
  project: Project | null;
  setProject: (project: Project | null) => void;
  loadProject: (projectPath: string, projectName: string) => Promise<boolean>;
  saveProject: () => Promise<boolean>;
  updateProject: () => void;
  // 项目操作API
  addRobot: (robot: Robot) => Promise<void>;
  removeRobot: (id: number) => Promise<void>;
  addSensor: (sensor: Sensor) => Promise<void>;
  removeSensor: (id: number) => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  removeTask: (id: number) => Promise<void>;
  getNextId: () => number;
  getNextTypeCounter: (
    type: "panda" | "ur" | "sensor_a" | "sensor_b" | "task"
  ) => number;
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
        } else {
          // 如果无法加载，创建一个新的项目
          const newProject = new Project(projectName, projectPath);
          setProject(newProject);
          return await newProject.save();
        }
      } catch (error) {
        console.error("加载项目失败:", error);
        return false;
      }
    },
    []
  );

  // 保存项目
  const saveProject = useCallback(async (): Promise<boolean> => {
    if (!project) return false;

    return await project.save();
  }, [project]);

  // 更新组件状态以触发重新渲染
  const updateProject = useCallback(() => {
    setProject((prev) => {
      if (!prev) return null;

      // 创建一个新的 Project 实例，保留原来的所有属性
      return new Project(prev.projectName, prev.projectPath, {
        robots: [...prev.config.robots],
        sensors: [...prev.config.sensors],
        tasks: [...prev.config.tasks],
        idCounters: { ...prev.config.idCounters },
      });
    });
  }, []);

  // 项目操作API - 所有方法现在都是异步的
  const addRobot = useCallback(
    async (robot: Robot) => {
      if (!project) return;

      await project.addRobot(robot);
      updateProject();
    },
    [project, updateProject]
  );

  const removeRobot = useCallback(
    async (id: number) => {
      if (!project) return;

      await project.removeRobot(id);
      updateProject();
    },
    [project, updateProject]
  );

  const addSensor = useCallback(
    async (sensor: Sensor) => {
      if (!project) return;

      await project.addSensor(sensor);
      updateProject();
    },
    [project, updateProject]
  );

  const removeSensor = useCallback(
    async (id: number) => {
      if (!project) return;

      await project.removeSensor(id);
      updateProject();
    },
    [project, updateProject]
  );

  const addTask = useCallback(
    async (task: Task) => {
      if (!project) return;

      await project.addTask(task);
      updateProject();
    },
    [project, updateProject]
  );

  const removeTask = useCallback(
    async (id: number) => {
      if (!project) return;

      await project.removeTask(id);
      updateProject();
    },
    [project, updateProject]
  );

  const getNextId = useCallback((): number => {
    if (!project) return -1;

    return project.getNextId();
  }, [project]);

  const getNextTypeCounter = useCallback(
    (type: "panda" | "ur" | "sensor_a" | "sensor_b" | "task"): number => {
      if (!project) return -1;

      return project.getNextTypeCounter(type);
    },
    [project]
  );

  return (
    <ProjectContext.Provider
      value={{
        project,
        setProject,
        loadProject,
        saveProject,
        updateProject,
        addRobot,
        removeRobot,
        addSensor,
        removeSensor,
        addTask,
        removeTask,
        getNextId,
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
