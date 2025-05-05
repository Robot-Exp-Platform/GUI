// 传感器类型现在是任意字符串
export type SensorType = string;

export interface Sensor {
  id: number;
  name: string;
  sensorType: SensorType;
  params: Record<string, unknown>; // 使用Record<string, unknown>替代any
}

// 创建一个特定类型的传感器实例
export const createSensor = (
  id: number,
  sensorType: SensorType = "Sensor",
): Sensor => ({
  id,
  name: `${sensorType}_${id}`,
  sensorType,
  params: {}, // 默认为空对象
});
