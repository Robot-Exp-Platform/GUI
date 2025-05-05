export type RobotType = "panda" | "ur";

export interface BasePose {
  rotation: [number, number, number, number]; // 四元数表示旋转
  translation: [number, number, number]; // 三维向量表示平移
}

export interface Robot {
  id: number;
  name: string;
  robotType: RobotType;
  basePose: BasePose;
}

// 创建一个特定类型的机器人实例
export const createRobot = (id: number, robotType: RobotType): Robot => ({
  id,
  name: `${robotType}_${id}`,
  robotType,
  basePose: {
    rotation: [1, 0, 0, 0], // 单位四元数，表示无旋转
    translation: [0, 0, 0], // 原点位置
  },
});

// export const createTypedRobot = (id: number, type: ): Robot => {

// // 创建一个熊猫机器人实例
export const createPandaRobot = (id: number): Robot => createRobot(id, "panda");

// // 创建一个UR机器人实例
export const createURRobot = (id: number): Robot => createRobot(id, "ur");
