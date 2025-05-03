import React, { FC } from "react";
import { Label } from "semantic-ui-react";
import { useDrag } from "react-dnd";
import { conv_ref } from "~/utils";

// 创建可拖拽的项组件接口
interface TaskDraggableItemProps {
  type: "robot" | "sensor";
  name: string;
}

// 可拖拽项组件
const TaskDraggableItem: FC<TaskDraggableItemProps> = ({ type, name }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: type.toUpperCase(),
    item: { type, name },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={conv_ref(drag)}
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
        {name}
      </Label>
    </div>
  );
};

export default TaskDraggableItem;
