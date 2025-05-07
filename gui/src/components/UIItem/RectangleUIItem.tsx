import React from "react";
import { Rect } from "react-konva";
import { UIRectangleItem } from "~/types/UI";
import { BaseUIItem } from "./BaseUIItem";

interface RectangleUIItemProps {
  item: UIRectangleItem;
  isRunMode: boolean;
}

export const RectangleUIItem: React.FC<RectangleUIItemProps> = ({ item, isRunMode }) => {
  return (
    <BaseUIItem item={item} isRunMode={isRunMode}>
      <Rect fill={item.fill} width={item.width} height={item.height} />
    </BaseUIItem>
  );
};
