import { FC, useState, useCallback } from "react";
import "./styles.css";
import TaskConfigSection from "~/components/ConfigSection/TaskConfigSection";
import { useProject } from "~/components/contexts/ProjectContext";
import { createRobot, createSensor, CounterType } from "~/types";

const ConfigArea: FC = () => {
  const { project, updateProject } = useProject();

  // 添加一个加载状态，防止多次拖拽导致的并发问题
  const [isAdding, setIsAdding] = useState(false);

  // 添加机器人或传感器 - 处理从侧边栏拖放的项目
  const handleAddItem = useCallback(
    async (type: "robot" | "sensor", name: string) => {
      if (!project || isAdding) {return;}

      try {
        setIsAdding(true); // 开始添加，阻止重复操作

        const nextId = project.config.idCounters.nextId;

        if (type === "robot") {
          // 根据名称确定机器人类型
          if (name === "panda" || name === "ur") {
            // 获取类型计数器，但我们实际上不需要在这里使用它
            project.getNextTypeCounter(name as CounterType);
            const robot = createRobot(nextId, name);
            // 直接修改project.config
            project.config.robots.push(robot);
            project.config.idCounters.nextId++;
          } else {
            console.log("不支持的机器人类型:", name);
          }
        } else if (type === "sensor") {
          // 根据名称确定传感器类型
          if (name === "sensor_a" || name === "sensor_b") {
            // 获取类型计数器，但我们实际上不需要在这里使用它
            project.getNextTypeCounter(name as CounterType);
            const sensor = createSensor(nextId, name);
            // 直接修改project.config
            project.config.sensors.push(sensor);
            project.config.idCounters.nextId++;
          } else {
            console.log("不支持的传感器类型:", name);
          }
        }

        // 更新project状态并自动保存
        updateProject();
      } catch (error) {
        console.error("添加项目失败:", error);
      } finally {
        setIsAdding(false); // 完成添加，允许下一次操作
      }
    },
    [project, isAdding, updateProject],
  );

  // 删除机器人或传感器
  const handleDeleteItem = useCallback(
    async (id: number, type: "robot" | "sensor") => {
      if (!project) {return;}

      try {
        if (type === "robot") {
          // 直接修改project.config
          project.config.robots = project.config.robots.filter(
            (robot) => robot.id !== id,
          );
        } else if (type === "sensor") {
          // 直接修改project.config
          project.config.sensors = project.config.sensors.filter(
            (sensor) => sensor.id !== id,
          );
        }
        // 更新project状态并自动保存
        updateProject();
      } catch (error) {
        console.error("删除项目失败:", error);
      }
    },
    [project, updateProject],
  );

  return (
    <div className="config-area">
      <div className="config-area-header">
        <h3>配置区（拖入机器人和传感器）</h3>
      </div>
      <div className="config-content-container">
        <TaskConfigSection
          title="Robots"
          type="robot"
          items={project?.config.robots || []}
          onItemAdd={handleAddItem}
          onItemDelete={(id) => handleDeleteItem(id, "robot")}
        />
        <TaskConfigSection
          title="Sensors"
          type="sensor"
          items={project?.config.sensors || []}
          onItemAdd={handleAddItem}
          onItemDelete={(id) => handleDeleteItem(id, "sensor")}
        />
      </div>
    </div>
  );
};

export default ConfigArea;
