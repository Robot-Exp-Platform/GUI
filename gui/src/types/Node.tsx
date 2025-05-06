export interface Node {
  id: number; // 节点的唯一标识符
  name: string; // 供用户编辑的名称
  node_type: string;
  robots: string[];
  sensors: string[];
  params: Record<string, unknown>;
  _paramsText?: string; // 临时存储用户正在编辑的参数文本
}

// 创建一个节点实例
export const createNode = (defaultName: string = "新节点", id: number = 0): Node => ({
  id, // 使用提供的id作为唯一标识符
  name: defaultName, // 使用提供的默认名称
  node_type: "",
  robots: [],
  sensors: [],
  params: {},
});