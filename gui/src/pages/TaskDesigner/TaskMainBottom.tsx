import React, { FC, useState, useRef } from "react";
import "./styles.css";
import Task from "../../components/Task";

const TaskMainBottom: FC = () => {
  const [tasks, setTasks] = useState<Array<{
    id: string;
    position: { x: number; y: number };
    name: string;
  }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 计算点击位置相对于容器的坐标
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 如果点击的是容器而不是任务
    if ((e.target as HTMLElement).className === "task-main-bottom-container") {
      const newTask = {
        id: `task-${Date.now()}`,
        position: { x, y },
        name: "任务容器"
      };
      
      setTasks((prevTasks) => [...prevTasks, newTask]);
    }
  };

  const handleTaskPositionChange = (id: string, position: { x: number; y: number }) => {
    setTasks((prevTasks) => 
      prevTasks.map((task) => 
        task.id === id ? { ...task, position } : task
      )
    );
  };

  const handleTaskNameChange = (id: string, name: string) => {
    setTasks((prevTasks) => 
      prevTasks.map((task) => 
        task.id === id ? { ...task, name } : task
      )
    );
  };

  const handleTaskSizeChange = (id: string, size: { width: number; height: number }) => {
    // 处理任务大小变化的回调
    // 如果需要保存任务大小，可以在Task状态中添加size属性
  };

  return (
    <div className="task-main-bottom">
      <div className="task-area-header">
        <h3>任务区（定义任务、目标和节点）（双击新建任务）</h3>
      </div>
      <div 
        ref={containerRef}
        className="task-main-bottom-container" 
        onDoubleClick={handleDoubleClick}
        style={{
          position: "relative",
          flex: 1,
          width: "100%",
          height: "100%",
          minHeight: "300px"
        }}
      >
        {tasks.map((task) => (
          <Task
            key={task.id}
            id={task.id}
            initialPosition={task.position}
            initialName={task.name}
            onPositionChange={handleTaskPositionChange}
            onNameChange={handleTaskNameChange}
            onSizeChange={handleTaskSizeChange}
            containerRef={containerRef as unknown as React.RefObject<HTMLDivElement>}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskMainBottom;
