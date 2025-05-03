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

      console.log("Saving project configuration:", configData);
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
        const { projectName, robots, sensors, tasks, idCounters } =
          result.config;
        console.log("Loaded project configuration:", result.config);
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
    this.config.tasks.push(task);
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
    // 自动保存
    await this.save();
  }
}
