import React, { FC, useState, useEffect, useCallback } from "react";
import "./styles.css";
import { ConfigContext } from "~/components/contexts/ConfigContext";
import TaskConfigSection from "~/components/ConfigSection/TaskConfigSection";
import { useProject } from "~/components/contexts/ProjectContext";
import {
  Robot,
  Sensor,
  createPandaRobot,
  createURRobot,
  createSensorA,
  createSensorB,
} from "~/types";

const ConfigArea: FC = () => {
  const {
    project,
    addRobot,
    removeRobot,
    addSensor,
    removeSensor,
    getNextId,
    getNextTypeCounter,
    updateProject,
  } = useProject();

  // 初始状态
  const [robots, setRobots] = useState<Robot[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [nextId, setNextId] = useState(1);
  // 添加一个加载状态，防止多次拖拽导致的并发问题
  const [isAdding, setIsAdding] = useState(false);

  // 从项目中加载数据
  useEffect(() => {
    if (project) {
      setRobots(project.config.robots || []);
      setSensors(project.config.sensors || []);
      setNextId(project.config.idCounters.nextId);
    }
  }, [project]);

  // 用于ConfigContext的incrementId函数
  const incrementId = useCallback(() => {
    if (!project) return -1;
    return getNextId(); // 使用项目管理器中的getNextId方法
  }, [project, getNextId]);

  // 添加机器人或传感器 - 处理从侧边栏拖放的项目
  const handleAddItem = useCallback(
    async (type: "robot" | "sensor", name: string) => {
      if (!project || isAdding) return;

      try {
        setIsAdding(true); // 开始添加，阻止重复操作

        const id = getNextId();

        if (type === "robot") {
          // 根据名称确定机器人类型
          let robot: Robot;
          if (name.toLowerCase().includes("panda")) {
            const pandaCounter = getNextTypeCounter("panda");
            robot = createPandaRobot(id);
            robot.name = `panda_${pandaCounter}`;
          } else if (name.toLowerCase().includes("ur")) {
            const urCounter = getNextTypeCounter("ur");
            robot = createURRobot(id);
            robot.name = `ur_${urCounter}`;
          } else {
            // 默认为panda
            const pandaCounter = getNextTypeCounter("panda");
            robot = createPandaRobot(id);
            robot.name = `panda_${pandaCounter}`;
          }

          // 只调用 addRobot，不再直接更新本地状态
          // 依靠 useEffect 钩子在 project 更新后自动更新本地状态
          await addRobot(robot);
        } else {
          // 根据名称确定传感器类型
          let sensor: Sensor;
          if (name.toLowerCase().includes("a")) {
            const sensorCounter = getNextTypeCounter("sensor_a");
            sensor = createSensorA(id);
            sensor.name = `sensor_a_${sensorCounter}`;
          } else {
            const sensorCounter = getNextTypeCounter("sensor_b");
            sensor = createSensorB(id);
            sensor.name = `sensor_b_${sensorCounter}`;
          }

          // 只调用 addSensor，不再直接更新本地状态
          await addSensor(sensor);
        }

        // 更新 project 状态，触发 useEffect 钩子重新获取数据
        updateProject();

        // 更新nextId显示
        setNextId((prev) => prev + 1);
      } catch (error) {
        console.error("添加项目失败:", error);
      } finally {
        setIsAdding(false); // 完成添加，允许下一次操作
      }
    },
    [
      project,
      getNextId,
      getNextTypeCounter,
      addRobot,
      addSensor,
      isAdding,
      updateProject,
    ]
  );

  // 删除机器人或传感器
  const handleDeleteItem = useCallback(
    async (id: number, type: "robot" | "sensor") => {
      if (!project) return;

      try {
        if (type === "robot") {
          await removeRobot(id);
          setRobots((prev) => prev.filter((robot) => robot.id !== id));
        } else {
          await removeSensor(id);
          setSensors((prev) => prev.filter((sensor) => sensor.id !== id));
        }
      } catch (error) {
        console.error("删除项目失败:", error);
      }
    },
    [project, removeRobot, removeSensor]
  );

  return (
    <ConfigContext.Provider value={{ nextId, incrementId }}>
      <div className="config-area">
        <div className="config-area-header">
          <h3>配置区（拖入机器人和传感器）</h3>
        </div>
        <div className="config-content-container">
          <TaskConfigSection
            title="Robots"
            type="robot"
            items={robots}
            onItemAdd={handleAddItem}
            onItemDelete={(id) => handleDeleteItem(id, "robot")}
          />
          <TaskConfigSection
            title="Sensors"
            type="sensor"
            items={sensors}
            onItemAdd={handleAddItem}
            onItemDelete={(id) => handleDeleteItem(id, "sensor")}
          />
        </div>
      </div>
    </ConfigContext.Provider>
  );
};

export default ConfigArea;
