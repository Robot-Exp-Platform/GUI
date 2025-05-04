export interface Task {
  id: number;
  name: string;
  position?: { x: number; y: number }; // 任务位置
  size?: { width: number; height: number }; // 任务大小
}

// 创建一个任务实例
export const createTask = (id: number): Task => {
  return {
    id,
    name: `task_${id}`,
    position: { x: 100, y: 100 }, // 默认位置
    size: { width: 120, height: 80 }, // 默认大小
  };
};
