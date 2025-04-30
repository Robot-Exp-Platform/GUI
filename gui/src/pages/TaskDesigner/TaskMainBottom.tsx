import React, { FC, useState, useRef, useContext } from "react";
import "./styles.css";
import Task from "../../components/Task";
import { DeleteZoneContext } from "./TaskSidebar";
import { conv_ref } from "~/utils";

const TaskMainBottom: FC = () => {
  const [tasks, setTasks] = useState<
    Array<{
      id: string;
      position: { x: number; y: number };
      name: string;
    }>
  >([]);
  const containerRef = useRef<HTMLDivElement>(null);
  // 添加网格显示状态
  const [showGrid, setShowGrid] = useState(false);

  // 直接使用删除区域上下文，不使用 conv_ref
  const deleteZoneContext = useContext(DeleteZoneContext);

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 计算点击位置相对于容器的坐标
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 如果点击的是容器而不是任务 - 使用classList.contains代替精确匹配className
    if (
      (e.target as HTMLElement).classList.contains("task-main-bottom-container")
    ) {
      // 将位置调整为最近的20px网格
      const snapX = Math.round(x / 20) * 20;
      const snapY = Math.round(y / 20) * 20;

      const newTask = {
        id: `task-${Date.now()}`,
        position: { x: snapX, y: snapY },
        name: "任务容器",
      };

      setTasks((prevTasks) => [...prevTasks, newTask]);
    }
  };

  const handleTaskPositionChange = (
    id: string,
    position: { x: number; y: number }
  ) => {
    // 将位置调整为最近的20px网格
    const snapX = Math.round(position.x / 20) * 20;
    const snapY = Math.round(position.y / 20) * 20;

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, position: { x: snapX, y: snapY } } : task
      )
    );
  };

  const handleTaskNameChange = (id: string, name: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === id ? { ...task, name } : task))
    );
  };

  const handleTaskSizeChange = (
    id: string,
    size: { width: number; height: number }
  ) => {
    // 将大小调整为20px的倍数
    console.log(`调整任务 ${id} 大小: ${size.width}x${size.height}`); // 添加日志以便调试

    const snapWidth = Math.round(size.width / 20) * 20;
    const snapHeight = Math.round(size.height / 20) * 20;

    // 如果需要保存任务大小，可以在Task状态中添加size属性
    console.log(`任务 ${id} 大小调整为: ${snapWidth}x${snapHeight}`);
  };

  // 处理任务删除功能
  const handleTaskDelete = (id: string) => {
    console.log(`删除任务: ${id}`); // 添加日志以便调试
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
  };

  // 显示/隐藏网格的回调函数
  const handleDragOrResizeStart = () => {
    setShowGrid(true);
  };

  const handleDragOrResizeEnd = () => {
    setShowGrid(false);
  };

  return (
    <div className="task-main-bottom">
      <div className="task-area-header">
        <h3>任务区（定义任务、目标和节点）（双击新建任务）</h3>
      </div>
      <div
        ref={containerRef}
        className={`task-main-bottom-container ${showGrid ? "show-grid" : ""}`}
        onDoubleClick={handleDoubleClick}
        style={{
          position: "relative",
          flex: 1,
          width: "100%",
          height: "100%",
          minHeight: "300px",
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
            onDelete={handleTaskDelete}
            containerRef={conv_ref(containerRef)}
            deleteZoneRef={deleteZoneContext.ref}
            deleteZoneIsHovering={deleteZoneContext.isHovering}
            onDragStart={handleDragOrResizeStart}
            onDragEnd={handleDragOrResizeEnd}
            onResizeStart={handleDragOrResizeStart}
            onResizeEnd={handleDragOrResizeEnd}
            gridSize={20}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskMainBottom;
