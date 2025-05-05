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
import { convRef } from "~/utils";
import DeleteZoneContext from "~/components/contexts/DeleteZoneContext";
import { useProject } from "~/components/contexts/ProjectContext";
import Xarrow from "react-xarrows";
import { createTask } from "~/types/Task"; // 导入createTask函数

// 全局window接口扩展
interface ExtendedWindow extends Window {
  __newTaskCreated: string | null;
}

// 任务依赖连线预览
interface DependencyLine {
  fromId: string;
  toPosition: { x: number; y: number };
  active: boolean;
}

const TaskArea: FC = () => {
  const { project, updateProject } = useProject();

  // 增强版任务类型，保存完整任务信息
  interface EnhancedTask {
    id: string; // UI 中显示的 ID
    numericId: number; // 实际存储的数字 ID
    position: { x: number; y: number };
    name: string;
    size?: { width: number; height: number };
  }

  const [tasks, setTasks] = useState<EnhancedTask[]>([]);
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

  const deleteZoneContext = useContext(DeleteZoneContext);

  // 加载依赖关系
  useEffect(() => {
    if (!project) {
      return;
    }

    // 从project.config直接获取任务依赖关系
    setDependencies(
      project.config.taskGraph.map(([from, to]) => [
        `task-${from}`,
        `task-${to}`,
      ])
    );
  }, [project?.config.taskGraph]);

  // 从项目配置中加载任务
  useEffect(() => {
    if (!project) {
      return;
    }

    // 从项目配置中获取任务
    const projectTasks = project.config.tasks || [];

    // 转换成增强型任务对象
    const enhancedTasks: EnhancedTask[] = projectTasks.map((task) => {
      // 直接使用配置中的位置，如果不存在则使用默认位置
      const position = task.position || { x: 100, y: 100 };

      // 直接使用配置中的大小，如果不存在则使用默认大小
      const size = task.size || { width: 120, height: 80 };

      return {
        id: `task-${task.id}`,
        numericId: task.id,
        position,
        name: task.name,
        size,
      };
    });

    setTasks(enhancedTasks);
    console.log("已加载任务:", enhancedTasks);
  }, [project?.config.tasks]); // 只在任务列表真正变化时才重新加载

  // 检查是否会形成循环依赖
  const checkCircularDependency = useCallback(
    (fromTaskId: string, toTaskId: string): boolean => {
      if (!project) {
        return false;
      }
      return project.hasCircularDependency(fromTaskId, toTaskId);
    },
    [project]
  );

  // 计算拖拽依赖过程中所有可能导致循环依赖的任务
  const calculateCircularDependencyTasks = useCallback(
    (fromTaskId: string | null) => {
      if (!fromTaskId || !project) {
        setCircularDependencyTasks([]);
        return;
      }

      // 获取所有可能导致循环依赖的目标任务ID
      const circularTasks = tasks
        .map((task) => task.id)
        .filter(
          (taskId) =>
            taskId !== fromTaskId &&
            checkCircularDependency(
              fromTaskId.replace("task-", ""),
              taskId.replace("task-", "")
            )
        );

      setCircularDependencyTasks(circularTasks);
    },
    [tasks, checkCircularDependency, project]
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
        const newPosition = {
          x: e.clientX - containerRect.left,
          y: e.clientY - containerRect.top,
        };

        // 只有当位置真正改变时才更新状态，避免不必要的重新渲染
        setMousePosition((prevPos) => {
          if (prevPos.x !== newPosition.x || prevPos.y !== newPosition.y) {
            return newPosition;
          }
          return prevPos;
        });
      }
    };

    // 添加全局鼠标移动事件监听
    window.addEventListener("mousemove", handleGlobalMouseMove);

    // 全局鼠标抬起事件处理 - 作为安全保障清理机制
    const handleGlobalMouseUp = (e: MouseEvent) => {
      // 扩展MouseEvent以包含可能的_handledByAnchor属性
      interface ExtendedMouseEvent extends MouseEvent {
        _handledByAnchor?: boolean;
      }
      const extendedEvent = e as ExtendedMouseEvent;

      // 只处理未被Task组件专门处理的事件
      if (
        (dependencyPreview?.active || dependencyDragRef.current.isDragging) &&
        !extendedEvent._handledByAnchor
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
    if (!container) {
      return;
    }

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
      if (!dragState.current.isDragging) {
        return;
      }

      // 计算总移动距离
      const deltaX = e.clientX - dragState.current.startPosition.x;
      const deltaY = e.clientY - dragState.current.startPosition.y;

      // 更新当前位置
      dragState.current.currentPosition = { x: e.clientX, y: e.clientY };

      // 设置视觉偏移量，用于更新视图
      setDragOffset({ x: deltaX, y: deltaY });
    };

    // 鼠标抬起事件处理
    const handleMouseUp = async (e: MouseEvent) => {
      if (!dragState.current.isDragging) {
        return;
      }

      // 计算总移动距离
      const deltaX = e.clientX - dragState.current.startPosition.x;
      const deltaY = e.clientY - dragState.current.startPosition.y;

      // 先将拖动状态标记为结束，但暂时保留偏移量
      dragState.current.isDragging = false;

      // 对照初始位置，更新所有任务的最终位置并对齐到网格
      setTasks((prevTasks) => {
        // 更新后的任务数组
        const updatedTasks = prevTasks.map((task) => {
          const initialPos = dragState.current.tasksInitialPositions.get(
            task.id
          );
          if (!initialPos) {
            return task;
          }

          // 计算新位置并与网格对齐
          const newX = Math.round((initialPos.x + deltaX) / 20) * 20;
          const newY = Math.round((initialPos.y + deltaY) / 20) * 20;

          return {
            ...task,
            position: { x: newX, y: newY },
          };
        });

        // 任务位置更新完成后，保存到配置文件
        const savePositions = async () => {
          try {
            if (!project) {
              return;
            }

            // 为每个任务更新位置信息
            for (const task of updatedTasks) {
              const taskIndex = project.config.tasks.findIndex(
                (t) => t.id === task.numericId
              );
              if (taskIndex !== -1) {
                project.config.tasks[taskIndex].position = {
                  ...task.position,
                };
              }
            }

            // 保存更新
            await updateProject();
          } catch (error) {
            console.error("批量更新任务位置失败:", error);
          }
        };

        // 执行保存操作
        savePositions();

        // 任务位置更新完成后，在下一个渲染周期重置偏移量
        requestAnimationFrame(() => {
          setDragOffset({ x: 0, y: 0 });
          // 隐藏网格并重置鼠标样式
          setShowGrid(false);
          if (container) {
            container.style.cursor = "grab";
          }

          // 强制更新箭头位置
          // 使用setTimeout确保在DOM更新后再触发箭头重绘
          setTimeout(() => {
            // 创建并触发一个自定义事件，以便react-xarrows库可以检测到位置变化
            const resizeEvent = new Event("resize");
            window.dispatchEvent(resizeEvent);

            // 如果使用的是React Xarrows的2.x或更高版本，可以尝试通过手动更新依赖关系来触发重绘
            setDependencies((prev) => [...prev]);
          }, 0);
        });

        return updatedTasks;
      });
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
  }, [tasks, project, updateProject]);

  // 当拖拽锚点开始时，计算并标记所有可能导致循环依赖的任务
  useEffect(() => {
    if (dependencyPreview?.active) {
      calculateCircularDependencyTasks(dependencyPreview.fromId);
    } else {
      setCircularDependencyTasks([]);
    }
  }, [dependencyPreview, calculateCircularDependencyTasks]);

  const handleDoubleClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!project) {
      return;
    }

    // 计算点击位置相对于容器的坐标
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 如果点击的是容器而不是任务
    if ((e.target as HTMLElement).classList.contains("task-area-container")) {
      // 定义任务的默认尺寸（与其他地方保持一致）
      const defaultWidth = 120;
      const defaultHeight = 80;

      // 计算任务左上角位置，使点击位置成为任务的中心
      // 将位置调整为最近的20px网格
      const snapX = Math.round((x - defaultWidth / 2) / 20) * 20;
      const snapY = Math.round((y - defaultHeight / 2) / 20) * 20;

      // 获取新的任务ID，增加taskCounter计数器
      const numericId = ++project.config.idCounters.taskCounter;
      // 为了保持一致性，任务ID使用字符串格式
      const taskId = `task-${numericId}`;

      // 创建新任务配置
      const taskConfig = createTask(numericId);
      // 设置位置和大小
      taskConfig.position = { x: snapX, y: snapY };
      taskConfig.size = { width: defaultWidth, height: defaultHeight };

      try {
        // 将任务添加到项目配置文件
        project.config.tasks.push(taskConfig);
        await updateProject();

        // 创建新任务UI元素
        const newTask: EnhancedTask = {
          id: taskId,
          numericId: numericId,
          position: { x: snapX, y: snapY },
          name: taskConfig.name,
          size: { width: defaultWidth, height: defaultHeight },
        };

        setTasks((prevTasks) => [...prevTasks, newTask]);
      } catch (error) {
        console.error("创建新任务失败:", error);
      }
    }
  };

  const handleTaskPositionChange = async (
    id: string,
    position: { x: number; y: number }
  ) => {
    if (!project) {
      return;
    }

    // 将位置调整为最近的20px网格
    const snapX = Math.round(position.x / 20) * 20;
    const snapY = Math.round(position.y / 20) * 20;

    // 查找任务以获取数字ID
    const task = tasks.find((task) => task.id === id);
    if (!task) {
      console.error("找不到要移动的任务:", id);
      return;
    }

    // 更新本地状态
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === id ? { ...t, position: { x: snapX, y: snapY } } : t
      )
    );

    try {
      // 查找并更新项目配置中的任务位置
      const taskIndex = project.config.tasks.findIndex(
        (t) => t.id === task.numericId
      );
      if (taskIndex !== -1) {
        // 保留其他属性，只更新位置
        project.config.tasks[taskIndex].position = { x: snapX, y: snapY };
        // 保存更新
        await updateProject();
      }
    } catch (error) {
      console.error("更新任务位置失败:", error);
    }
  };

  const handleTaskNameChange = async (id: string, name: string) => {
    if (!project) {
      return;
    }

    try {
      // 查找任务以获取数字ID
      const task = tasks.find((task) => task.id === id);
      if (!task) {
        console.error("找不到要重命名的任务:", id);
        return;
      }

      // 更新本地状态
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === id ? { ...task, name } : task))
      );

      // 查找并更新项目配置中的任务名称
      const taskIndex = project.config.tasks.findIndex(
        (t) => t.id === task.numericId
      );
      if (taskIndex !== -1) {
        project.config.tasks[taskIndex].name = name;
        await updateProject();
      }
    } catch (error) {
      console.error("更新任务名称失败:", error);
    }
  };

  const handleTaskSizeChange = async (
    id: string,
    size: { width: number; height: number }
  ) => {
    if (!project) {
      return;
    }

    // 将大小调整为20px的倍数
    const snapWidth = Math.round(size.width / 20) * 20;
    const snapHeight = Math.round(size.height / 20) * 20;

    // 查找任务以获取数字ID
    const task = tasks.find((task) => task.id === id);
    if (!task) {
      console.error("找不到要调整大小的任务:", id);
      return;
    }

    // 更新本地状态
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === id
          ? { ...t, size: { width: snapWidth, height: snapHeight } }
          : t
      )
    );

    try {
      // 查找并更新项目配置中的任务大小
      const taskIndex = project.config.tasks.findIndex(
        (t) => t.id === task.numericId
      );
      if (taskIndex !== -1) {
        // 保留其他属性，只更新大小
        project.config.tasks[taskIndex].size = {
          width: snapWidth,
          height: snapHeight,
        };
        // 保存更新
        await updateProject();
      }
    } catch (error) {
      console.error("更新任务大小失败:", error);
    }
  };

  // 处理任务删除功能
  const handleTaskDelete = async (id: string) => {
    if (!project) {
      return;
    }

    try {
      // 查找要删除的任务，获取其数字ID
      const taskToDelete = tasks.find((task) => task.id === id);
      if (!taskToDelete) {
        console.error("找不到要删除的任务:", id);
        return;
      }

      // 从项目配置中删除任务
      project.config.tasks = project.config.tasks.filter(
        (t) => t.id !== taskToDelete.numericId
      );

      // 删除与此任务相关的所有依赖关系
      project.config.taskGraph = project.config.taskGraph.filter(
        ([from, to]) =>
          from !== taskToDelete.numericId.toString() &&
          to !== taskToDelete.numericId.toString()
      );

      // 保存更新
      await updateProject();

      // 更新UI状态
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));

      // 更新依赖关系UI状态
      setDependencies((prevDeps) =>
        prevDeps.filter(([from, to]) => from !== id && to !== id)
      );
    } catch (error) {
      console.error("删除任务失败:", error);
    }
  };

  // 显示/隐藏网格的回调函数
  const handleDragOrResizeStart = () => {
    setShowGrid(true);
  };

  const handleDragOrResizeEnd = () => {
    setShowGrid(false);
  };

  // 处理依赖关系的创建
  const handleDependencyStart = (
    fromTaskId: string,
    anchorPoint?: string,
    initialPosition?: { x: number; y: number }
  ) => {
    // 只有在容器引用可用时才继续
    if (!containerRef.current) {
      return;
    }

    // 如果有提供初始位置，立即更新鼠标位置，避免箭头闪烁
    if (initialPosition) {
      setMousePosition(initialPosition);
    }

    // 设置起点任务，确保存储 fromId
    setDependencyPreview({
      fromId: fromTaskId,
      toPosition: mousePosition, // 此时如果有初始位置传入，应该已被更新
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
    if (!dependencyPreview?.active || !containerRef.current) {
      return;
    }

    // 计算鼠标位置相对于容器的坐标
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    // 更新连线终点位置
    setMousePosition({ x, y });
  };

  const handleDependencyEnd = async (toTaskId: string | null) => {
    if (!project) {
      return;
    }

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
      // 提取数字ID（去掉"task-"前缀）
      const fromNumericId = fromId.replace("task-", "");
      const toNumericId = toTaskId.replace("task-", "");

      // 检查是否已存在相同的依赖关系
      const exists = project.config.taskGraph.some(
        ([from, to]) => from === fromNumericId && to === toNumericId
      );

      if (!exists) {
        // 添加新的依赖关系
        project.config.taskGraph.push([fromNumericId, toNumericId]);
        await updateProject();

        // 更新本地状态
        setDependencies((prevDeps) => [...prevDeps, [fromId, toTaskId]]);
      }
    } catch (error) {
      // 如果发生错误（包括循环依赖错误），记录到控制台但不更新状态
      console.error("TaskArea: 添加依赖关系时出错:", error);
      // 这里不显示任何错误信息给用户，因为我们已经通过视觉反馈提示了不可连接
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
            containerRef={convRef(containerRef)}
            deleteZoneRef={deleteZoneContext.ref}
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
