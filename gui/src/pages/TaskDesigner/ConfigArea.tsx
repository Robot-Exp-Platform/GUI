import React, { FC, useState, useEffect, useRef, useCallback } from "react";
import "./styles.css";
import { ConfigContext } from "~/components/contexts/ConfigContext";
import TaskConfigSection from "~/components/ConfigSection/TaskConfigSection";
import { useProject } from "~/components/contexts/ProjectContext";

const ConfigArea: FC = () => {
  const { projectInfo, updateProjectConfig } = useProject();

  // 使用ref来存储nextId，避免闭包问题
  const nextIdRef = useRef(1);

  // 状态中也保留一个nextId用于重新渲染
  const [nextId, setNextId] = useState(1);

  // 初始化ID
  useEffect(() => {
    if (projectInfo?.config?.nextId) {
      nextIdRef.current = projectInfo.config.nextId;
      setNextId(projectInfo.config.nextId);
    }
  }, [projectInfo?.config?.nextId]);

  const incrementId = useCallback(() => {
    const currentId = nextIdRef.current;
    nextIdRef.current += 1;

    // 更新状态和配置
    setNextId(nextIdRef.current);
    if (projectInfo) {
      updateProjectConfig({ nextId: nextIdRef.current });
    }

    console.log(
      `Generating ID: ${currentId}, Next ID will be: ${nextIdRef.current}`
    );
    return currentId;
  }, [projectInfo, updateProjectConfig]);

  // 机器人和传感器状态
  const [robots, setRobots] = useState<Array<{ id: number; name: string }>>([]);
  const [sensors, setSensors] = useState<Array<{ id: number; name: string }>>(
    []
  );

  // 从项目配置中加载数据
  useEffect(() => {
    if (projectInfo?.config) {
      if (
        projectInfo.config.robots &&
        Array.isArray(projectInfo.config.robots)
      ) {
        setRobots(projectInfo.config.robots);

        // 确保nextId大于所有已有ID
        if (projectInfo.config.robots.length > 0) {
          const maxRobotId = Math.max(
            ...projectInfo.config.robots.map((r) => r.id)
          );
          if (maxRobotId >= nextIdRef.current) {
            nextIdRef.current = maxRobotId + 1;
            setNextId(nextIdRef.current);
            updateProjectConfig({ nextId: nextIdRef.current });
          }
        }
      }

      if (
        projectInfo.config.sensors &&
        Array.isArray(projectInfo.config.sensors)
      ) {
        setSensors(projectInfo.config.sensors);

        // 确保nextId大于所有已有ID
        if (projectInfo.config.sensors.length > 0) {
          const maxSensorId = Math.max(
            ...projectInfo.config.sensors.map((s) => s.id)
          );
          if (maxSensorId >= nextIdRef.current) {
            nextIdRef.current = maxSensorId + 1;
            setNextId(nextIdRef.current);
            updateProjectConfig({ nextId: nextIdRef.current });
          }
        }
      }
    }
  }, [projectInfo?.config, updateProjectConfig]);

  // 添加机器人或传感器 - 使用useCallback确保函数引用稳定
  const handleAddItem = useCallback(
    (type: "robot" | "sensor", name: string) => {
      const id = incrementId();
      console.log(`Adding ${type} with id: ${id}, name: ${name}`);

      if (type === "robot") {
        setRobots((prev) => {
          const newRobots = [...prev, { id, name }];
          // 更新配置
          updateProjectConfig({ robots: newRobots });
          return newRobots;
        });
      } else {
        setSensors((prev) => {
          const newSensors = [...prev, { id, name }];
          // 更新配置
          updateProjectConfig({ sensors: newSensors });
          return newSensors;
        });
      }
    },
    [incrementId, updateProjectConfig]
  );

  // 删除机器人或传感器 - 使用useCallback确保函数引用稳定
  const handleDeleteItem = useCallback(
    (id: number, type: "robot" | "sensor") => {
      console.log(`Deleting ${type} with id: ${id}`);

      if (type === "robot") {
        setRobots((prev) => {
          const newRobots = prev.filter((robot) => robot.id !== id);
          updateProjectConfig({ robots: newRobots });
          return newRobots;
        });
      } else {
        setSensors((prev) => {
          const newSensors = prev.filter((sensor) => sensor.id !== id);
          updateProjectConfig({ sensors: newSensors });
          return newSensors;
        });
      }
    },
    [updateProjectConfig]
  );

  // 调试用：显示当前状态
  useEffect(() => {
    console.log("Current robots:", robots);
    console.log("Current sensors:", sensors);
  }, [robots, sensors]);

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
