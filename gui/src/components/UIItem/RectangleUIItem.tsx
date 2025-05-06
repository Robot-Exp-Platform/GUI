import React from "react";
import { Rect } from "react-konva";
import { UIRectangleItem } from "~/types/UI";
import { BaseUIItem } from "./BaseUIItem";

interface RectangleUIItemProps {
  item: UIRectangleItem;
}

export const RectangleUIItem: React.FC<RectangleUIItemProps> = ({ item }) => {
  return (
    <BaseUIItem item={item}>
      <Rect fill={item.fill} width={item.width} height={item.height} />
    </BaseUIItem>
  );
};
