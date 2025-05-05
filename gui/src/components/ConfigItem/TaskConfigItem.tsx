import React, { FC, useState, useEffect } from "react";
import { Label, Icon, Popup } from "semantic-ui-react";
import { Robot, Sensor } from "~/types";
import { useProject } from "~/components/contexts/ProjectContext";
import RobotEditor from "./RobotEditor";
import SensorEditor from "./SensorEditor";

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
  const { project, updateProject } = useProject();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  // 添加状态来管理实际显示的名称
  const [displayName, setDisplayName] = useState<string>(name);

  // 当传入名称变化时更新显示名称
  useEffect(() => {
    setDisplayName(name);
  }, [name]);

  // 获取当前机器人或传感器对象
  const getRobotById = (id: number) =>
    project?.config.robots.find((robot) => robot.id === id);

  const getSensorById = (id: number) =>
    project?.config.sensors.find((sensor) => sensor.id === id);

  // 处理右键菜单，打开编辑器
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // 防止默认右键菜单显示
    setPopupOpen(false); // 关闭弹出信息窗口
    setIsEditorOpen(true); // 打开编辑器
  };

  // 更新机器人配置
  const handleSaveRobot = async (updatedRobot: Robot) => {
    try {
      // 查找现有机器人的索引
      const robotIndex = project?.config.robots.findIndex(
        (r) => r.id === updatedRobot.id
      );

      if (robotIndex !== undefined && robotIndex >= 0 && project) {
        // 直接更新数组中的对象
        project.config.robots[robotIndex] = updatedRobot;
        // 保存项目并更新UI
        await project.save();
        updateProject();
        // 更新显示名称
        setDisplayName(updatedRobot.name);
        return true;
      }
      console.error("找不到要更新的机器人:", updatedRobot.id);
      return false;
    } catch (error) {
      console.error("保存机器人配置失败:", error);
      return false;
    }
  };

  // 更新传感器配置
  const handleSaveSensor = async (updatedSensor: Sensor) => {
    try {
      // 查找现有传感器的索引
      const sensorIndex = project?.config.sensors.findIndex(
        (s) => s.id === updatedSensor.id
      );

      if (sensorIndex !== undefined && sensorIndex >= 0 && project) {
        // 直接更新数组中的对象
        project.config.sensors[sensorIndex] = updatedSensor;
        // 保存项目并更新UI
        await project.save();
        updateProject();
        // 更新显示名称
        setDisplayName(updatedSensor.name);
        console.log("传感器更新成功:", updatedSensor);
        return true;
      }
      console.error("找不到要更新的传感器:", updatedSensor.id);
      return false;
    } catch (error) {
      console.error("保存传感器配置失败:", error);
      return false;
    }
  };

  // 检查是否有重名
  const checkDuplicateRobotName = (name: string, currentId: number) =>
    project?.config.robots.some(
      (robot) => robot.name === name && robot.id !== currentId
    ) || false;

  const checkDuplicateSensorName = (name: string, currentId: number) =>
    project?.config.sensors.some(
      (sensor) => sensor.name === name && sensor.id !== currentId
    ) || false;

  // 确定图标
  const getIcon = () => {
    if (type === "robot") {
      return robotType === "panda" ? "hand rock" : "android";
    }
    return sensorType === "sensor_a" ? "wifi" : "rss";
  };

  // 弹出信息内容
  const getPopupContent = () => {
    const basicInfo = `ID: ${id}`;

    if (type === "robot") {
      return `${basicInfo}\n类型: ${robotType || "未知"}`;
    }
    return `${basicInfo}\n类型: ${sensorType || "未知"}`;
  };

  return (
    <>
      <Popup
        trigger={
          <Label
            color={type === "robot" ? "blue" : "green"}
            style={{ cursor: "context-menu" }}
            onContextMenu={handleContextMenu}
            onClick={() => setPopupOpen(true)}
          >
            <Icon name={getIcon()} />
            {displayName}
            <Icon
              name="delete"
              style={{ marginLeft: "5px", cursor: "pointer" }}
              onClick={(e: React.MouseEvent<HTMLElement>) => {
                e.stopPropagation(); // 阻止冒泡，避免触发标签的点击事件
                onDelete(id);
              }}
            />
          </Label>
        }
        content={getPopupContent()}
        on="click"
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        onOpen={() => setPopupOpen(true)}
        position="bottom center"
      />

      {type === "robot" && (
        <RobotEditor
          robot={getRobotById(id) as Robot}
          open={isEditorOpen && type === "robot"}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveRobot}
          checkDuplicateName={checkDuplicateRobotName}
        />
      )}

      {type === "sensor" && (
        <SensorEditor
          sensor={getSensorById(id) as Sensor}
          open={isEditorOpen && type === "sensor"}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveSensor}
          checkDuplicateName={checkDuplicateSensorName}
        />
      )}
    </>
  );
};

export default TaskConfigItem;
