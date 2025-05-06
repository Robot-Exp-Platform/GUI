import React from "react";
import { Ellipse } from "react-konva";
import { UICircleItem } from "~/types/UI";
import { BaseUIItem } from "./BaseUIItem";

interface CircleUIItemProps {
  item: UICircleItem;
}

export const CircleUIItem: React.FC<CircleUIItemProps> = ({ item }) => {
  // 使用宽度和高度的一半分别作为椭圆的x半径和y半径
  const radiusX = item.width / 2;
  const radiusY = item.height / 2;

  return (
    <BaseUIItem item={item}>
      <Ellipse
        fill={item.fill}
        radiusX={radiusX}
        radiusY={radiusY}
        // Ellipse在Konva中默认就是以中心点定位的，不需要调整offset
      />
    </BaseUIItem>
  );
};
