import React, { createContext, useContext, useState, useEffect } from "react";
import {
  UIDesign,
  UIItem,
  UITextItem,
  UIImageItem,
  UIRectangleItem,
  UICircleItem,
  UITriangleItem,
  UICaptureItem,
  UICameraItem,
  UIButtonItem,
} from "~/types/UI";
import { useProject } from "./ProjectContext";
import { v4 as uuidv4 } from "uuid";

// 定义更精确的添加项类型
type AddUIItemParams =
  | Omit<UITextItem, "id" | "zIndex">
  | Omit<UIImageItem, "id" | "zIndex">
  | Omit<UIRectangleItem, "id" | "zIndex">
  | Omit<UICircleItem, "id" | "zIndex">
  | Omit<UITriangleItem, "id" | "zIndex">
  | Omit<UICaptureItem, "id" | "zIndex">
  | Omit<UICameraItem, "id" | "zIndex">
  | Omit<UIButtonItem, "id" | "zIndex">;

// 进程信息接口
interface ProcessInfo {
  processId: string;
  itemId: string;
}

interface UIDesignerContextType {
  currentUI: UIDesign | null;
  currentUIFilePath: string | null;
  selectedItem: UIItem | null;
  isEditing: boolean;
  isRunMode: boolean; // 添加运行模式状态
  setCurrentUI: (ui: UIDesign) => void;
  setCurrentUIFilePath: (path: string) => void;
  addItem: (item: AddUIItemParams) => void;
  updateItem: (id: string, updates: Partial<UIItem>) => void;
  deleteItem: (id: string) => void;
  selectItem: (id: string | null) => void;
  setIsEditing: (isEditing: boolean) => void;
  moveToTop: (id: string) => void;
  saveUIDesign: () => Promise<boolean>;
  setRunMode: (isRunning: boolean) => void; // 添加切换运行模式的函数
  registerProcess: (processId: string, itemId: string) => void; // 注册运行中的进程
  unregisterProcess: (processId: string) => void; // 注销运行中的进程
  stopAllProcesses: () => Promise<void>; // 停止所有运行中的进程
}

const UIDesignerContext = createContext<UIDesignerContextType | undefined>(
  undefined
);

export const UIDesignerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { project } = useProject();
  const [currentUI, setCurrentUI] = useState<UIDesign | null>(null);
  const [currentUIFilePath, setCurrentUIFilePath] = useState<string | null>(
    null
  );
  const [selectedItem, setSelectedItem] = useState<UIItem | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isRunMode, setIsRunMode] = useState<boolean>(false); // 运行模式状态
  const [runningProcesses, setRunningProcesses] = useState<ProcessInfo[]>([]); // 运行中的进程

  // 添加新组件
  const addItem = (item: AddUIItemParams) => {
    if (!currentUI) return;

    const newItem = {
      ...item,
      id: uuidv4(),
      zIndex: currentUI.items.length + 1,
    } as UIItem;

    setCurrentUI({
      ...currentUI,
      items: [...currentUI.items, newItem],
    });
  };

  // 更新组件
  const updateItem = (id: string, updates: Partial<UIItem>) => {
    if (!currentUI) return;

    setCurrentUI({
      ...currentUI,
      items: currentUI.items.map((item) => {
        if (item.id === id) {
          // 首先确保保留原始类型，并创建类型安全的更新对象
          const typeSafeUpdates = {
            ...updates,
            type: item.type, // 保留原始类型值，防止类型被错误覆盖
          };

          // 然后应用更新，但确保类型值与原始值一致
          return {
            ...item,
            ...typeSafeUpdates,
            type: item.type, // 再次强调保留原始类型
          } as UIItem;
        }
        return item;
      }),
    });
  };

  // 删除组件
  const deleteItem = (id: string) => {
    if (!currentUI) return;

    setCurrentUI({
      ...currentUI,
      items: currentUI.items.filter((item) => item.id !== id),
    });

    if (selectedItem?.id === id) {
      setSelectedItem(null);
      setIsEditing(false);
    }
  };

  // 选择组件
  const selectItem = (id: string | null) => {
    if (!currentUI || !id) {
      setSelectedItem(null);
      return;
    }

    const item = currentUI.items.find((item) => item.id === id);
    setSelectedItem(item || null);
  };

  // 将组件移到最顶层
  const moveToTop = (id: string) => {
    if (!currentUI) return;

    const maxZIndex = Math.max(...currentUI.items.map((item) => item.zIndex));

    setCurrentUI({
      ...currentUI,
      items: currentUI.items.map((item) =>
        item.id === id ? { ...item, zIndex: maxZIndex + 1 } : item
      ),
    });
  };

  // 保存UI设计
  const saveUIDesign = async (): Promise<boolean> => {
    if (!project || !currentUI || !currentUIFilePath) return false;

    return await project.saveUIDesign(currentUI, currentUIFilePath);
  };

  // 注册运行中的进程
  const registerProcess = (processId: string, itemId: string) => {
    setRunningProcesses(prev => [...prev, { processId, itemId }]);
  };

  // 注销运行中的进程
  const unregisterProcess = (processId: string) => {
    setRunningProcesses(prev => prev.filter(p => p.processId !== processId));
  };

  // 停止所有运行中的进程
  const stopAllProcesses = async () => {
    // 复制一份当前运行中的所有进程列表
    const processes = [...runningProcesses];
    
    // 并行停止所有进程
    const stopPromises = processes.map(async ({ processId, itemId }) => {
      try {
        await window.electronAPI.stopRobotPlatform(processId);
        
        // 更新对应按钮的状态
        updateItem(itemId, { 
          isRunning: false,
          fill: "#2185d0" // 默认蓝色
        });
      } catch (error) {
        console.error(`停止进程 ${processId} 失败:`, error);
      }
    });
    
    await Promise.all(stopPromises);
    
    // 清空运行中的进程列表
    setRunningProcesses([]);
  };

  // 设置运行模式
  const setRunMode = async (isRunning: boolean) => {
    // 在运行模式下清除选择的元素
    if (isRunning) {
      setSelectedItem(null);
      setIsEditing(false);
    } else {
      // 退出运行模式时，停止所有运行中的进程
      await stopAllProcesses();
    }
    setIsRunMode(isRunning);
  };

  // 在选择的UI项改变时，自动进入编辑模式（仅在非运行模式）
  useEffect(() => {
    if (selectedItem && !isRunMode) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [selectedItem, isRunMode]);

  // 在修改UI时，尝试自动保存
  useEffect(() => {
    if (currentUI && currentUIFilePath) {
      const timer = setTimeout(() => {
        saveUIDesign();
      }, 1000); // 1秒后自动保存

      return () => clearTimeout(timer);
    }
  }, [currentUI]);

  // 当组件卸载时，确保停止所有运行中的进程
  useEffect(() => {
    return () => {
      if (runningProcesses.length > 0) {
        stopAllProcesses();
      }
    };
  }, []);

  const value = {
    currentUI,
    currentUIFilePath,
    selectedItem,
    isEditing,
    isRunMode,
    setCurrentUI,
    setCurrentUIFilePath,
    addItem,
    updateItem,
    deleteItem,
    selectItem,
    setIsEditing,
    moveToTop,
    saveUIDesign,
    setRunMode,
    registerProcess,
    unregisterProcess,
    stopAllProcesses,
  };

  return (
    <UIDesignerContext.Provider value={value}>
      {children}
    </UIDesignerContext.Provider>
  );
};

export const useUIDesigner = (): UIDesignerContextType => {
  const context = useContext(UIDesignerContext);
  if (context === undefined) {
    throw new Error("useUIDesigner must be used within a UIDesignerProvider");
  }
  return context;
};
