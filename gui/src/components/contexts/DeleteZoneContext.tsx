import React, { createContext } from "react";

// 创建一个上下文来共享删除区域的引用和状态
export const DeleteZoneContext = createContext<{
  ref: React.RefObject<HTMLDivElement> | null;
  isHovering: boolean;
  setIsHovering: (isHovering: boolean) => void;
    }>({
      ref: null,
      isHovering: false,
      setIsHovering: () => {},
    });

export default DeleteZoneContext;
