import { FC } from "react";
import { Label, Icon } from "semantic-ui-react";
import { useDrag } from "react-dnd";
import { convRef } from "~/utils";
import { RobotType } from "~/types/Robot";
import { SensorType } from "~/types/Sensor";

// 创建可拖拽的项组件接口
interface TaskDraggableItemProps {
  type: "robot" | "sensor";
  name: string;
  specificType?: RobotType | SensorType;
}

// 可拖拽项组件
const TaskDraggableItem: FC<TaskDraggableItemProps> = ({
  type,
  name,
  specificType,
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: type.toUpperCase(),
    item: { type, name, specificType },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // 获取图标
  const getIcon = () => {
    if (type === "robot") {
      return specificType === "panda" ? "hand rock" : "android";
    }
    return specificType === "sensor_a" ? "wifi" : "rss";
  };

  return (
    <div
      ref={convRef(drag)}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "move",
        margin: "5px 0",
      }}
    >
      <Label
        color={type === "robot" ? "blue" : "green"}
        size="medium"
        style={{ width: "100%", textAlign: "center" }}
      >
        <Icon name={getIcon()} style={{ marginRight: "5px" }} />
        {name}
      </Label>
    </div>
  );
};

export default TaskDraggableItem;
