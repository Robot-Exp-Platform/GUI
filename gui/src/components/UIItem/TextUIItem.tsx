import React from "react";
import { Text } from "react-konva";
import { UITextItem } from "~/types/UI";
import { BaseUIItem } from "./BaseUIItem";

interface TextUIItemProps {
  item: UITextItem;
}

export const TextUIItem: React.FC<TextUIItemProps> = ({ item }) => {
  // 为文字添加内边距，防止被锚点遮挡
  const padding = 8;
  
  return (
    <BaseUIItem item={item}>
      <Text
        text={item.text}
        fontSize={item.fontSize}
        fontFamily={item.fontFamily}
        fontStyle={item.fontStyle}
        fill={item.fill}
        width={item.width - padding * 2} // 减去左右内边距
        height={item.height - padding * 2} // 减去上下内边距
        x={padding} // 左内边距
        y={padding} // 上内边距
        padding={padding} // 内部文字的padding
        verticalAlign="middle" // 垂直居中对齐
        wrap="word" // 自动换行
      />
    </BaseUIItem>
  );
};
