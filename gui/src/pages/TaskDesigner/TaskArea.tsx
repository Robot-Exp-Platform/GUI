import React, { FC, useState, useRef, useContext, useEffect } from "react";
import "./styles.css";
import Task from "../../components/Task";
import { conv_ref } from "~/utils";
import DeleteZoneContext from "~/components/contexts/DeleteZoneContext";

const TaskArea: FC = () => {
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

  // 拖动状态
  const dragState = useRef({
    isDragging: false,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    tasksInitialPositions: new Map<string, { x: number; y: number }>(),
  });

  // 控制视觉反馈的临时偏移量
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const deleteZoneContext = useContext(DeleteZoneContext);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 鼠标按下事件处理
    const handleMouseDown = (e: MouseEvent) => {
      // 确保只处理容器背景的点击，不处理子元素
      if (
        e.target === container ||
        (e.target as HTMLElement).classList.contains("task-area-container")
      ) {
        // 保存所有任务的初始位置
        const tasksPositions = new Map<string, { x: number; y: number }>();
        tasks.forEach((task) => {
          tasksPositions.set(task.id, { ...task.position });
        });

        // 设置拖动状态
        dragState.current = {
          isDragging: true,
          startPosition: { x: e.clientX, y: e.clientY },
          currentPosition: { x: e.clientX, y: e.clientY },
          tasksInitialPositions: tasksPositions,
        };

        // 显示网格并更改鼠标样式
        setShowGrid(true);
        container.style.cursor = "grabbing";
      }
    };

    // 鼠标移动事件处理
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.current.isDragging) return;

      // 计算总移动距离
      const deltaX = e.clientX - dragState.current.startPosition.x;
      const deltaY = e.clientY - dragState.current.startPosition.y;

      // 更新当前位置
      dragState.current.currentPosition = { x: e.clientX, y: e.clientY };

      // 设置视觉偏移量，用于更新视图
      setDragOffset({ x: deltaX, y: deltaY });
    };

    // 鼠标抬起事件处理
    const handleMouseUp = (e: MouseEvent) => {
      if (!dragState.current.isDragging) return;

      // 计算总移动距离
      const deltaX = e.clientX - dragState.current.startPosition.x;
      const deltaY = e.clientY - dragState.current.startPosition.y;

      // 确保拖动距离足够才处理
      if (Math.abs(deltaX) >= 1 || Math.abs(deltaY) >= 1) {
        // 对照初始位置，更新所有任务的最终位置并对齐到网格
        setTasks((prevTasks) =>
          prevTasks.map((task) => {
            const initialPos = dragState.current.tasksInitialPositions.get(
              task.id
            );
            if (!initialPos) return task;

            // 计算新位置并与网格对齐
            const newX = Math.round((initialPos.x + deltaX) / 20) * 20;
            const newY = Math.round((initialPos.y + deltaY) / 20) * 20;

            return {
              ...task,
              position: { x: newX, y: newY },
            };
          })
        );
      }

      // 重置拖动状态和偏移量
      dragState.current.isDragging = false;
      setDragOffset({ x: 0, y: 0 });

      // 隐藏网格并重置鼠标样式
      setShowGrid(false);
      container.style.cursor = "grab";
    };

    // 添加事件监听器
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // 清理函数
    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [tasks]);

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 计算点击位置相对于容器的坐标
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 如果点击的是容器而不是任务
    if ((e.target as HTMLElement).classList.contains("task-area-container")) {
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
    <div className="task-area">
      <div className="task-area-header">
        <h3>任务区（定义任务、目标和节点）（双击新建任务）</h3>
      </div>
      <div
        ref={containerRef}
        className={`task-area-container ${showGrid ? "show-grid" : ""}`}
        onDoubleClick={handleDoubleClick}
        style={{
          position: "relative",
          flex: 1,
          width: "100%",
          height: "100%",
          minHeight: "300px",
          overflow: "hidden",
          cursor: "grab",
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
            dragOffset={dragOffset}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskArea;
