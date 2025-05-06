import React, { useEffect, useState } from "react";
import { Image } from "react-konva";
import { UIImageItem } from "~/types/UI";
import { BaseUIItem } from "./BaseUIItem";

interface ImageUIItemProps {
  item: UIImageItem;
}

export const ImageUIItem: React.FC<ImageUIItemProps> = ({ item }) => {
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
    <BaseUIItem item={item}>
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
