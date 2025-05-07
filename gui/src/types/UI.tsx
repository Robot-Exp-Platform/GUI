// UI 组件基础类型
export interface UIBaseItem {
  id: string;
  type: "text" | "image" | "rectangle" | "circle" | "triangle" | "capture" | "camera";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  zIndex: number;
}

// 文本组件
export interface UITextItem extends UIBaseItem {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: string;
}

// 图片组件
export interface UIImageItem extends UIBaseItem {
  type: "image";
  src: string;
}

// 矩形组件
export interface UIRectangleItem extends UIBaseItem {
  type: "rectangle";
}

// 圆形组件
export interface UICircleItem extends UIBaseItem {
  type: "circle";
}

// 三角形组件
export interface UITriangleItem extends UIBaseItem {
  type: "triangle";
}

// 窗口捕获组件
export interface UICaptureItem extends UIBaseItem {
  type: "capture";
  windowId: string;
  windowTitle: string;
  hasSignal: boolean;
}

// 摄像头捕获组件
export interface UICameraItem extends UIBaseItem {
  type: "camera";
  deviceId: string;
  deviceName: string;
  hasSignal: boolean;
}

// UI组件联合类型
export type UIItem =
  | UITextItem
  | UIImageItem
  | UIRectangleItem
  | UICircleItem
  | UITriangleItem
  | UICaptureItem
  | UICameraItem;

// UI设计文件
export interface UIDesign {
  id: string;
  name: string;
  items: UIItem[];
  width: number;
  height: number;
  backgroundColor: string;
}
