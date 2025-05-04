import React, { useState, useRef, useEffect } from "react";
import { useDrag } from "react-dnd";
import "./styles.css";

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
  deleteZoneIsHovering?: boolean;
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
  isCircularDependency?: boolean; // 添加是否会导致循环依赖的属性
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
  deleteZoneIsHovering,
  gridSize = 20, // 默认网格大小为20px
  onDragStart,
  onDragEnd,
  onResizeStart,
  onResizeEnd,
  dragOffset,
  onDependencyStart,
  onDependencyDrag,
  onDependencyEnd,
  isCircularDependency = false, // 默认不会导致循环依赖
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

  const [position, setPosition] = useState(alignedInitialPosition);
  const [size, setSize] = useState(alignedInitialSize);
  const [isResizing, setIsResizing] = useState(false);
  const [name, setName] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const initialSize_ = useRef({ width: 0, height: 0 });
  const taskRef = useRef<HTMLDivElement>(null);
  const [isOverlapping, setIsOverlapping] = useState(false);
  const [isDraggingAnchor, setIsDraggingAnchor] = useState(false);
  const dragAnchorRef = useRef({
    isDragging: false,
    fromId: id,
  });

  const checkOverlap = (taskRect: DOMRect, deleteRect: DOMRect) => {
    const overlapX =
      Math.min(taskRect.right, deleteRect.right) -
      Math.max(taskRect.left, deleteRect.left);
    const overlapY =
      Math.min(taskRect.bottom, deleteRect.bottom) -
      Math.max(taskRect.top, deleteRect.top);
    return overlapX >= 15 && overlapY >= 15;
  };

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
    // 增加对新创建任务的特殊检查，确保不会同时进入锚点拖拽状态
    canDrag: () => {
      // 如果正在拖拽锚点，禁止拖拽任务
      if (isDraggingAnchor) {
        return false;
      }

      // 检查是否为刚刚创建的任务，如果是则允许拖拽
      if ((window as any).__newTaskCreated === id) {
        return true;
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
    setIsResizing(true);
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
    setIsResizing(false);
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

  // 处理锚点鼠标按下事件
  const handleAnchorMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // 设置组件内部状态
    setIsDraggingAnchor(true);

    // 同时更新ref，确保后续事件处理中能访问到最新状态
    dragAnchorRef.current.isDragging = true;
    dragAnchorRef.current.fromId = id;

    // 计算鼠标位置相对于容器的坐标（用于初始化箭头位置）
    let initialMousePosition;
    if (containerRef && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      initialMousePosition = {
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top,
      };

      // 通知父组件开始创建依赖，并传递初始鼠标位置
      onDependencyStart?.(id, "bottom", initialMousePosition);
    } else {
      // 如果无法获取容器位置，则不传递初始位置
      onDependencyStart?.(id, "bottom");
    }

    // 添加全局鼠标移动和抬起事件监听，使用捕获阶段确保优先处理
    document.addEventListener("mousemove", handleAnchorMouseMove, {
      capture: true,
    });
    document.addEventListener("mouseup", handleAnchorMouseUp, {
      capture: true,
    });
  };

  const handleAnchorMouseMove = (e: MouseEvent) => {
    // 使用ref检查拖拽状态，确保总能访问到最新状态
    if (dragAnchorRef.current.isDragging) {
      onDependencyDrag?.(e);
    }
  };

  const handleAnchorMouseUp = (e: MouseEvent) => {
    // 使用ref检查拖拽状态
    if (dragAnchorRef.current.isDragging) {
      // 1. 立即清除事件监听
      document.removeEventListener("mousemove", handleAnchorMouseMove, {
        capture: true,
      });
      document.removeEventListener("mouseup", handleAnchorMouseUp, {
        capture: true,
      });

      // 2. 阻止事件冒泡，避免事件穿透到其他元素
      e.stopPropagation();
      e.preventDefault();

      // 3. 标记此事件已被处理（仅用于调试和事件冲突检测）
      (e as any)._handledByAnchor = true;

      // 4. 临时从 DOM 中移除当前锚点元素，以便能够检测到下面的元素
      const anchorElem = document.getElementById(`anchor-${id}`);
      const anchorStyle = anchorElem ? anchorElem.style.display : "";
      if (anchorElem) anchorElem.style.display = "none";

      // 5. 现在能够检测到锚点下方的元素
      const elemBelow = document.elementFromPoint(e.clientX, e.clientY);

      // 6. 恢复锚点元素
      if (anchorElem) anchorElem.style.display = anchorStyle;

      let targetTaskId: string | null = null;

      if (elemBelow) {
        let targetElement: Element | null = elemBelow;

        while (targetElement && !targetTaskId) {
          const dataTaskId = targetElement.getAttribute("data-task-id");
          if (dataTaskId && dataTaskId !== id) {
            // 确保不是自身
            targetTaskId = dataTaskId;
            break;
          }
          targetElement = targetElement.parentElement;
        }
      }

      // 7. 先保存状态，再重置
      const fromId = dragAnchorRef.current.fromId;
      const toId = targetTaskId;

      // 8. 重置拖拽状态 - 重要：先重置ref，再更新React状态
      dragAnchorRef.current.isDragging = false;
      setIsDraggingAnchor(false);

      // 9. 调用依赖结束处理函数
      if (onDependencyEnd) {
        // 使用Promise确保回调函数完成后再继续
        Promise.resolve().then(() => {
          onDependencyEnd(toId);
        });
      }
    }
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

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleAnchorMouseMove);
      document.removeEventListener("mouseup", handleAnchorMouseUp);
      document.removeEventListener("mousemove", handleResizeMoveEvent);
      document.removeEventListener("mouseup", handleResizeEndEvent);
    };
  }, []);

  useEffect(() => {
    if (isDragging && deleteZoneRef?.current && taskRef.current) {
      const deleteRect = deleteZoneRef.current.getBoundingClientRect();
      const taskRect = taskRef.current.getBoundingClientRect();
      const isOverlap = checkOverlap(taskRect, deleteRect);
      setIsOverlapping(isOverlap);
    } else {
      setIsOverlapping(false);
    }
  }, [isDragging, deleteZoneRef, position]);

  return (
    <div
      ref={(node) => {
        drag(node as HTMLDivElement);
        if (node) taskRef.current = node;
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
    </div>
  );
};

export default Task;
