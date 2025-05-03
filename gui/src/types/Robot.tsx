export type RobotType = "panda" | "ur";

export interface Robot {
  id: number;
  name: string;
  robot_type: RobotType;
}

// 创建一个特定类型的机器人实例
export const createRobot = (id: number, robot_type: RobotType): Robot => {
  return {
    id,
    name: `${robot_type}_${id}`,
    robot_type,
  };
};

// 创建一个熊猫机器人实例
export const createPandaRobot = (id: number): Robot => {
  return createRobot(id, "panda");
};

// 创建一个UR机器人实例
export const createURRobot = (id: number): Robot => {
  return createRobot(id, "ur");
};
