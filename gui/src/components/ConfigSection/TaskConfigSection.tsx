import { FC, useCallback, useEffect } from "react";
import { useDrop } from "react-dnd";
import { convRef } from "~/utils";
import TaskConfigItem from "~/components/ConfigItem/TaskConfigItem";
import { Robot, Sensor } from "~/types";

// 配置区块组件接口
interface TaskConfigSectionProps {
  title: string;
  type: "robot" | "sensor";
  items: Array<Robot | Sensor>;
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
  // 简化后的处理拖放逻辑
  const handleDrop = useCallback(
    (item: {
      type: "robot" | "sensor";
      name: string;
      specificType: string;
    }) => {
      console.log(`Dropped item of type ${item.type} with name ${item.name}`);
      onItemAdd(item.type, item.specificType);
      return { dropped: true };
    },
    [onItemAdd],
  );

  // 使用键值对象强化接受类型，确保正确识别
  const dropTypes = {
    robot: "ROBOT",
    sensor: "SENSOR",
  } as const;

  // 确保我们接受的拖拽类型保持稳定
  const acceptType = dropTypes[type];

  // 使用useDrop钩子，确保所有依赖项都被正确声明
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: acceptType, // 使用映射对象中的常量
      drop: handleDrop,
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [acceptType, handleDrop],
  );

  // 调试用
  useEffect(() => {
    console.log(`TaskConfigSection(${title}) rendered, items:`, items.length);
  }, [title, items.length]);

  return (
    <div
      ref={convRef(drop)}
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
              robotType={
                type === "robot" ? (item as Robot).robotType : undefined
              }
              sensorType={
                type === "sensor" ? (item as Sensor).sensorType : undefined
              }
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TaskConfigSection;
