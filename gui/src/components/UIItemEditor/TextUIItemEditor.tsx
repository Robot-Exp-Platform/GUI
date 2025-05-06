import React from "react";
import { Form, Button, Input, Label } from "semantic-ui-react";
import { SketchPicker } from "react-color";
import { UITextItem } from "~/types/UI";
import { useUIDesigner } from "~/components/contexts/UIDesignerContext";
import "./styles.css";

interface TextUIItemEditorProps {
  item: UITextItem;
}

export const TextUIItemEditor: React.FC<TextUIItemEditorProps> = ({ item }) => {
  const { updateItem } = useUIDesigner();
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [localText, setLocalText] = React.useState(item.text);
  const [isFocused, setIsFocused] = React.useState(false);

  // 当外部item.text变化且不是由本组件引起的更新，才更新localText
  React.useEffect(() => {
    // 只有当文本框没有焦点时，才从props更新本地状态
    if (!isFocused) {
      setLocalText(item.text);
    }
  }, [item.text, isFocused]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // 更新本地状态
    setLocalText(e.target.value);
    
    // 同时更新组件状态，实时反映在画布上
    updateItem(item.id, { text: e.target.value });
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof UITextItem
  ) => {
    updateItem(item.id, { [field]: Number(e.target.value) });
  };

  const handleColorChange = (color: { hex: string }) => {
    updateItem(item.id, { fill: color.hex });
  };

  const fontFamilyOptions = [
    { key: "Arial", text: "Arial", value: "Arial" },
    { key: "Times New Roman", text: "Times New Roman", value: "Times New Roman" },
    { key: "Courier New", text: "Courier New", value: "Courier New" },
    { key: "SimSun", text: "宋体", value: "SimSun" },
    { key: "SimHei", text: "黑体", value: "SimHei" },
  ];

  const fontStyleOptions = [
    { key: "normal", text: "正常", value: "normal" },
    { key: "bold", text: "粗体", value: "bold" },
    { key: "italic", text: "斜体", value: "italic" },
    { key: "bold italic", text: "粗斜体", value: "bold italic" },
  ];

  return (
    <Form style={{ overflow: "visible" }}>
      <Form.Field>
        <label>文本内容</label>
        <Form.TextArea
          value={localText}
          onChange={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{ minHeight: 60 }}
        />
      </Form.Field>

      <Form.Group widths="equal">
        <Form.Field>
          <label>字号</label>
          <Input
            type="number"
            min={8}
            max={72}
            value={item.fontSize}
            onChange={(e) => handleNumberChange(e, "fontSize")}
          />
        </Form.Field>
        <Form.Select
          fluid
          label="字体"
          options={fontFamilyOptions}
          value={item.fontFamily}
          onChange={(_, data) =>
            updateItem(item.id, { fontFamily: data.value as string })
          }
        />
        <Form.Select
          fluid
          label="样式"
          options={fontStyleOptions}
          value={item.fontStyle}
          onChange={(_, data) =>
            updateItem(item.id, { fontStyle: data.value as string })
          }
        />
      </Form.Group>

      <Form.Field>
        <label>文字颜色</label>
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
