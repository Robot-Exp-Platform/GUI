import React, { useEffect, useState } from "react";
import { Image } from "react-konva";
import { UIImageItem } from "~/types/UI";
import { BaseUIItem } from "./BaseUIItem";

interface ImageUIItemProps {
  item: UIImageItem;
  isRunMode: boolean;
}

export const ImageUIItem: React.FC<ImageUIItemProps> = ({ item, isRunMode }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!item.src) return;

    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = item.src;
    img.onload = () => {
      setImage(img);
    };

    return () => {
      img.onload = null;
    };
  }, [item.src]);

  return (
    <BaseUIItem item={item} isRunMode={isRunMode}>
      {image && (
        <Image
          image={image}
          fill={item.fill}
          width={item.width}
          height={item.height}
        />
      )}
    </BaseUIItem>
  );
};
