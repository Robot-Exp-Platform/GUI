import React, { FC, createContext, useState, useRef } from "react";
import { Icon } from "semantic-ui-react";
import { useDrop } from "react-dnd";
import "./styles.css";
import { conv_ref } from "~/utils";

// 创建一个上下文来共享删除区域的引用和状态
export const DeleteZoneContext = createContext<{
  ref: React.RefObject<HTMLDivElement> | null;
  isHovering: boolean;
  setIsHovering: (isHovering: boolean) => void;
}>({
  ref: null,
  isHovering: false,
  setIsHovering: () => {},
});

const TaskSidebar: FC = () => {
  // 用于跟踪鼠标是否与删除区域有足够重叠
  const [isHovering, setIsHovering] = useState(false);
  // 删除区域的引用
  const deleteZoneRef = useRef<HTMLDivElement>(null);

  // 使用 react-dnd 的 useDrop 钩子监听拖拽
  const [{ isOver }, drop] = useDrop({
    accept: "TASK",
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
    hover: (item: any, monitor) => {
      if (!deleteZoneRef.current) return;

      // 获取删除区域的边界信息
      const deleteZoneRect = deleteZoneRef.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();

      if (clientOffset) {
        // 计算鼠标中心点与删除区域中心的距离
        const deleteZoneCenterX =
          (deleteZoneRect.left + deleteZoneRect.right) / 2;
        const deleteZoneCenterY =
          (deleteZoneRect.top + deleteZoneRect.bottom) / 2;

        // 计算重叠面积
        const overlapX =
          Math.min(clientOffset.x + 15, deleteZoneRect.right) -
          Math.max(clientOffset.x - 15, deleteZoneRect.left);
        const overlapY =
          Math.min(clientOffset.y + 15, deleteZoneRect.bottom) -
          Math.max(clientOffset.y - 15, deleteZoneRect.top);

        // 如果横纵重叠都大于等于15px，则设置悬停状态为true
        setIsHovering(overlapX >= 15 && overlapY >= 15);
      }
    },
    drop: (item: any) => {
      // 如果当前有足够重叠，返回一个删除标记
      if (isHovering) {
        return { deleted: true };
      }
      return undefined;
    },
  });

  return (
    <DeleteZoneContext.Provider
      value={{
        ref: conv_ref(deleteZoneRef),
        isHovering,
        setIsHovering,
      }}
    >
      <div className="task-sidebar">
        {/* 左侧区域内容 */}

        {/* 删除区域 - 放在底部 */}
        <div
          ref={(el) => {
            drop(el);
            deleteZoneRef.current = el;
          }}
          className="task-delete-zone"
          style={{
            marginTop: "auto",
            backgroundColor: isOver && isHovering ? "#ff6b6b" : "#ffdddd", // 当悬停时变亮
            padding: "15px",
            borderRadius: "8px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "default",
            transition: "all 0.2s ease",
          }}
        >
          <Icon
            name="trash"
            size="large"
            style={{
              color: isOver && isHovering ? "#ffffff" : "#ff6b6b",
              transition: "all 0.2s ease",
            }}
          />
          <div
            style={{
              marginLeft: "10px",
              color: isOver && isHovering ? "#ffffff" : "#ff6b6b",
            }}
          >
            拖放此处删除
          </div>
        </div>
      </div>
    </DeleteZoneContext.Provider>
  );
};

export default TaskSidebar;
