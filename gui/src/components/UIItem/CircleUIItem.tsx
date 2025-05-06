import React from "react";
import { Circle } from "react-konva";
import { UICircleItem } from "~/types/UI";
import { BaseUIItem } from "./BaseUIItem";

interface CircleUIItemProps {
  item: UICircleItem;
}

export const CircleUIItem: React.FC<CircleUIItemProps> = ({ item }) => {
  // 使用宽度或高度中较小的值作为半径
  const radius = Math.min(item.width, item.height) / 2;

  return (
    <BaseUIItem item={item}>
      <Circle
        fill={item.fill}
        radius={radius}
        // 将圆形定位在中心点
        offsetX={-radius}
        offsetY={-radius}
      />
    </BaseUIItem>
  );
};
