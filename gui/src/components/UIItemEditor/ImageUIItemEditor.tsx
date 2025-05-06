import React from "react";
import { Form, Button, Input, Label } from "semantic-ui-react";
import { SketchPicker } from "react-color";
import { UIImageItem } from "~/types/UI";
import { useUIDesigner } from "~/components/contexts/UIDesignerContext";
import "./styles.css";

interface ImageUIItemEditorProps {
  item: UIImageItem;
}

export const ImageUIItemEditor: React.FC<ImageUIItemEditorProps> = ({
  item,
}) => {
  const { updateItem } = useUIDesigner();
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState(item.src);

  const handleColorChange = (color: { hex: string }) => {
    updateItem(item.id, { fill: color.hex });
  };

  // 处理图片URL输入
  const handleImageSrcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageSrc(e.target.value);
  };

  // 当用户完成编辑图片URL时更新组件
  const handleImageSrcUpdate = () => {
    updateItem(item.id, { src: imageSrc });
  };

  // 选择本地图片（模拟）
  const handleSelectImage = async () => {
    try {
      const result = await window.electronAPI.selectImageFile();
      if (result.success && result.filePath) {
        // 将文件路径转换为数据URL
        updateItem(item.id, { src: result.filePath });
        setImageSrc(result.filePath);
      }
    } catch (error) {
      console.error("选择图片失败:", error);
    }
  };

  return (
    <Form>
      <Form.Group widths="equal">
        <Form.Field>
          <label>图片源</label>
          <Input
            action={{
              content: "浏览...",
              onClick: handleSelectImage,
            }}
            value={imageSrc}
            onChange={handleImageSrcChange}
            onBlur={handleImageSrcUpdate}
          />
        </Form.Field>
      </Form.Group>

      <Form.Group widths="equal">
        <Form.Field>
          <label>宽度</label>
          <Input
            type="number"
            value={item.width}
            onChange={(e) =>
              updateItem(item.id, { width: Number(e.target.value) })
            }
          />
        </Form.Field>
        <Form.Field>
          <label>高度</label>
          <Input
            type="number"
            value={item.height}
            onChange={(e) =>
              updateItem(item.id, { height: Number(e.target.value) })
            }
          />
        </Form.Field>
      </Form.Group>

      <Form.Field>
        <label>颜色滤镜</label>
        <div className="color-picker-container">
          <Label
            className="color-display"
            style={{
              backgroundColor: item.fill || "transparent",
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
