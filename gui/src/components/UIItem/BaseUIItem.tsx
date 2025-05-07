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
  isRunMode: boolean; // 是否运行模式
}

export const BaseUIItem: React.FC<BaseUIItemProps> = ({
  item,
  children,
  onContextMenu,
  isRunMode,
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
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  // 右键菜单
  const { show } = useContextMenu({
    id: KONVA_MENU_ID,
  });

  // 处理选择
  const handleSelect = (e: KonvaEventObject<MouseEvent>) => {
    // 运行模式下不处理选择
    if (isRunMode) return;

    e.cancelBubble = true;

    if (isSelected) return;

    selectItem(item.id);
    moveToTop(item.id);
  };

  // 处理拖拽
  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    // 运行模式下不应该触发，但为了安全起见仍然检查
    if (isRunMode) return;

    updateItem(item.id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  // 处理变换结束（调整大小）
  const handleTransformEnd = () => {
    // 运行模式下不应该触发，但为了安全起见仍然检查
    if (isRunMode) return;

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

  // 处理右键菜单
  const handleContextMenu = (e: KonvaEventObject<PointerEvent>) => {
    // 运行模式下不显示右键菜单
    if (isRunMode) return;

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
    // 只在非运行模式下更新变换器
    if (isSelected && !isRunMode && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isRunMode]);

  // 计算组件中心点位置
  const centerX = item.width / 2;
  const centerY = item.height / 2;

  return (
    <>
      <Group>
        <Group
          x={item.x}
          y={item.y}
          width={item.width}
          height={item.height}
          rotation={item.rotation}
          offsetX={centerX} // 设置旋转中心为组件宽度的一半
          offsetY={centerY} // 设置旋转中心为组件高度的一半
          draggable={!isRunMode} // 运行模式下禁用拖动
          onClick={handleSelect}
          onTap={handleSelect}
          onDragEnd={handleDragEnd}
          onContextMenu={handleContextMenu}
          ref={shapeRef}
        >
          {children}
        </Group>

        {/* 只在非运行模式下显示变换器 */}
        {isSelected && !isRunMode && (
          <Transformer
            ref={trRef}
            rotateEnabled={true}
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
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
