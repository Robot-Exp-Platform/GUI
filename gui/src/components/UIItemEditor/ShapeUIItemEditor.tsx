import React from "react";
import { Form, Button, Label } from "semantic-ui-react";
import { SketchPicker } from "react-color";
import { UIItem } from "~/types/UI";
import { useUIDesigner } from "~/components/contexts/UIDesignerContext";
import "./styles.css";

interface ShapeUIItemEditorProps {
  item: UIItem;
}

export const ShapeUIItemEditor: React.FC<ShapeUIItemEditorProps> = ({
  item,
}) => {
  const { updateItem } = useUIDesigner();
  const [showColorPicker, setShowColorPicker] = React.useState(false);

  const handleColorChange = (color: { hex: string }) => {
    updateItem(item.id, { fill: color.hex });
  };

  // 获取形状类型的中文名称
  const getShapeTypeName = () => {
    switch (item.type) {
      case "rectangle":
        return "矩形";
      case "circle":
        return "圆形";
      case "triangle":
        return "三角形";
      default:
        return "图形";
    }
  };

  return (
    <Form>
      <Form.Field>
        <label>填充颜色</label>
        <div className="color-picker-container">
          <Label
            className="color-display"
            style={{
              backgroundColor: item.fill,
            }}
          />
          <Button
            icon="eyedropper"
            onClick={() => setShowColorPicker(!showColorPicker)}
          />
          {showColorPicker && (
            <div className="color-picker-popup">
              <div
                className="color-picker-overlay"
                onClick={() => setShowColorPicker(false)}
              />
              <SketchPicker
                color={item.fill}
                onChangeComplete={handleColorChange}
              />
            </div>
          )}
        </div>
      </Form.Field>
    </Form>
  );
};
