import React, {
  FC,
  useState,
  useRef,
  useContext,
  useEffect,
  useCallback,
} from "react";
import "./styles.css";
import Task from "../../components/Task";
import { conv_ref } from "~/utils";
import DeleteZoneContext from "~/components/contexts/DeleteZoneContext";
import { useProject } from "~/components/contexts/ProjectContext";
import Xarrow from "react-xarrows";

// 任务依赖连线预览
interface DependencyLine {
  fromId: string;
  toPosition: { x: number; y: number };
  active: boolean;
}

const TaskArea: FC = () => {
  const {
    addTaskDependency,
    removeTaskDependency,
    getTaskDependencies,
    hasCircularDependency,
  } = useProject();
  const [tasks, setTasks] = useState<
    Array<{
      id: string;
      position: { x: number; y: number };
      name: string;
      size?: { width: number; height: number };
    }>
  >([]);
  const containerRef = useRef<HTMLDivElement>(null);
  // 添加网格显示状态
  const [showGrid, setShowGrid] = useState(false);

  // 存储依赖关系
  const [dependencies, setDependencies] = useState<Array<[string, string]>>([]);

  // 当前正在创建的依赖关系（临时预览）
  const [dependencyPreview, setDependencyPreview] =
    useState<DependencyLine | null>(null);

  // 使用ref存储依赖拖拽状态，避免对全局变量的依赖
  const dependencyDragRef = useRef({
    isDragging: false,
    fromId: null as string | null,
  });

  // 鼠标移动时更新的连线目标位置
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // 循环依赖警告状态
  const [circularDependencyWarning, setCircularDependencyWarning] = useState<
    string | null
  >(null);

  // 存储可能导致循环依赖的任务ID列表
  const [circularDependencyTasks, setCircularDependencyTasks] = useState<
    string[]
  >([]);

  // 拖动状态
  const dragState = useRef({
    isDragging: false,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    tasksInitialPositions: new Map<string, { x: number; y: number }>(),
  });

  // 控制视觉反馈的临时偏移量
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 用于强制重新渲染箭头的计数器
  const [arrowUpdateCounter, setArrowUpdateCounter] = useState(0);

  const deleteZoneContext = useContext(DeleteZoneContext);

  // 加载依赖关系
  useEffect(() => {
    const loadedDependencies = getTaskDependencies();
    setDependencies(loadedDependencies);
  }, [getTaskDependencies]);

  // 计算拖拽依赖过程中所有可能导致循环依赖的任务
  const calculateCircularDependencyTasks = useCallback(
    (fromTaskId: string | null) => {
      if (!fromTaskId) {
        setCircularDependencyTasks([]);
        return;
      }

      // 获取所有可能导致循环依赖的目标任务ID
      const circularTasks = tasks
        .map((task) => task.id)
        .filter(
          (taskId) =>
            taskId !== fromTaskId && hasCircularDependency(fromTaskId, taskId)
        );

      setCircularDependencyTasks(circularTasks);
    },
    [tasks, hasCircularDependency]
  );

  // 全局鼠标移动追踪，用于箭头绘制
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // 同时检查ref和state确保及时响应
      if (
        (dependencyPreview?.active || dependencyDragRef.current.isDragging) &&
        containerRef.current
      ) {
        const containerRect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - containerRect.left,
          y: e.clientY - containerRect.top,
        });
      }
    };

    // 添加全局鼠标移动事件监听
    window.addEventListener("mousemove", handleGlobalMouseMove);

    // 全局鼠标抬起事件处理 - 作为安全保障清理机制
    const handleGlobalMouseUp = (e: MouseEvent) => {
      // 只处理未被Task组件专门处理的事件
      if (
        (dependencyPreview?.active || dependencyDragRef.current.isDragging) &&
        !(e as any)._handledByAnchor
      ) {
        // 重置状态
        setDependencyPreview(null);
        dependencyDragRef.current.isDragging = false;
        dependencyDragRef.current.fromId = null;
        // 清除循环依赖任务标记
        setCircularDependencyTasks([]);
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [dependencyPreview]);

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
        // 先将拖动状态标记为结束，但暂时保留偏移量
        dragState.current.isDragging = false;

        // 对照初始位置，更新所有任务的最终位置并对齐到网格
        setTasks((prevTasks) => {
          // 更新后的任务数组
          const updatedTasks = prevTasks.map((task) => {
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
          });

          // 任务位置更新完成后，在下一个渲染周期重置偏移量
          // 这样可以避免任务回到原位置造成闪烁
          requestAnimationFrame(() => {
            setDragOffset({ x: 0, y: 0 });
            // 隐藏网格并重置鼠标样式
            setShowGrid(false);
            if (container) container.style.cursor = "grab";

            // 强制重新渲染箭头
            setArrowUpdateCounter((prev) => prev + 1);
          });

          return updatedTasks;
        });
      } else {
        // 如果拖动距离不够，直接重置状态
        dragState.current.isDragging = false;
        setDragOffset({ x: 0, y: 0 });
        setShowGrid(false);
        container.style.cursor = "grab";
      }
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

  // 当拖拽锚点开始时，计算并标记所有可能导致循环依赖的任务
  useEffect(() => {
    if (dependencyPreview?.active) {
      calculateCircularDependencyTasks(dependencyPreview.fromId);
    } else {
      setCircularDependencyTasks([]);
    }
  }, [dependencyPreview, calculateCircularDependencyTasks]);

  // 监听任务位置变化，强制更新箭头
  useEffect(() => {
    // 位置变化时，更新一个标识符来强制刷新箭头
    const arrowUpdateElement = document.getElementById("arrows-wrapper");
    if (arrowUpdateElement) {
      // 触发微小的DOM变化，强制React-Xarrows重新计算位置
      arrowUpdateElement.style.transform = "scale(1)";
      setTimeout(() => {
        arrowUpdateElement.style.transform = "";
      }, 0);
    }
  }, [tasks, dragOffset]);

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

      const taskId = `task-${Date.now()}`;

      // 创建新任务
      const newTask = {
        id: taskId,
        position: { x: snapX, y: snapY },
        name: "任务容器",
      };

      setTasks((prevTasks) => [...prevTasks, newTask]);

      // 添加一个延迟标志，防止任务进入无法拖拽状态
      (window as any).__newTaskCreated = taskId;

      // 一段时间后移除标志
      setTimeout(() => {
        if ((window as any).__newTaskCreated === taskId) {
          (window as any).__newTaskCreated = null;
        }
      }, 500);
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
    const snapWidth = Math.round(size.width / 20) * 20;
    const snapHeight = Math.round(size.height / 20) * 20;

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id
          ? { ...task, size: { width: snapWidth, height: snapHeight } }
          : task
      )
    );
  };

  // 处理任务删除功能
  const handleTaskDelete = (id: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));

    // 删除与此任务相关的所有依赖关系
    setDependencies((prevDeps) =>
      prevDeps.filter(([from, to]) => from !== id && to !== id)
    );
  };

  // 显示/隐藏网格的回调函数
  const handleDragOrResizeStart = () => {
    setShowGrid(true);
  };

  const handleDragOrResizeEnd = () => {
    setShowGrid(false);
  };

  // 处理依赖关系的创建
  const handleDependencyStart = (fromTaskId: string) => {
    // 只有在容器引用可用时才继续
    if (!containerRef.current) {
      return;
    }

    // 设置起点任务，确保存储 fromId
    setDependencyPreview({
      fromId: fromTaskId, // 确保正确设置源任务ID
      toPosition: mousePosition,
      active: true,
    });

    // 使用ref存储拖拽状态
    dependencyDragRef.current.isDragging = true;
    dependencyDragRef.current.fromId = fromTaskId;

    // 清除可能的循环依赖警告
    setCircularDependencyWarning(null);

    // 计算可能导致循环依赖的任务
    calculateCircularDependencyTasks(fromTaskId);
  };

  // 处理依赖关系拖动
  const handleDependencyDrag = (e: MouseEvent) => {
    if (!dependencyPreview?.active || !containerRef.current) return;

    // 计算鼠标位置相对于容器的坐标
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    // 更新连线终点位置
    setMousePosition({ x, y });
  };

  // 处理依赖关系的完成
  const handleDependencyEnd = async (toTaskId: string | null) => {
    // 获取ref中存储的当前拖拽任务ID
    const fromId = dependencyDragRef.current.fromId;

    // 清除ref状态
    dependencyDragRef.current.isDragging = false;
    dependencyDragRef.current.fromId = null;

    // 然后清除预览状态
    setDependencyPreview(null);

    // 清除循环依赖任务标记
    setCircularDependencyTasks([]);

    // 如果没有源任务ID或目标任务ID，直接返回
    if (!fromId || !toTaskId) {
      return;
    }

    // 检查是否是自己连接自己
    if (fromId === toTaskId) {
      return;
    }

    // 检查是否会产生循环依赖
    if (circularDependencyTasks.includes(toTaskId)) {
      // 如果目标任务会导致循环依赖，不执行任何操作
      return;
    }

    try {
      // 尝试添加新的依赖关系
      await addTaskDependency(fromId, toTaskId);

      // 只有在成功添加后才更新本地状态
      setDependencies((prevDeps) => {
        // 检查是否已存在相同的依赖关系
        const exists = prevDeps.some(
          ([from, to]) => from === fromId && to === toTaskId
        );
        if (!exists) {
          return [...prevDeps, [fromId, toTaskId]];
        }
        return prevDeps;
      });
    } catch (error) {
      // 如果发生错误（包括循环依赖错误），记录到控制台但不更新状态
      console.error("TaskArea: 添加依赖关系时出错:", error);
      // 这里不显示任何错误信息给用户，因为我们已经通过视觉反馈提示了不可连接
    }
  };

  // 处理依赖关系的删除（双击依赖箭头）
  const handleDependencyClick = async (
    fromId: string,
    toId: string,
    e: React.MouseEvent
  ) => {
    // 检测双击
    if (e.detail === 2) {
      await removeTaskDependency(fromId, toId);

      // 更新本地状态
      setDependencies((prevDeps) =>
        prevDeps.filter(([from, to]) => !(from === fromId && to === toId))
      );
    }
  };

  return (
    <div className="task-area">
      <div className="task-area-header">
        <h3>任务区（定义任务、目标和节点）（双击新建任务）</h3>
        {circularDependencyWarning && (
          <div className="circular-dependency-warning">
            {circularDependencyWarning}
          </div>
        )}
      </div>
      <div
        ref={containerRef}
        className={`task-area-container ${showGrid ? "show-grid" : ""}`}
        onDoubleClick={handleDoubleClick}
      >
        {/* 箭头包装器，用于强制更新箭头位置 */}
        <div id="arrows-wrapper">
          {/* 渲染任务依赖关系箭头 */}
          {dependencies.map(([fromId, toId], index) => (
            <Xarrow
              key={`${fromId}-${toId}-${index}`}
              start={`anchor-${fromId}`}
              end={`anchor-${toId}`}
              startAnchor="bottom"
              endAnchor="bottom"
              color="#4a8af4"
              strokeWidth={2}
              path="smooth"
              showHead={true}
              curveness={0.3}
              dashness={false}
              headShape="arrow1"
              headSize={4}
              passProps={{
                onClick: (e: React.MouseEvent) =>
                  handleDependencyClick(fromId, toId, e),
              }}
            />
          ))}

          {/* 渲染正在创建的依赖关系预览 */}
          {dependencyPreview &&
            dependencyPreview.active &&
            containerRef.current && (
              <div
                id="temp-arrow-end"
                className="temp-arrow-end"
                style={{
                  left: mousePosition.x,
                  top: mousePosition.y,
                }}
              />
            )}

          {/* 渲染正在创建的依赖关系预览 */}
          {dependencyPreview && dependencyPreview.active && (
            <Xarrow
              start={`anchor-${dependencyPreview.fromId}`}
              end="temp-arrow-end"
              startAnchor="bottom"
              color="#4a8af4"
              strokeWidth={2}
              path="smooth"
              showHead={true}
              dashness={true}
              headShape="arrow1"
              headSize={4}
            />
          )}
        </div>

        {/* 渲染任务 */}
        {tasks.map((task) => (
          <Task
            key={task.id}
            id={task.id}
            initialPosition={task.position}
            initialName={task.name}
            initialSize={task.size}
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
            onDependencyStart={handleDependencyStart}
            onDependencyDrag={handleDependencyDrag}
            onDependencyEnd={handleDependencyEnd}
            isCircularDependency={
              dependencyPreview?.active &&
              circularDependencyTasks.includes(task.id)
            }
          />
        ))}
      </div>
    </div>
  );
};

export default TaskArea;
