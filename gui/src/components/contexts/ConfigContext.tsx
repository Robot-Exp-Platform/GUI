import { createContext } from "react";

// 创建一个上下文来共享全局 ID 计数器
export const ConfigContext = createContext<{
  nextId: number;
  incrementId: () => number;
}>({
  nextId: 1,
  incrementId: () => 1,
});

export default ConfigContext;
