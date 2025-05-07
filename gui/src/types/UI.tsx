// UI 组件基础类型
export interface UIBaseItem {
  id: string;
  type: "text" | "image" | "rectangle" | "circle" | "triangle" | "capture" | "camera" | "button" | "monitor";
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

// 按钮组件
export interface UIButtonItem extends UIBaseItem {
  type: "button";
  text: string;
  taskJsonPath: string;
  port: number; // 添加端口字段，用于指定运行时的端口参数
  isRunning?: boolean; // 添加运行状态字段，表示按钮当前是否在运行程序
}

// 窗口捕获组件
export interface UICaptureItem extends UIBaseItem {
  type: "capture";
  windowId: string;
  windowTitle: string;
  hasSignal: boolean;
  frames: number; // 每秒渲染的帧数，默认为1
}

// 摄像头捕获组件
export interface UICameraItem extends UIBaseItem {
  type: "camera";
  deviceId: string;
  deviceName: string;
  hasSignal: boolean;
  frames: number; // 每秒渲染的帧数，默认为1
}

// 监视器组件
export interface UIMonitorItem extends UIBaseItem {
  type: "monitor";
  port: number;     // TCP监听端口，默认为6651
  filterTag: string; // 要筛选的标签
  drawField: string; // 要绘制的字段
  duration: number;  // 展示最近多少秒的数据，默认为5
  minValue: number;  // Y轴最小值，默认为0
  maxValue: number;  // Y轴最大值，默认为3
  serverId?: string; // 服务器ID，运行时使用
  isRunning?: boolean; // 表示监视器当前是否在运行
}

// UI组件联合类型
export type UIItem =
  | UITextItem
  | UIImageItem
  | UIRectangleItem
  | UICircleItem
  | UITriangleItem
  | UIButtonItem
  | UICaptureItem
  | UICameraItem
  | UIMonitorItem;

// UI设计文件
export interface UIDesign {
  id: string;
  name: string;
  items: UIItem[];
  width: number;
  height: number;
  backgroundColor: string;
}
