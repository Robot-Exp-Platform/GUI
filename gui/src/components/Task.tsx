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
  containerRef?: React.RefObject<HTMLDivElement>; // 添加父容器引用
}

const Task: React.FC<TaskProps> = ({
  id,
  initialName = "任务容器",
  initialPosition = { x: 0, y: 0 },
  initialSize = { width: 120, height: 80 },
  onPositionChange,
  onSizeChange,
  onNameChange,
  containerRef,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const [name, setName] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const initialSize_ = useRef({ width: 0, height: 0 });
  const taskRef = useRef<HTMLDivElement>(null);

  // 确保位置在容器范围内
  const ensureWithinBounds = (newPosition: { x: number; y: number }): { x: number; y: number } => {
    if (!containerRef?.current || !taskRef.current) return newPosition;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const taskRect = taskRef.current.getBoundingClientRect();
    const padding = 8; // 考虑边框和内边距
    
    // 计算容器内可用空间
    const maxX = containerRect.width - taskRect.width - padding;
    const maxY = containerRect.height - taskRect.height - padding;
    
    // 限制位置在容器内
    return {
      x: Math.max(0, Math.min(newPosition.x, maxX)),
      y: Math.max(0, Math.min(newPosition.y, maxY)),
    };
  };

  // 拖拽功能
  const [{ isDragging }, drag] = useDrag({
    type: "TASK",
    item: () => ({
      id,
      position,
    }),
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      const delta = monitor.getDifferenceFromInitialOffset();

      if (delta) {
        // 计算新位置
        const uncheckedPosition = {
          x: position.x + delta.x,
          y: position.y + delta.y,
        };
        
        // 确保位置在容器范围内
        const boundedPosition = ensureWithinBounds(uncheckedPosition);
        
        setPosition(boundedPosition);
        onPositionChange?.(id, boundedPosition);
      }
    },
  });

  // 处理调整大小
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartPos.current = { x: e.clientX, y: e.clientY };
    initialSize_.current = { ...size };

    // 添加全局事件监听
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaWidth = e.clientX - resizeStartPos.current.x;
    const deltaHeight = e.clientY - resizeStartPos.current.y;

    const newWidth = Math.max(60, initialSize_.current.width + deltaWidth);
    const newHeight = Math.max(40, initialSize_.current.height + deltaHeight);

    // 确保调整大小不会超出容器边界
    if (containerRef?.current && taskRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const taskRect = taskRef.current.getBoundingClientRect();
      
      const maxWidth = containerRect.width - position.x - 16; // 16px for padding and border
      const maxHeight = containerRect.height - position.y - 16;
      
      const constrainedWidth = Math.min(newWidth, maxWidth);
      const constrainedHeight = Math.min(newHeight, maxHeight);
      
      setSize({ width: constrainedWidth, height: constrainedHeight });
    } else {
      setSize({ width: newWidth, height: newHeight });
    }
  };

  const handleResizeEnd = () => {
    if (!isResizing) return;
    setIsResizing(false);

    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);

    onSizeChange?.(id, size);
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

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
    };
  }, []);

  // 当组件挂载或更新时检查位置是否在边界内
  useEffect(() => {
    const boundedPosition = ensureWithinBounds(position);
    if (boundedPosition.x !== position.x || boundedPosition.y !== position.y) {
      setPosition(boundedPosition);
      onPositionChange?.(id, boundedPosition);
    }
  }, [containerRef]);

  return (
    <div
      ref={(node) => {
        // 同时设置 drag ref 和 我们自己的 ref
        drag(node as HTMLDivElement);
        if (node) taskRef.current = node;
      }}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
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
          }}
          onMouseDown={handleResizeStart}
        >
          <div
            style={{
              position: "absolute",
              bottom: 6,
              right: 6,
              width: 6,
              height: 6,
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
