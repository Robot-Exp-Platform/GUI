import React, { useState, useEffect } from "react";
import { 
  Modal, 
  Form, 
  Button, 
  Message, 
  Segment, 
  Header, 
  TextArea, 
  Divider,
  Icon
} from "semantic-ui-react";
import { Sensor, SensorType } from "~/types/Sensor";
import { formatJsonCompact } from "~/utils";
import './styles.css';

interface SensorEditorProps {
  sensor: Sensor;
  open: boolean;
  onClose: () => void;
  onSave: (updatedSensor: Sensor) => Promise<boolean>;
  checkDuplicateName: (name: string, currentId: number) => boolean;
}

const SensorEditor: React.FC<SensorEditorProps> = ({
  sensor,
  open,
  onClose,
  onSave,
  checkDuplicateName,
}) => {
  // 编辑模式状态
  const [isJsonMode, setIsJsonMode] = useState<boolean>(false);
  
  // 表单编辑模式的状态
  const [name, setName] = useState<string>(sensor.name);
  const [sensorType, setSensorType] = useState<SensorType>(sensor.sensor_type);
  const [params, setParams] = useState<string>("");
  const [paramsError, setParamsError] = useState<string | null>(null);

  // 焦点状态
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // JSON编辑模式的状态
  const [jsonText, setJsonText] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // 当sensor属性变化时更新表单状态
  useEffect(() => {
    resetFormToOriginal();
  }, [sensor, open]);
  
  // 监听编辑器的打开状态，当关闭后重新打开时清除成功保存提示
  useEffect(() => {
    if (open) {
      // 编辑器重新打开时清除成功保存提示
      setSaveSuccess(false);
    }
  }, [open]);

  // 重置表单为原始状态
  const resetFormToOriginal = () => {
    setName(sensor.name);
    setSensorType(sensor.sensor_type);
    try {
      // 将参数对象转换为格式化的 JSON 字符串
      setParams(JSON.stringify(sensor.params || {}, null, 2));
    } catch (err) {
      setParams("{}");
    }
    setParamsError(null);
    setNameError(null);
    
    // 更新JSON文本
    const jsonObj = {
      name: sensor.name,
      sensor_type: sensor.sensor_type,
      params: sensor.params || {}
    };
    setJsonText(formatJsonCompact(jsonObj));
  };

  // 验证名称
  const validateName = (value: string) => {
    if (!value.trim()) {
      setNameError("名称不能为空");
      return false;
    } else if (checkDuplicateName(value, sensor.id)) {
      setNameError("名称已被使用，请使用不同的名称");
      return false;
    } else {
      setNameError(null);
      return true;
    }
  };

  // 验证参数 JSON
  const validateParams = (jsonString: string): any => {
    try {
      const parsed = JSON.parse(jsonString);
      setParamsError(null);
      return parsed;
    } catch (err) {
      setParamsError("无效的 JSON 格式");
      return null;
    }
  };

  // 用户输入名称时的处理函数
  const handleNameChange = (value: string) => {
    setName(value);
    validateName(value);
    // 清除保存成功的提示
    setSaveSuccess(false);
  };
  
  // 用户输入传感器类型时的处理函数
  const handleSensorTypeChange = (value: string) => {
    setSensorType(value);
    // 清除保存成功的提示
    setSaveSuccess(false);
  };

  // 更新参数输入
  const handleParamsChange = (value: string) => {
    setParams(value);
    // 清除保存成功的提示
    setSaveSuccess(false);
    // 仅在焦点移出时验证，避免用户输入过程中显示错误
  };

  // 保存传感器配置
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      let updatedSensor: Sensor;

      if (isJsonMode) {
        // JSON模式下的保存
        try {
          const parsedJson = JSON.parse(jsonText);

          // 验证JSON结构
          if (!parsedJson.name || typeof parsedJson.name !== "string") {
            throw new Error("名称必须是一个有效的字符串");
          }

          if (!parsedJson.sensor_type || typeof parsedJson.sensor_type !== "string") {
            throw new Error("传感器类型必须是有效的字符串");
          }

          // 检查名称是否重复
          if (checkDuplicateName(parsedJson.name, sensor.id)) {
            throw new Error("名称已被使用，请使用不同的名称");
          }

          updatedSensor = {
            ...sensor,
            name: parsedJson.name,
            sensor_type: parsedJson.sensor_type,
            params: parsedJson.params || {}
          };
        } catch (err) {
          if (err instanceof Error) {
            setError(`JSON 解析错误: ${err.message}`);
          } else {
            setError("无效的 JSON 格式");
          }
          setIsSaving(false);
          return;
        }
      } else {
        // 表单模式下的保存
        
        // 验证表单
        if (!validateName(name)) {
          setIsSaving(false);
          return;
        }

        // 验证参数 JSON
        const parsedParams = validateParams(params);
        if (paramsError || parsedParams === null) {
          setIsSaving(false);
          return;
        }

        // 创建更新后的传感器对象
        updatedSensor = {
          ...sensor,
          name,
          sensor_type: sensorType,
          params: parsedParams
        };
      }

      // 保存传感器配置
      const success = await onSave(updatedSensor);
      
      if (success) {
        setSaveSuccess(true);
        
        // 更新表单状态和原始数据
        setName(updatedSensor.name);
        setSensorType(updatedSensor.sensor_type);
        setParams(JSON.stringify(updatedSensor.params || {}, null, 2));
        
        // 更新JSON文本
        const jsonObj = {
          name: updatedSensor.name,
          sensor_type: updatedSensor.sensor_type,
          params: updatedSensor.params
        };
        setJsonText(formatJsonCompact(jsonObj));
      } else {
        setError("保存失败，请重试");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(`保存错误: ${err.message}`);
      } else {
        setError("保存过程中发生未知错误");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // 切换编辑模式
  const toggleEditMode = () => {
    if (isJsonMode) {
      // 从JSON模式切换到表单模式，放弃未保存的JSON编辑
      setIsJsonMode(false);
      resetFormToOriginal();
    } else {
      // 从表单模式切换到JSON模式，放弃未保存的表单编辑
      const jsonObj = {
        name: sensor.name,
        sensor_type: sensor.sensor_type,
        params: sensor.params || {}
      };
      setJsonText(formatJsonCompact(jsonObj));
      setIsJsonMode(true);
    }
    // 清除之前的错误信息
    setError(null);
    setNameError(null);
    setParamsError(null);
    setSaveSuccess(false);
  };

  // 处理键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 检测 Ctrl+S 组合键
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault(); // 阻止浏览器默认的保存页面行为
      handleSave();
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="small">
      <Modal.Header>
        编辑传感器配置
        <Button
          floated="right"
          content={isJsonMode ? "切换到表单编辑模式" : "切换到JSON编辑模式"}
          size="tiny"
          onClick={toggleEditMode}
        />
      </Modal.Header>
      <Modal.Content>
        <Segment>
          {isJsonMode ? (
            <Form>
              <TextArea
                placeholder="输入JSON配置"
                value={jsonText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJsonText(e.target.value)}
                className={`editor-json-textarea-sensor ${focusedField === "jsonText" ? "focus" : ""}`}
                spellCheck={false}
                onFocus={() => setFocusedField("jsonText")}
                onBlur={() => setFocusedField(null)}
                onKeyDown={handleKeyDown}
              />
            </Form>
          ) : (
            <Form>
              <Form.Input
                label="ID"
                value={sensor.id}
                readOnly
              />
              <p className="editor-id-hint">
                传感器 ID 不能被修改
              </p>
              <Form.Field
                error={nameError ? { content: nameError, pointing: 'above' } : false}
              >
                <label>名称</label>
                <input 
                  value={name} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNameChange(e.target.value)} 
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                />
              </Form.Field>
              <Form.Field>
                <label>传感器类型</label>
                <input 
                  value={sensorType}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleSensorTypeChange(e.target.value)
                  }
                  onFocus={() => setFocusedField("sensorType")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="输入传感器类型"
                />
              </Form.Field>
              
              <Form.Field error={paramsError ? { content: paramsError, pointing: 'above' } : false}>
                <label>参数 (JSON)</label>
                <TextArea
                  placeholder="{ ... }"
                  value={params}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleParamsChange(e.target.value)}
                  className={`params-textarea ${focusedField === "params" ? "focus" : ""}`}
                  spellCheck={false}
                  onFocus={() => setFocusedField("params")}
                  onBlur={() => {
                    setFocusedField(null);
                    validateParams(params);
                  }}
                />
              </Form.Field>
            </Form>
          )}

          {error && (
            <Message negative>
              <Message.Header>错误</Message.Header>
              <p>{error}</p>
            </Message>
          )}

          {saveSuccess && (
            <Message positive>
              <Message.Header>保存成功</Message.Header>
              <p>传感器配置已成功更新</p>
            </Message>
          )}
        </Segment>
      </Modal.Content>
      <Modal.Actions>
        <Button negative onClick={onClose}>
          退出
        </Button>
        <Button
          positive
          loading={isSaving}
          onClick={handleSave}
          disabled={isSaving}
        >
          保存
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default SensorEditor;