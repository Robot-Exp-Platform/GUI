import React, { useState, useRef } from "react";
import { Transformer, Group } from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import { Menu, Item, useContextMenu } from "react-contexify";
import "react-contexify/ReactContexify.css";
import { UIItem } from "~/types/UI";
import { useUIDesigner } from "~/components/contexts/UIDesignerContext";

// 右键菜单ID
const KONVA_MENU_ID = "konva-context-menu";

interface BaseUIItemProps {
  item: UIItem;
  children: React.ReactNode;
  onContextMenu?: (e: KonvaEventObject<PointerEvent>) => void;
}

export const BaseUIItem: React.FC<BaseUIItemProps> = ({
  item,
  children,
  onContextMenu,
}) => {
  const {
    selectedItem,
    selectItem,
    updateItem,
    deleteItem,
    moveToTop,
    setIsEditing,
  } = useUIDesigner();

  const isSelected = selectedItem?.id === item.id;
  const [showAnchor, setShowAnchor] = useState(false);
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const anchorRef = useRef<any>(null);

  // 右键菜单
  const { show } = useContextMenu({
    id: KONVA_MENU_ID,
  });

  // 处理选择
  const handleSelect = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;

    if (isSelected) return;

    selectItem(item.id);
    moveToTop(item.id);
    setShowAnchor(true);
  };

  // 处理拖拽
  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    updateItem(item.id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  // 处理变换结束（调整大小）
  const handleTransformEnd = () => {
    if (!shapeRef.current) return;

    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // 重置缩放，更新宽高
    node.scaleX(1);
    node.scaleY(1);

    updateItem(item.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation(),
    });
  };

  // 处理旋转点拖拽
  const handleAnchorDragMove = (e: KonvaEventObject<DragEvent>) => {
    if (!shapeRef.current) return;

    const shape = shapeRef.current;
    const centerX = shape.x();
    const centerY = shape.y();

    const anchorX = e.target.x();
    const anchorY = e.target.y();

    // 计算角度
    const angle =
      (Math.atan2(anchorY - centerY, anchorX - centerX) * 180) / Math.PI;

    shape.rotation(angle + 90);
  };

  // 处理旋转完成
  const handleAnchorDragEnd = () => {
    if (!shapeRef.current) return;
    updateItem(item.id, {
      rotation: shapeRef.current.rotation(),
    });
  };

  // 处理右键菜单
  const handleContextMenu = (e: KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    selectItem(item.id);
    moveToTop(item.id);

    if (onContextMenu) {
      onContextMenu(e);
    }

    // 显示菜单在鼠标位置
    show({
      event: e.evt,
      props: { id: item.id },
    });
  };

  // 编辑菜单项处理
  const handleEdit = () => {
    selectItem(item.id);
    setIsEditing(true);
  };

  // 删除菜单项处理
  const handleDelete = () => {
    deleteItem(item.id);
  };

  React.useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Group>
        <Group
          x={item.x}
          y={item.y}
          width={item.width}
          height={item.height}
          rotation={item.rotation}
          draggable
          onClick={handleSelect}
          onTap={handleSelect}
          onDragEnd={handleDragEnd}
          onContextMenu={handleContextMenu}
          ref={shapeRef}
        >
          {children}
        </Group>

        {isSelected && showAnchor && (
          <Group>
            {/* 旋转锚点 */}
            <Group
              x={item.x}
              y={item.y - 30}
              draggable
              onDragMove={handleAnchorDragMove}
              onDragEnd={handleAnchorDragEnd}
              ref={anchorRef}
            >
              <Circle
                radius={8}
                fill="#4285f4"
                stroke="#ffffff"
                strokeWidth={1}
              />
              <Line points={[0, 0, 0, 30]} stroke="#4285f4" strokeWidth={1} />
            </Group>
          </Group>
        )}

        {isSelected && (
          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              // 限制最小尺寸
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
            onTransformEnd={handleTransformEnd}
          />
        )}
      </Group>

      <Menu id={KONVA_MENU_ID}>
        <Item onClick={handleEdit}>编辑</Item>
        <Item onClick={handleDelete}>删除</Item>
      </Menu>
    </>
  );
};

// 这些是BaseUIItem内部使用的Konva组件
// 由于我们在UIItem组件中使用react-konva，这里直接从react-konva导入
import { Circle, Line } from "react-konva";
