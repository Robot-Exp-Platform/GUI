import React from "react";
import { Form, Button, Input, Divider } from "semantic-ui-react";
import { UIButtonItem } from "~/types/UI";
import { useUIDesigner } from "~/components/contexts/UIDesignerContext";
import "./styles.css";

interface ButtonUIItemEditorProps {
  item: UIButtonItem;
}

export const ButtonUIItemEditor: React.FC<ButtonUIItemEditorProps> = ({
  item,
}) => {
  const { updateItem } = useUIDesigner();
  const [buttonText, setButtonText] = React.useState(item.text || "按钮");
  const [taskJsonPath, setTaskJsonPath] = React.useState(item.taskJsonPath || "");
  const [port, setPort] = React.useState(item.port || 6651); // 默认端口为6651

  // 处理按钮文本更改
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setButtonText(e.target.value);
  };

  // 保存按钮文本更改
  const handleTextSave = () => {
    updateItem(item.id, { text: buttonText });
  };

  // 处理端口更改
  const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPort = parseInt(e.target.value, 10);
    setPort(isNaN(newPort) ? 6651 : newPort);
  };

  // 保存端口更改
  const handlePortSave = () => {
    updateItem(item.id, { port: port });
  };

  // 选择任务JSON文件
  const handleSelectTaskJson = async () => {
    try {
      const result = await window.electronAPI.selectTaskJsonFile();
      if (result.success && result.filePath) {
        setTaskJsonPath(result.filePath);
        updateItem(item.id, { taskJsonPath: result.filePath });
      }
    } catch (error) {
      console.error("选择任务JSON文件失败:", error);
    }
  };

  return (
    <Form>
      <Form.Field>
        <label>按钮文本</label>
        <div className="input-with-button">
          <Input
            value={buttonText}
            onChange={handleTextChange}
            onBlur={handleTextSave}
            placeholder="输入按钮文本..."
          />
        </div>
      </Form.Field>

      <Divider />
      
      <Form.Field>
        <label>任务JSON文件路径</label>
        <div className="input-with-button">
          <Input
            value={taskJsonPath}
            placeholder="请选择任务JSON文件..."
            disabled
            fluid
          />
          <Button icon="file" onClick={handleSelectTaskJson} />
        </div>
        <div className="help-text">
          在运行模式下点击按钮时，将使用此JSON文件作为任务文件。
          如不指定，将使用项目目录下的task.json。
        </div>
      </Form.Field>

      <Divider />

      <Form.Field>
        <label>运行端口</label>
        <Input
          type="number"
          value={port}
          onChange={handlePortChange}
          onBlur={handlePortSave}
          min={1}
          max={65535}
          placeholder="输入端口号..."
        />
        <div className="help-text">
          指定运行程序使用的端口号，将作为 -p 参数传递。
          默认端口：6651
        </div>
      </Form.Field>
    </Form>
  );
};