import React, { FC, useCallback } from "react";
import { useDrop } from "react-dnd";
import { conv_ref } from "~/utils";
import TaskConfigItem from "~/components/ConfigItem/TaskConfigItem";

// 配置区块组件接口
interface TaskConfigSectionProps {
  title: string;
  type: "robot" | "sensor";
  items: Array<{ id: number; name: string }>;
  onItemAdd: (type: "robot" | "sensor", name: string) => void;
  onItemDelete: (id: number) => void;
}

// 配置区块组件
const TaskConfigSection: FC<TaskConfigSectionProps> = ({
  title,
  type,
  items,
  onItemAdd,
  onItemDelete,
}) => {
  // 使用useCallback来确保drop处理函数的稳定性
  const handleDrop = useCallback(
    (item: { type: "robot" | "sensor"; name: string }) => {
      console.log(`Dropped item of type ${item.type} with name ${item.name}`);
      onItemAdd(item.type, item.name);
      return { dropped: true };
    },
    [onItemAdd]
  );

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: type.toUpperCase(),
    drop: handleDrop,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  return (
    <div
      ref={conv_ref(drop)}
      className={`config-section ${
        isOver && canDrop ? "config-section-active" : ""
      }`}
    >
      <div className="config-section-header">{title}</div>
      <div className="config-section-content">
        {items.length === 0 ? (
          <div className="config-section-placeholder">
            拖入{type === "robot" ? "机器人" : "传感器"}...
          </div>
        ) : (
          items.map((item) => (
            <TaskConfigItem
              key={item.id}
              id={item.id}
              type={type}
              name={item.name}
              onDelete={onItemDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TaskConfigSection;
