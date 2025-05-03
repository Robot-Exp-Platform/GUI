export interface Task {
  id: number;
  name: string;
  // 可以在未来扩展更多任务相关的属性
}

// 创建一个任务实例
export const createTask = (id: number): Task => {
  return {
    id,
    name: `task_${id}`,
  };
};
