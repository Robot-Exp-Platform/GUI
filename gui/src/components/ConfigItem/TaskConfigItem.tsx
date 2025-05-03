import React, { FC } from "react";
import { Label, Icon, Popup } from "semantic-ui-react";

// 配置项组件接口
interface TaskConfigItemProps {
  id: number;
  type: "robot" | "sensor";
  name: string;
  onDelete: (id: number) => void;
}

// 可配置项组件
const TaskConfigItem: FC<TaskConfigItemProps> = ({
  id,
  type,
  name,
  onDelete,
}) => {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // 防止默认右键菜单显示
  };

  return (
    <Popup
      trigger={
        <Label
          color={type === "robot" ? "blue" : "green"}
          style={{ cursor: "context-menu" }}
          onContextMenu={handleContextMenu}
        >
          <Icon name={type === "robot" ? "android" : "wifi"} />
          {name}
          <Icon
            name="delete"
            style={{ marginLeft: "5px", cursor: "pointer" }}
            onClick={() => onDelete(id)}
          />
        </Label>
      }
      content={`ID: ${id}`}
      on="click"
      position="bottom center"
    />
  );
};

export default TaskConfigItem;
