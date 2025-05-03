import React, { FC } from "react";
import { Label, Icon, Popup } from "semantic-ui-react";
import { Robot, Sensor } from "~/types";

// 配置项组件接口
interface TaskConfigItemProps {
  id: number;
  type: "robot" | "sensor";
  name: string;
  onDelete: (id: number) => void;
  robotType?: string;
  sensorType?: string;
}

// 可配置项组件
const TaskConfigItem: FC<TaskConfigItemProps> = ({
  id,
  type,
  name,
  onDelete,
  robotType,
  sensorType,
}) => {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // 防止默认右键菜单显示
  };

  // 确定图标
  const getIcon = () => {
    if (type === "robot") {
      return robotType === "panda" ? "hand rock" : "android";
    } else {
      return sensorType === "sensor_a" ? "wifi" : "rss";
    }
  };

  // 弹出信息内容
  const getPopupContent = () => {
    const basicInfo = `ID: ${id}`;

    if (type === "robot") {
      return `${basicInfo}\n类型: ${robotType || "未知"}`;
    } else {
      return `${basicInfo}\n类型: ${sensorType || "未知"}`;
    }
  };

  return (
    <Popup
      trigger={
        <Label
          color={type === "robot" ? "blue" : "green"}
          style={{ cursor: "context-menu" }}
          onContextMenu={handleContextMenu}
        >
          <Icon name={getIcon()} />
          {name}
          <Icon
            name="delete"
            style={{ marginLeft: "5px", cursor: "pointer" }}
            onClick={() => onDelete(id)}
          />
        </Label>
      }
      content={getPopupContent()}
      on="click"
      position="bottom center"
    />
  );
};

export default TaskConfigItem;
