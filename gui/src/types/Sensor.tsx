// 传感器类型现在是任意字符串
export type SensorType = string;

export interface Sensor {
  id: number;
  name: string;
  sensor_type: SensorType;
  params: any; // 保持为任意类型，以便存储任何合法的 JSON
}

// 创建一个特定类型的传感器实例
export const createSensor = (
  id: number,
  sensor_type: SensorType = "Sensor"
): Sensor => {
  return {
    id,
    name: `${sensor_type}_${id}`,
    sensor_type,
    params: {}, // 默认为空对象
  };
};

// 创建A型传感器实例
export const createSensorA = (id: number): Sensor => {
  return createSensor(id, "sensor_a");
};

// 创建B型传感器实例
export const createSensorB = (id: number): Sensor => {
  return createSensor(id, "sensor_b");
};
