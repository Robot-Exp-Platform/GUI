import React, { useState, useRef, useEffect } from "react";
import { useDrag } from "react-dnd";

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
  // 添加网格大小属性
  gridSize?: number;
  // 添加拖拽和调整大小的开始/结束事件回调
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  // 添加拖动偏移量，用于容器拖动时的临时位置调整
  dragOffset?: { x: number; y: number };
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
}) => {
  // 确保初始位置和大小与网格对齐
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

  // 用于检测重叠的状态
  const [isOverlapping, setIsOverlapping] = useState(false);

  // 检查任务和删除区域的重叠状态
  const checkOverlap = (taskRect: DOMRect, deleteRect: DOMRect) => {
    // 计算重叠区域
    const overlapX =
      Math.min(taskRect.right, deleteRect.right) -
      Math.max(taskRect.left, deleteRect.left);
    const overlapY =
      Math.min(taskRect.bottom, deleteRect.bottom) -
      Math.max(taskRect.top, deleteRect.top);

    // 如果横向和纵向重叠都大于等于15px，则认为重叠足够
    return overlapX >= 15 && overlapY >= 15;
  };

  // 拖拽功能
  const [{ isDragging }, drag] = useDrag({
    type: "TASK",
    item: () => {
      // 触发拖拽开始回调
      onDragStart?.();
      return {
        id,
        position,
        type: "TASK",
        rect: taskRef.current?.getBoundingClientRect(),
      };
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
      // 触发拖拽结束回调
      onDragEnd?.();

      const dropResult = monitor.getDropResult<{ deleted?: boolean }>();

      // 检查是否被删除
      if (dropResult && dropResult.deleted) {
        // 调用删除回调
        onDelete?.(id);
        return;
      }

      const delta = monitor.getDifferenceFromInitialOffset();

      if (delta) {
        // 计算新位置并与网格对齐（改为加法，使方向一致）
        const newX = alignToGrid(position.x + delta.x);
        const newY = alignToGrid(position.y + delta.y);
        const newPosition = { x: newX, y: newY };

        setPosition(newPosition);
        onPositionChange?.(id, newPosition);
      }
    },
  });

  // 处理调整大小
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 设置调整大小状态和初始值
    setIsResizing(true);
    resizeStartPos.current = { x: e.clientX, y: e.clientY };
    initialSize_.current = { ...size };

    // 触发调整大小开始回调
    onResizeStart?.();

    // 添加全局事件监听器 - 使用内联函数确保访问到最新状态
    document.addEventListener("mousemove", handleResizeMoveEvent);
    document.addEventListener("mouseup", handleResizeEndEvent);
  };

  // 将事件处理函数分离出来，以避免闭包问题
  const handleResizeMoveEvent = (e: MouseEvent) => {
    // 这里不检查 isResizing 状态，因为我们只在开始调整大小时添加这个监听器
    const deltaWidth = e.clientX - resizeStartPos.current.x;
    const deltaHeight = e.clientY - resizeStartPos.current.y;

    // 计算新的宽度和高度，并调整为网格的倍数
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

    // 设置大小，不再检查容器边界
    setSize({ width: newWidth, height: newHeight });

    // 通知大小变化
    onSizeChange?.(id, { width: newWidth, height: newHeight });
  };

  const handleResizeEndEvent = () => {
    setIsResizing(false);

    // 移除事件监听器
    document.removeEventListener("mousemove", handleResizeMoveEvent);
    document.removeEventListener("mouseup", handleResizeEndEvent);

    // 触发调整大小结束回调
    onResizeEnd?.();
  };

  // 保留原来的函数用于兼容性，但实际不再使用
  const handleResizeMove = handleResizeMoveEvent;
  const handleResizeEnd = handleResizeEndEvent;

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

  useEffect(() => {
    // 当 initialPosition 属性变化时更新内部位置状态
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
      document.removeEventListener("mousemove", handleResizeMoveEvent);
      document.removeEventListener("mouseup", handleResizeEndEvent);
    };
  }, []);

  useEffect(() => {
    // 如果当前正在拖拽且删除区域引用存在
    if (isDragging && deleteZoneRef?.current && taskRef.current) {
      // 获取删除区域和任务的矩形边界
      const deleteRect = deleteZoneRef.current.getBoundingClientRect();
      const taskRect = taskRef.current.getBoundingClientRect();

      // 检查重叠状态
      const isOverlap = checkOverlap(taskRect, deleteRect);
      setIsOverlapping(isOverlap);
    } else {
      setIsOverlapping(false);
    }
  }, [isDragging, deleteZoneRef, position]);

  return (
    <div
      ref={(node) => {
        // 同时设置 drag ref 和 我们自己的 ref
        drag(node as HTMLDivElement);
        if (node) taskRef.current = node;
      }}
      style={{
        position: "absolute",
        left: position.x + (dragOffset?.x || 0),
        top: position.y + (dragOffset?.y || 0),
        width: size.width,
        height: size.height,
        backgroundColor: "#E6F5FF",
        border: "2px dashed #6ECD4B",
        borderRadius: "4px",
        padding: "8px",
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.7 : 1,
        userSelect: "none",
        boxSizing: "border-box",
      }}
    >
      <div style={{ position: "relative", height: "100%" }}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleKeyDown}
            style={{
              background: "transparent",
              border: "1px solid #ddd",
              padding: "2px",
              fontSize: "12px",
              width: "80%",
            }}
          />
        ) : (
          <div
            onDoubleClick={handleDoubleClick}
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              marginBottom: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </div>
        )}

        {/* 调整大小的手柄 */}
        <div
          style={{
            position: "absolute",
            bottom: -8,
            right: -8,
            width: 16,
            height: 16,
            cursor: "nwse-resize",
            background: "transparent",
            zIndex: 10, // 增加z-index确保在最上层
            touchAction: "none", // 禁用默认触摸行为
          }}
          onMouseDown={(e) => {
            e.stopPropagation(); // 确保事件不会传播
            handleResizeStart(e);
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: 6,
              right: 6,
              width: 8, // 增大手柄点的尺寸
              height: 8, // 增大手柄点的尺寸
              backgroundColor: "#6ECD4B",
              borderRadius: "50%",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Task;
