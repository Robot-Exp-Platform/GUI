import { Robot } from "./Robot";
import { Sensor } from "./Sensor";
import { Task } from "./Task";

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
  task_graph: Array<[string, string]>; // 存储任务依赖关系 [("id1", "id2"), ...] 表示 id1 -> id2
}

// 项目类型
export class Project {
  projectName: string;
  projectPath: string;
  config: ProjectConfig;

  constructor(
    projectName: string,
    projectPath: string,
    config?: ProjectConfig
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
      task_graph: [], // 初始化空依赖图
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
        configData
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
        const { projectName, robots, sensors, tasks, idCounters, task_graph } =
          result.config;
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
          task_graph: task_graph || [],
        });
      }
      return null;
    } catch (error) {
      console.error("加载项目配置失败:", error);
      return null;
    }
  }

  // 获取下一个ID并增加ID计数器
  getNextId(): number {
    const currentId = this.config.idCounters.nextId;
    this.config.idCounters.nextId += 1;
    return currentId;
  }

  // 根据类型获取下一个特定计数器的值
  getNextTypeCounter(
    type: "panda" | "ur" | "sensor_a" | "sensor_b" | "task"
  ): number {
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

  // 添加机器人
  async addRobot(robot: Robot): Promise<void> {
    this.config.robots.push(robot);
    // 自动保存
    await this.save();
  }

  // 添加传感器
  async addSensor(sensor: Sensor): Promise<void> {
    this.config.sensors.push(sensor);
    // 自动保存
    await this.save();
  }

  // 添加任务
  async addTask(task: Task): Promise<void> {
    // 检查是否已存在相同 ID 的任务，如果存在则更新而不是添加
    const existingTaskIndex = this.config.tasks.findIndex(existingTask => existingTask.id === task.id);
    
    if (existingTaskIndex >= 0) {
      // 更新现有任务
      this.config.tasks[existingTaskIndex] = task;
    } else {
      // 添加新任务
      this.config.tasks.push(task);
    }
    
    // 自动保存
    await this.save();
  }

  // 删除机器人
  async removeRobot(id: number): Promise<void> {
    this.config.robots = this.config.robots.filter((robot) => robot.id !== id);
    // 自动保存
    await this.save();
  }

  // 删除传感器
  async removeSensor(id: number): Promise<void> {
    this.config.sensors = this.config.sensors.filter(
      (sensor) => sensor.id !== id
    );
    // 自动保存
    await this.save();
  }

  // 删除任务
  async removeTask(id: number): Promise<void> {
    this.config.tasks = this.config.tasks.filter((task) => task.id !== id);
    // 删除与此任务相关的所有依赖关系
    this.config.task_graph = this.config.task_graph.filter(
      ([from, to]) => from !== id.toString() && to !== id.toString()
    );
    // 自动保存
    await this.save();
  }

  // 添加任务依赖关系
  async addTaskDependency(fromTaskId: string, toTaskId: string): Promise<void> {
    // 检查循环依赖
    if (this.hasCircularDependency(fromTaskId, toTaskId)) {
      console.error("检测到循环依赖，无法添加依赖关系");
      return;
    }

    // 检查是否已存在相同的依赖关系
    const exists = this.config.task_graph.some(
      ([from, to]) => from === fromTaskId && to === toTaskId
    );
    
    if (!exists) {
      this.config.task_graph.push([fromTaskId, toTaskId]);
      // 自动保存
      await this.save();
    }
  }

  // 删除任务依赖关系
  async removeTaskDependency(fromTaskId: string, toTaskId: string): Promise<void> {
    this.config.task_graph = this.config.task_graph.filter(
      ([from, to]) => !(from === fromTaskId && to === toTaskId)
    );
    // 自动保存
    await this.save();
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
      if (currentId === taskId2) return true;
      if (visited.has(currentId)) return false;
      
      visited.add(currentId);
      
      // 获取当前任务的所有直接依赖
      const dependencies = this.config.task_graph
        .filter(([from, _]) => from === currentId)
        .map(([_, to]) => to);
      
      // 检查每个直接依赖
      for (const dependencyId of dependencies) {
        if (dfs(dependencyId)) return true;
      }
      
      return false;
    };
    
    return dfs(taskId1);
  }

  // 获取所有任务依赖关系
  getTaskDependencies(): Array<[string, string]> {
    return [...this.config.task_graph];
  }
}
