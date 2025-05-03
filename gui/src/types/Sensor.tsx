export type SensorType = "sensor_a" | "sensor_b";

export interface Sensor {
  id: number;
  name: string;
  sensor_type: SensorType;
}

// 创建一个特定类型的传感器实例
export const createSensor = (id: number, sensor_type: SensorType): Sensor => {
  return {
    id,
    name: `${sensor_type}_${id}`,
    sensor_type,
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
