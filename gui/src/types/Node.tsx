export interface Node {
  name: string; // 新增name字段，供用户编辑
  node_type: string;
  robots: string[];
  sensors: string[];
  params: Record<string, unknown>;
  _paramsText?: string; // 临时存储用户正在编辑的参数文本
}

// 创建一个节点实例
export const createNode = (defaultName: string = "新节点"): Node => ({
  name: defaultName, // 使用提供的默认名称
  node_type: "",
  robots: [],
  sensors: [],
  params: {},
});