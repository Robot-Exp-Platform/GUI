import { FC, useState, useCallback, useEffect } from "react";
import { Button, Message } from "semantic-ui-react";
import "./styles.css";
import TaskConfigSection from "~/components/ConfigSection/TaskConfigSection";
import { useProject } from "~/components/contexts/ProjectContext";
import { createRobot, createSensor, CounterType, Robot, Sensor } from "~/types";

const ConfigArea: FC = () => {
  const { project, updateProject } = useProject();

  // 添加一个加载状态，防止多次拖拽导致的并发问题
  const [isAdding, setIsAdding] = useState(false);
  // 添加导出状态
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{
    type: "success" | "error";
    content: string;
  } | null>(null);

  // 成功提示自动消失计时器
  useEffect(() => {
    let timer: number | undefined;

    if (exportMessage?.type === "success") {
      timer = setTimeout(() => {
        setExportMessage(null);
      }, 5000); // 5秒后自动消失
    }

    // 清理函数 - 组件卸载或依赖变化时执行
    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [exportMessage]);

  // 添加机器人或传感器 - 处理从侧边栏拖放的项目
  const handleAddItem = useCallback(
    async (type: "robot" | "sensor", name: string) => {
      if (!project || isAdding) {
        return;
      }

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
    [project, isAdding, updateProject]
  );

  // 删除机器人或传感器
  const handleDeleteItem = useCallback(
    async (id: number, type: "robot" | "sensor") => {
      if (!project) {
        return;
      }

      try {
        if (type === "robot") {
          // 直接修改project.config
          project.config.robots = project.config.robots.filter(
            (robot) => robot.id !== id
          );
        } else if (type === "sensor") {
          // 直接修改project.config
          project.config.sensors = project.config.sensors.filter(
            (sensor) => sensor.id !== id
          );
        }
        // 更新project状态并自动保存
        updateProject();
      } catch (error) {
        console.error("删除项目失败:", error);
      }
    },
    [project, updateProject]
  );

  // 导出配置文件
  const handleExportConfig = useCallback(async () => {
    if (!project) {
      setExportMessage({
        type: "error",
        content: "没有打开的项目，无法导出配置",
      });
      return;
    }

    try {
      setIsExporting(true);
      setExportMessage(null);

      // 准备导出的配置数据
      const exportConfig = {
        robots: project.config.robots.map((robot: Robot) => ({
          name: robot.name,
          robot_type: robot.robotType,
          base_pose: robot.basePose,
        })),
        sensors: project.config.sensors.map((sensor: Sensor) => ({
          name: sensor.name,
          sensor_type: sensor.sensorType,
          params: sensor.params,
        })),
      };

      // 调用导出API
      const result = await window.electronAPI.exportConfigFile(
        project.projectPath,
        exportConfig
      );

      if (result.success) {
        setExportMessage({
          type: "success",
          content: `配置文件已成功导出到: ${result.filePath}`,
        });
      } else {
        setExportMessage({
          type: "error",
          content: result.error || "导出失败，请重试",
        });
      }
    } catch (error) {
      console.error("导出配置文件失败:", error);
      setExportMessage({
        type: "error",
        content:
          error instanceof Error ? error.message : "导出过程中发生未知错误",
      });
    } finally {
      setIsExporting(false);
    }
  }, [project]);

  return (
    <div className="config-area">
      <div className="config-area-header">
        <h3>配置区（拖入机器人和传感器）</h3>
        <div className="export-container">
          {exportMessage?.type === "success" && (
            <div className="export-success-message">
              <div>配置文件已成功导出</div>
              <div className="export-success-path">
                {exportMessage.content.split(": ")[1]}
              </div>
            </div>
          )}
          <Button
            primary
            className="export-config-button"
            onClick={handleExportConfig}
            loading={isExporting}
            disabled={!project || isExporting}
          >
            导出配置文件
          </Button>
        </div>
      </div>
      {exportMessage?.type === "error" && (
        <Message
          negative
          onDismiss={() => setExportMessage(null)}
          content={exportMessage.content}
        />
      )}
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
