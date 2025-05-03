import React, { FC, useState } from "react";
import "./styles.css";
import { ConfigContext } from "~/components/contexts/ConfigContext";
import TaskConfigSection from "~/components/ConfigSection/TaskConfigSection";

const ConfigArea: FC = () => {
  // ID 管理
  const [nextId, setNextId] = useState(1);
  const incrementId = () => {
    const currentId = nextId;
    setNextId((prev) => prev + 1);
    return currentId;
  };

  // 机器人和传感器状态
  const [robots, setRobots] = useState<Array<{ id: number; name: string }>>([]);
  const [sensors, setSensors] = useState<Array<{ id: number; name: string }>>(
    []
  );

  // 添加机器人或传感器
  const handleAddItem = (type: "robot" | "sensor", name: string) => {
    const id = incrementId();
    if (type === "robot") {
      setRobots((prev) => [...prev, { id, name }]);
    } else {
      setSensors((prev) => [...prev, { id, name }]);
    }
  };

  // 删除机器人或传感器
  const handleDeleteItem = (id: number) => {
    setRobots((prev) => prev.filter((item) => item.id !== id));
    setSensors((prev) => prev.filter((item) => item.id !== id));
  };

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
            onItemDelete={handleDeleteItem}
          />
          <TaskConfigSection
            title="Sensors"
            type="sensor"
            items={sensors}
            onItemAdd={handleAddItem}
            onItemDelete={handleDeleteItem}
          />
        </div>
      </div>
    </ConfigContext.Provider>
  );
};

export default ConfigArea;
