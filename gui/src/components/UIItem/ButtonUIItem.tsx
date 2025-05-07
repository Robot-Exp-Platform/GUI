import React, { useEffect, useState } from "react";
import { Text, Rect, Group } from "react-konva";
import { UIButtonItem } from "~/types/UI";
import { BaseUIItem } from "./BaseUIItem";
import { useProject } from "../contexts/ProjectContext";
import { useUIDesigner } from "../contexts/UIDesignerContext";

interface ButtonUIItemProps {
  item: UIButtonItem;
  isRunMode: boolean;
}

export const ButtonUIItem: React.FC<ButtonUIItemProps> = ({
  item,
  isRunMode,
}) => {
  const { project } = useProject();
  const { updateItem, registerProcess, unregisterProcess } = useUIDesigner();
  const [processId, setProcessId] = useState<string | null>(null);
  
  // 按钮颜色状态
  const defaultColor = "#2185d0"; // 蓝色
  const runningColor = "#21ba45"; // 绿色
  const buttonColor = item.isRunning ? runningColor : (item.fill || defaultColor);

  useEffect(() => {
    // 如果组件卸载且程序正在运行，则停止程序
    return () => {
      if (processId) {
        stopRobotPlatform();
      }
    };
  }, []);

  // 监听运行模式变化，如果退出运行模式，确保按钮状态复位
  // 注意：实际停止进程的逻辑由 UIDesignerContext 的 setRunMode 方法处理
  useEffect(() => {
    if (!isRunMode && item.isRunning) {
      // 只重置状态，实际进程已经由 Context 中的方法停止
      updateItem(item.id, { 
        isRunning: false,
        fill: defaultColor
      });
      setProcessId(null);
    }
  }, [isRunMode]);

  // 停止运行机器人平台程序
  const stopRobotPlatform = async () => {
    if (!processId) return;
    
    try {
      await window.electronAPI.stopRobotPlatform(processId);
      
      // 从注册表中注销进程
      unregisterProcess(processId);
      
      // 更新按钮状态
      setProcessId(null);
      updateItem(item.id, { 
        isRunning: false,
        fill: defaultColor
      });
    } catch (error) {
      console.error("停止程序失败:", error);
    }
  };

  // 处理按钮点击
  const handleButtonClick = async () => {
    // 只在运行模式下响应点击
    if (!isRunMode) return;

    try {
      // 获取项目路径
      if (!project || !project.projectPath) {
        console.error("无法获取项目路径");
        return;
      }

      // 如果程序已在运行，则停止它
      if (item.isRunning && processId) {
        await stopRobotPlatform();
        return;
      }

      // 使用主进程的 runRobotPlatform 方法运行机器人平台程序
      const result = await window.electronAPI.runRobotPlatform({
        projectPath: project.projectPath,
        taskJsonPath: item.taskJsonPath, // 如果为空，主进程会使用默认路径
        port: item.port || 6651, // 使用指定的端口或默认端口
      });

      if (result.success && result.processId) {
        // 保存进程 ID 并更新按钮状态为运行中
        const newProcessId = result.processId;
        setProcessId(newProcessId);
        
        // 在进程管理器中注册此进程
        registerProcess(newProcessId, item.id);
        
        // 更新按钮状态
        updateItem(item.id, { 
          isRunning: true,
          fill: runningColor
        });
      } else {
        console.error("运行程序失败:", result.error);
      }
    } catch (error) {
      console.error("按钮点击处理出错:", error);
    }
  };

  return (
    <BaseUIItem item={item} isRunMode={isRunMode}>
      <Group
        width={item.width}
        height={item.height}
        onClick={handleButtonClick}
        onTap={handleButtonClick}
        cursor={isRunMode ? "pointer" : "default"}
      >
        {/* 按钮背景 */}
        <Rect
          width={item.width}
          height={item.height}
          fill={buttonColor}
          cornerRadius={5}
        />

        {/* 按钮文字 */}
        <Text
          text={item.text || "按钮"}
          fontSize={16}
          fontFamily="Arial"
          fill="#ffffff"
          width={item.width}
          height={item.height}
          align="center"
          verticalAlign="middle"
        />
      </Group>
    </BaseUIItem>
  );
};
