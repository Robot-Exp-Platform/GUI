import React, { useState, useRef, useEffect } from "react";
import { useDrag } from "react-dnd";
import "./styles.css";
import TaskEditor from "./TaskEditor";
import { useProject } from "~/components/contexts/ProjectContext";
import { Task as TaskType } from "~/types/Task";

interface TaskProps {
  id: string;
  initialName?: string;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  onPositionChange?: (id: string, position: { x: number; y: number }) => void;
  onSizeChange?: (id: string, size: { width: number; height: number }) => void;
  onNameChange?: (id: string, name: string) => void;
  onDelete?: (id: string) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  deleteZoneRef?: React.RefObject<HTMLDivElement> | null;
  gridSize?: number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  dragOffset?: { x: number; y: number };
  onDependencyStart?: (
    taskId: string,
    anchorPoint: string,
    initialMousePosition?: { x: number; y: number }
  ) => void;
  onDependencyDrag?: (e: MouseEvent) => void;
  onDependencyEnd?: (targetTaskId: string | null) => void;
  isCircularDependency?: boolean;
}

const Task: React.FC<TaskProps> = ({
  id,
  initialName = "任务容器",
  initialPosition = { x: 0, y: 0 },
  initialSize = { width: 120, height: 80 },
  onPositionChange,
  onSizeChange,
  onNameChange,
  onDelete,
  containerRef,
  deleteZoneRef,
  gridSize = 20,
  onDragStart,
  onDragEnd,
  onResizeStart,
  onResizeEnd,
  dragOffset,
  onDependencyStart,
  onDependencyDrag,
  onDependencyEnd,
  isCircularDependency = false,
}) => {
  const alignToGrid = (value: number) =>
    Math.round(value / gridSize) * gridSize;
  const alignedInitialPosition = {
    x: alignToGrid(initialPosition.x),
    y: alignToGrid(initialPosition.y),
  };
  const alignedInitialSize = {
    width: alignToGrid(initialSize.width),
    height: alignToGrid(initialSize.height),
  };

  const { project, updateProject } = useProject();
  const [position, setPosition] = useState(alignedInitialPosition);
  const [size, setSize] = useState(alignedInitialSize);
  const [name, setName] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const initialSize_ = useRef({ width: 0, height: 0 });
  const taskRef = useRef<HTMLDivElement>(null);
  const dragAnchorRef = useRef({
    isDragging: false,
  });

  // 获取当前任务对象
  const getTaskById = (numericId: number) =>
    project?.config.tasks.find((task) => task.id === numericId);

  const [{ isDragging }, drag] = useDrag({
    type: "TASK",
    item: () => {
      onDragStart?.();
      return {
        id,
        position,
        type: "TASK",
        rect: taskRef.current?.getBoundingClientRect(),
      };
    },
    canDrag: () => {
      if (dragAnchorRef.current.isDragging) {
        return false;
      }
      return true;
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
      onDragEnd?.();
      const dropResult = monitor.getDropResult<{ deleted?: boolean }>();
      if (dropResult && dropResult.deleted) {
        onDelete?.(id);
        return;
      }
      const delta = monitor.getDifferenceFromInitialOffset();
      if (delta) {
        const newX = alignToGrid(position.x + delta.x);
        const newY = alignToGrid(position.y + delta.y);
        const newPosition = { x: newX, y: newY };
        setPosition(newPosition);
        onPositionChange?.(id, newPosition);
      }
    },
  });

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStartPos.current = { x: e.clientX, y: e.clientY };
    initialSize_.current = { ...size };
    onResizeStart?.();
    document.addEventListener("mousemove", handleResizeMoveEvent);
    document.addEventListener("mouseup", handleResizeEndEvent);
  };

  const handleResizeMoveEvent = (e: MouseEvent) => {
    const deltaWidth = e.clientX - resizeStartPos.current.x;
    const deltaHeight = e.clientY - resizeStartPos.current.y;
    const newUnadjustedWidth = Math.max(
      60,
      initialSize_.current.width + deltaWidth
    );
    const newUnadjustedHeight = Math.max(
      40,
      initialSize_.current.height + deltaHeight
    );
    const newWidth = alignToGrid(newUnadjustedWidth);
    const newHeight = alignToGrid(newUnadjustedHeight);
    setSize({ width: newWidth, height: newHeight });
    onSizeChange?.(id, { width: newWidth, height: newHeight });
  };

  const handleResizeEndEvent = () => {
    document.removeEventListener("mousemove", handleResizeMoveEvent);
    document.removeEventListener("mouseup", handleResizeEndEvent);
    onResizeEnd?.();
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleNameBlur = () => {
    setIsEditing(false);
    onNameChange?.(id, name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      onNameChange?.(id, name);
    }
  };

  const handleAnchorMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    dragAnchorRef.current.isDragging = true;

    let initialMousePosition;
    if (containerRef && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      initialMousePosition = {
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top,
      };

      onDependencyStart?.(id, "bottom", initialMousePosition);
    } else {
      onDependencyStart?.(id, "bottom");
    }

    document.addEventListener("mousemove", handleAnchorMouseMove, {
      capture: true,
    });
    document.addEventListener("mouseup", handleAnchorMouseUp, {
      capture: true,
    });
  };

  const handleAnchorMouseMove = (e: MouseEvent) => {
    if (dragAnchorRef.current.isDragging) {
      onDependencyDrag?.(e);
    }
  };

  const handleAnchorMouseUp = (e: MouseEvent) => {
    if (dragAnchorRef.current.isDragging) {
      document.removeEventListener("mousemove", handleAnchorMouseMove, {
        capture: true,
      });
      document.removeEventListener("mouseup", handleAnchorMouseUp, {
        capture: true,
      });

      e.stopPropagation();
      e.preventDefault();

      const anchorElem = document.getElementById(`anchor-${id}`);
      const anchorStyle = anchorElem ? anchorElem.style.display : "";
      if (anchorElem) {
        anchorElem.style.display = "none";
      }

      const elemBelow = document.elementFromPoint(e.clientX, e.clientY);

      if (anchorElem) {
        anchorElem.style.display = anchorStyle;
      }

      let targetTaskId: string | null = null;

      if (elemBelow) {
        let targetElement: Element | null = elemBelow;

        while (targetElement && !targetTaskId) {
          const dataTaskId = targetElement.getAttribute("data-task-id");
          if (dataTaskId && dataTaskId !== id) {
            targetTaskId = dataTaskId;
            break;
          }
          targetElement = targetElement.parentElement;
        }
      }

      const toId = targetTaskId;

      dragAnchorRef.current.isDragging = false;

      if (onDependencyEnd) {
        Promise.resolve().then(() => {
          onDependencyEnd(toId);
        });
      }
    }
  };

  // 处理右键菜单，打开编辑器
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // 防止默认右键菜单显示
    setIsEditorOpen(true);
  };

  // 关闭任务编辑器
  const handleEditorClose = () => {
    setIsEditorOpen(false);
  };

  // 保存任务更改
  const handleSaveTask = async (updatedTask: TaskType) => {
    try {
      // 获取任务ID（去除"task-"前缀）
      const numericId = parseInt(id.replace("task-", ""), 10);

      if (!project) {
        console.error("项目未加载，无法保存任务");
        return false;
      }

      // 查找并更新项目配置中的任务
      const taskIndex = project.config.tasks.findIndex(
        (t) => t.id === numericId
      );

      if (taskIndex !== -1) {
        // 更新名称和target字段，保留其他属性不变
        project.config.tasks[taskIndex].name = updatedTask.name;
        project.config.tasks[taskIndex].target = updatedTask.target;

        // 保存项目
        await project.save();

        // 更新UI
        await updateProject();

        // 更新本地状态
        setName(updatedTask.name);

        // 通知父组件
        onNameChange?.(id, updatedTask.name);

        return true;
      }

      console.error("找不到要更新的任务:", numericId);
      return false;
    } catch (error) {
      console.error("保存任务失败:", error);
      return false;
    }
  };

  // 检查任务名称是否重复
  const checkDuplicateTaskName = (name: string, currentId: number): boolean => {
    if (!project) return false;

    return project.config.tasks.some(
      (task) => task.name === name && task.id !== currentId
    );
  };

  useEffect(() => {
    setPosition({
      x: alignToGrid(initialPosition.x),
      y: alignToGrid(initialPosition.y),
    });
  }, [initialPosition, gridSize]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(
    () => () => {
      document.removeEventListener("mousemove", handleAnchorMouseMove);
      document.removeEventListener("mouseup", handleAnchorMouseUp);
      document.removeEventListener("mousemove", handleResizeMoveEvent);
      document.removeEventListener("mouseup", handleResizeEndEvent);
    },
    []
  );

  useEffect(() => {
    // 移除未使用的表达式检测
    if (isDragging && deleteZoneRef?.current && taskRef.current) {
      // 这里检测重叠但未使用结果，删除此无效代码
      // const deleteRect = deleteZoneRef.current.getBoundingClientRect();
      // const taskRect = taskRef.current.getBoundingClientRect();
      // const isOverlap = checkOverlap(taskRect, deleteRect);
    }
  }, [isDragging, deleteZoneRef, position]);

  return (
    <div
      ref={(node) => {
        drag(node as HTMLDivElement);
        if (node) {
          taskRef.current = node;
        }
      }}
      data-task-id={id}
      className={`task ${isDragging ? "dragging" : ""} ${
        isCircularDependency ? "circular-dependency" : ""
      }`}
      style={{
        left: position.x + (dragOffset?.x || 0),
        top: position.y + (dragOffset?.y || 0),
        width: size.width,
        height: size.height,
      }}
      onContextMenu={handleContextMenu}
    >
      <div className="task-content">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleKeyDown}
            className="task-name-input"
          />
        ) : (
          <div onDoubleClick={handleDoubleClick} className="task-name">
            {name}
          </div>
        )}

        <div
          className="task-resize-handle"
          onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
            e.stopPropagation();
            handleResizeStart(e);
          }}
        >
          <div className="task-resize-indicator" />
        </div>

        <div
          id={`anchor-${id}`}
          className="task-anchor"
          onMouseDown={handleAnchorMouseDown}
        />

        {isCircularDependency && (
          <div className="circular-dependency-marker">循环依赖</div>
        )}
      </div>

      {isEditorOpen && (
        <>
          {(() => {
            const numericId = parseInt(id.replace("task-", ""), 10);
            const taskObj = getTaskById(numericId);

            if (taskObj) {
              return (
                <TaskEditor
                  task={taskObj}
                  open={isEditorOpen}
                  onClose={handleEditorClose}
                  onSave={handleSaveTask}
                  checkDuplicateName={checkDuplicateTaskName}
                />
              );
            }
            return null;
          })()}
        </>
      )}
    </div>
  );
};

export default Task;
