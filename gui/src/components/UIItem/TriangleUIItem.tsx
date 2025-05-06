import React from "react";
import { Line } from "react-konva";
import { UITriangleItem } from "~/types/UI";
import { BaseUIItem } from "./BaseUIItem";

interface TriangleUIItemProps {
  item: UITriangleItem;
}

export const TriangleUIItem: React.FC<TriangleUIItemProps> = ({ item }) => {
  // 计算三角形的点坐标，实现可独立调整宽高的三角形
  const points = [
    0, item.height,     // 左下角
    item.width / 2, 0,  // 顶点
    item.width, item.height  // 右下角
  ];

  return (
    <BaseUIItem item={item}>
      <Line
        points={points}
        fill={item.fill}
        closed={true} // 闭合路径形成三角形
      />
    </BaseUIItem>
  );
};
