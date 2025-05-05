import { Node } from "./Node";

export interface Task {
  id: number;
  name: string;
  position?: { x: number; y: number }; // 任务位置
  size?: { width: number; height: number }; // 任务大小
  target?: unknown[]; // 目标配置，使用unknown类型以支持各种JSON结构
  nodes?: Node[]; // 节点配置
  nodeCounter?: number; // 节点计数器，用于生成节点默认名称
}

// 创建一个任务实例
export const createTask = (id: number): Task => ({
  id,
  name: `task_${id}`,
  position: { x: 100, y: 100 }, // 默认位置
  size: { width: 120, height: 80 }, // 默认大小
  target: [], // 默认空数组
  nodes: [], // 默认空节点数组
  nodeCounter: 0, // 初始化节点计数器为0
});
