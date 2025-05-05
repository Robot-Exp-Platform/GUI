import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Button,
  Message,
  Segment,
  Header,
  TextArea,
  Grid,
} from "semantic-ui-react";
import { Robot, RobotType } from "~/types/Robot";
import { formatJsonCompact } from "~/utils";
import "./styles.css";

interface RobotEditorProps {
  robot: Robot;
  open: boolean;
  onClose: () => void;
  onSave: (updatedRobot: Robot) => Promise<boolean>;
  checkDuplicateName: (name: string, currentId: number) => boolean;
}

const RobotEditor: React.FC<RobotEditorProps> = ({
  robot,
  open,
  onClose,
  onSave,
  checkDuplicateName,
}) => {
  // 编辑模式状态
  const [isJsonMode, setIsJsonMode] = useState<boolean>(false);

  // 表单编辑模式的状态
  const [name, setName] = useState<string>(robot.name);
  const [robotType, setRobotType] = useState<RobotType>(robot.robotType);
  const [rotation, setRotation] = useState<[number, number, number, number]>(
    robot.basePose?.rotation || [1, 0, 0, 0]
  );
  const [translation, setTranslation] = useState<[number, number, number]>(
    robot.basePose?.translation || [0, 0, 0]
  );

  // 焦点状态
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // JSON编辑模式的状态
  const [jsonText, setJsonText] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // 当robot属性变化时更新表单状态
  useEffect(() => {
    resetFormToOriginal();
  }, [robot, open]);

  // 重置表单为原始状态
  const resetFormToOriginal = () => {
    setName(robot.name);
    setRobotType(robot.robotType);
    setRotation(robot.basePose?.rotation || [1, 0, 0, 0]);
    setTranslation(robot.basePose?.translation || [0, 0, 0]);
    setNameError(null);
    setError(null);
    setSaveSuccess(false);

    // 更新JSON文本
    const jsonObj = {
      name: robot.name,
      robotType: robot.robotType,
      basePose: {
        rotation: robot.basePose?.rotation || [1, 0, 0, 0],
        translation: robot.basePose?.translation || [0, 0, 0],
      },
    };
    setJsonText(formatJsonCompact(jsonObj));
  };

  // 验证名称
  const validateName = (value: string) => {
    if (!value.trim()) {
      return "名称不能为空";
    } else if (checkDuplicateName(value, robot.id)) {
      return "名称已被使用，请使用不同的名称";
    }
    return null;
  };

  // 处理焦点事件，清除成功消息但保留错误信息直到用户修改
  const handleFieldFocus = (fieldName: string) => {
    setFocusedField(fieldName);
    // 清除错误和成功消息
    setError(null);
    setSaveSuccess(false);
    setNameError(null);
  };

  // 保存机器人配置
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    setNameError(null);

    try {
      let updatedRobot: Robot;

      if (isJsonMode) {
        // JSON模式下的保存
        try {
          const parsedJson = JSON.parse(jsonText);

          // 验证JSON结构
          if (!parsedJson.name || typeof parsedJson.name !== "string") {
            setError("名称必须是一个有效的字符串");
            setIsSaving(false);
            return;
          }

          if (
            !parsedJson.robotType ||
            (parsedJson.robotType !== "panda" && parsedJson.robotType !== "ur")
          ) {
            setError("机器人类型必须是 'panda' 或 'ur'");
            setIsSaving(false);
            return;
          }

          if (!parsedJson.basePose) {
            setError("basePose 是必需的");
            setIsSaving(false);
            return;
          }

          if (
            !Array.isArray(parsedJson.basePose.rotation) ||
            parsedJson.basePose.rotation.length !== 4 ||
            !parsedJson.basePose.rotation.every(
              (val: unknown) => typeof val === "number"
            )
          ) {
            setError("rotation 必须是含有4个数字的数组");
            setIsSaving(false);
            return;
          }

          if (
            !Array.isArray(parsedJson.basePose.translation) ||
            parsedJson.basePose.translation.length !== 3 ||
            !parsedJson.basePose.translation.every(
              (val: unknown) => typeof val === "number"
            )
          ) {
            setError("translation 必须是含有3个数字的数组");
            setIsSaving(false);
            return;
          }

          // 检查名称是否重复
          if (checkDuplicateName(parsedJson.name, robot.id)) {
            setError("名称已被使用，请使用不同的名称");
            setIsSaving(false);
            return;
          }

          updatedRobot = {
            ...robot,
            name: parsedJson.name,
            robotType: parsedJson.robotType as RobotType,
            basePose: {
              rotation: parsedJson.basePose.rotation as [
                number,
                number,
                number,
                number
              ],
              translation: parsedJson.basePose.translation as [
                number,
                number,
                number
              ],
            },
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
        const nameErrorMsg = validateName(name);
        if (nameErrorMsg) {
          setError(nameErrorMsg);
          setNameError(nameErrorMsg);
          setIsSaving(false);
          return;
        }

        // 创建更新后的机器人对象
        updatedRobot = {
          ...robot,
          name,
          robotType,
          basePose: {
            rotation,
            translation,
          },
        };
      }

      // 保存机器人配置
      const success = await onSave(updatedRobot);

      if (success) {
        setSaveSuccess(true);
        // 清除所有错误状态
        setError(null);
        setNameError(null);

        // 更新当前 robot 对象的引用，这样切换模式时会使用新的值
        robot.name = updatedRobot.name;
        robot.robotType = updatedRobot.robotType;
        robot.basePose = updatedRobot.basePose;

        // 更新表单状态
        setName(updatedRobot.name);
        setRobotType(updatedRobot.robotType);
        setRotation(updatedRobot.basePose.rotation);
        setTranslation(updatedRobot.basePose.translation);

        // 更新JSON文本
        const jsonObj = {
          name: updatedRobot.name,
          robotType: updatedRobot.robotType,
          basePose: {
            rotation: updatedRobot.basePose.rotation,
            translation: updatedRobot.basePose.translation,
          },
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

  // 处理输入变化，清除对应的错误
  const handleNameChange = (value: string) => {
    setName(value);
    setNameError(null); // 用户修改名称时清除名称错误
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
        name: robot.name,
        robotType: robot.robotType,
        basePose: {
          rotation: robot.basePose.rotation,
          translation: robot.basePose.translation,
        },
      };
      setJsonText(formatJsonCompact(jsonObj));
      setIsJsonMode(true);
    }
    // 清除之前的错误信息
    setError(null);
    setNameError(null);
    setSaveSuccess(false);
  };

  // 处理旋转值的更改
  const handleRotationChange = (index: number, value: string) => {
    const newValue = parseFloat(value) || 0;
    const newRotation = [...rotation] as [number, number, number, number];
    newRotation[index] = newValue;
    setRotation(newRotation);
  };

  // 处理平移值的更改
  const handleTranslationChange = (index: number, value: string) => {
    const newValue = parseFloat(value) || 0;
    const newTranslation = [...translation] as [number, number, number];
    newTranslation[index] = newValue;
    setTranslation(newTranslation);
  };

  // 处理键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 检测 Ctrl+S 组合键
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault(); // 阻止浏览器默认的保存页面行为
      handleSave();
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="small">
      <Modal.Header>
        编辑机器人配置
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
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setJsonText(e.target.value)
                }
                className={`editor-json-textarea ${
                  focusedField === "jsonText" ? "focus" : ""
                }`}
                spellCheck="false"
                onFocus={() => handleFieldFocus("jsonText")}
                onBlur={() => setFocusedField(null)}
                onKeyDown={handleKeyDown}
              />
            </Form>
          ) : (
            <Form>
              <Form.Input label="ID" value={robot.id} readOnly />
              <p className="editor-id-hint">机器人 ID 不能被修改</p>
              <Form.Field
                error={
                  nameError ? { content: nameError, pointing: "above" } : false
                }
              >
                <label>名称</label>
                <input
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleNameChange(e.target.value);
                  }}
                  className={`name-input ${
                    focusedField === "name" ? "focus" : ""
                  }`}
                  onFocus={() => handleFieldFocus("name")}
                  onBlur={() => setFocusedField(null)}
                />
              </Form.Field>
              <Form.Field>
                <label>机器人类型</label>
                <Form.Select
                  value={robotType}
                  options={[
                    { key: "panda", text: "Panda", value: "panda" },
                    { key: "ur", text: "UR", value: "ur" },
                  ]}
                  onChange={(_, data) => setRobotType(data.value as RobotType)}
                  className={`robot-type-select ${
                    focusedField === "robotType" ? "focus" : ""
                  }`}
                  onFocus={() => handleFieldFocus("robotType")}
                  onBlur={() => setFocusedField(null)}
                />
              </Form.Field>

              <Segment>
                <Header as="h5">基础姿态 (Base Pose)</Header>
                <Form.Field>
                  <label>旋转 (四元数 [w, x, y, z])</label>
                  <Grid columns={4} divided>
                    <Grid.Row>
                      {rotation.map((val, index) => (
                        <Grid.Column key={index}>
                          <input
                            type="number"
                            value={val}
                            step="0.01"
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => handleRotationChange(index, e.target.value)}
                            className={`rotation-input ${
                              focusedField === `rotation-${index}`
                                ? "focus"
                                : ""
                            }`}
                            onFocus={() =>
                              handleFieldFocus(`rotation-${index}`)
                            }
                            onBlur={() => setFocusedField(null)}
                          />
                        </Grid.Column>
                      ))}
                    </Grid.Row>
                  </Grid>
                </Form.Field>
                <Form.Field>
                  <label>平移 (三维向量 [x, y, z])</label>
                  <Grid columns={3} divided>
                    <Grid.Row>
                      {translation.map((val, index) => (
                        <Grid.Column key={index}>
                          <input
                            type="number"
                            value={val}
                            step="0.01"
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => handleTranslationChange(index, e.target.value)}
                            className={`translation-input ${
                              focusedField === `translation-${index}`
                                ? "focus"
                                : ""
                            }`}
                            onFocus={() =>
                              handleFieldFocus(`translation-${index}`)
                            }
                            onBlur={() => setFocusedField(null)}
                          />
                        </Grid.Column>
                      ))}
                    </Grid.Row>
                  </Grid>
                </Form.Field>
              </Segment>
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
              <p>机器人配置已成功更新</p>
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

export default RobotEditor;
