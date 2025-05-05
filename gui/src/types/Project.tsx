import { Robot } from "./Robot";
import { Sensor } from "./Sensor";
import { Task } from "./Task";
import { CounterType } from "./index";

// 项目ID计数器类型
export interface IdCounters {
  nextId: number;
  pandaCounter: number;
  urCounter: number;
  sensorACounter: number;
  sensorBCounter: number;
  taskCounter: number;
}

// 项目配置类型
export interface ProjectConfig {
  robots: Robot[];
  sensors: Sensor[];
  tasks: Task[];
  idCounters: IdCounters;
  taskGraph: Array<[string, string]>; // 存储任务依赖关系 [("id1", "id2"), ...] 表示 id1 -> id2
}

// 项目类型
export class Project {
  projectName: string;
  projectPath: string;
  config: ProjectConfig;

  constructor(
    projectName: string,
    projectPath: string,
    config?: ProjectConfig,
  ) {
    this.projectName = projectName;
    this.projectPath = projectPath;
    this.config = config || {
      robots: [],
      sensors: [],
      tasks: [],
      idCounters: {
        nextId: 1,
        pandaCounter: 0,
        urCounter: 0,
        sensorACounter: 0,
        sensorBCounter: 0,
        taskCounter: 0,
      },
      taskGraph: [], // 初始化空依赖图
    };
  }

  // 保存项目到文件
  async save(): Promise<boolean> {
    try {
      const configPath = `${this.projectPath}/.roplat`;
      const configData = {
        projectName: this.projectName,
        ...this.config,
      };

      const result = await window.electronAPI.writeProjectConfig(
        configPath,
        configData,
      );
      return result.success;
    } catch (error) {
      console.error("保存项目配置失败:", error);
      return false;
    }
  }

  // 从文件加载项目
  static async load(projectPath: string): Promise<Project | null> {
    try {
      const configPath = `${projectPath}/.roplat`;
      const result = await window.electronAPI.readProjectConfig(configPath);

      if (result.success && result.config) {
        const config = result.config;
        const projectName = config.projectName as string;
        const robots = config.robots as Robot[] | undefined;
        const sensors = config.sensors as Sensor[] | undefined;
        const tasks = config.tasks as Task[] | undefined;
        const idCounters = config.idCounters as IdCounters | undefined;
        const taskGraph = config.taskGraph as
          | Array<[string, string]>
          | undefined;

        return new Project(projectName, projectPath, {
          robots: robots || [],
          sensors: sensors || [],
          tasks: tasks || [],
          idCounters: idCounters || {
            nextId: 1,
            pandaCounter: 0,
            urCounter: 0,
            sensorACounter: 0,
            sensorBCounter: 0,
            taskCounter: 0,
          },
          taskGraph: taskGraph || [],
        });
      }
      return null;
    } catch (error) {
      console.error("加载项目配置失败:", error);
      return null;
    }
  }

  // 获取特定类型的下一个计数器值
  getNextTypeCounter(type: CounterType): number {
    switch (type) {
    case "panda":
      return ++this.config.idCounters.pandaCounter;
    case "ur":
      return ++this.config.idCounters.urCounter;
    case "sensor_a":
      return ++this.config.idCounters.sensorACounter;
    case "sensor_b":
      return ++this.config.idCounters.sensorBCounter;
    case "task":
      return ++this.config.idCounters.taskCounter;
    default:
      throw new Error(`未知类型: ${type}`);
    }
  }

  // 检查是否存在循环依赖
  hasCircularDependency(fromTaskId: string, toTaskId: string): boolean {
    // 如果目标节点已经依赖于源节点，添加这条边会形成循环
    if (this.isDependentOn(toTaskId, fromTaskId)) {
      return true;
    }
    return false;
  }

  // 检查 taskId1 是否依赖于 taskId2（直接或间接）
  isDependentOn(taskId1: string, taskId2: string): boolean {
    // 使用深度优先搜索检查依赖关系
    const visited = new Set<string>();

    const dfs = (currentId: string): boolean => {
      if (currentId === taskId2) {
        return true;
      }
      if (visited.has(currentId)) {
        return false;
      }

      visited.add(currentId);

      // 获取当前任务的所有直接依赖
      const dependencies = this.config.taskGraph
        .filter(([from]) => from === currentId)
        .map(([, to]) => to);

      // 检查每个直接依赖
      for (const dependencyId of dependencies) {
        if (dfs(dependencyId)) {
          return true;
        }
      }

      return false;
    };

    return dfs(taskId1);
  }
}
