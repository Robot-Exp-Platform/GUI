import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Button,
  Message,
  Segment,
  TextArea,
  Accordion,
  Icon,
  Dropdown,
  Label,
  Header,
} from "semantic-ui-react";
import { Task } from "~/types/Task";
import { Node, createNode } from "~/types/Node";
import { Robot, Sensor, Project } from "~/types";
import { formatJsonCompact } from "~/utils";
import "./styles.css";

interface TaskEditorProps {
  task: Task;
  open: boolean;
  project: Project;
  onClose: () => void;
  onSave: (updatedTask: Task) => Promise<boolean>;
  checkDuplicateName: (name: string, currentId: number) => boolean;
}

const TaskEditor: React.FC<TaskEditorProps> = ({
  task,
  open,
  project,
  onClose,
  onSave,
  checkDuplicateName,
}) => {
  // 编辑模式状态
  const [isJsonMode, setIsJsonMode] = useState<boolean>(false);

  // 表单编辑模式的状态
  const [name, setName] = useState<string>(task.name);
  const [target, setTarget] = useState<string>("");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [nodeCounter, setNodeCounter] = useState<number>(0);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number | null>(null);

  // 错误状态
  const [targetError, setTargetError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nodeErrors, setNodeErrors] = useState<Record<string, string>>({});

  // 焦点状态
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // JSON编辑模式的状态
  const [jsonText, setJsonText] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // 从项目参数中获取所有可用的机器人和传感器
  const availableRobots = project?.config?.robots || [];
  const availableSensors = project?.config?.sensors || [];

  // 当task属性变化时更新表单状态
  useEffect(() => {
    resetFormToOriginal();
  }, [task, open]);

  // 监听编辑器的打开状态，当关闭后重新打开时清除成功保存提示
  useEffect(() => {
    if (open) {
      // 编辑器重新打开时清除成功保存提示
      setSaveSuccess(false);
      setError(null);
    }
  }, [open]);

  // 重置表单为原始状态
  const resetFormToOriginal = () => {
    setName(task.name);
    try {
      // 将目标对象转换为格式化的 JSON 字符串
      setTarget(JSON.stringify(task.target || [], null, 2));
    } catch (_) {
      setTarget("[]");
    }

    // 设置节点数组和节点计数器
    setNodes(task.nodes || []);
    setNodeCounter(task.nodeCounter || 0);
    setActiveNodeIndex(null);

    // 清除所有错误状态
    setTargetError(null);
    setNameError(null);
    setNodeErrors({});
    setError(null);
    setSaveSuccess(false);

    // 更新JSON文本
    const jsonObj = {
      name: task.name,
      target: task.target || [],
      nodes: task.nodes || [],
      nodeCounter: task.nodeCounter || 0,
    };
    setJsonText(formatJsonCompact(jsonObj));
  };

  // 验证名称
  const validateName = (value: string) => {
    if (!value.trim()) {
      return "名称不能为空";
    } else if (checkDuplicateName(value, task.id)) {
      return "名称已被使用，请使用不同的名称";
    }
    return null;
  };

  // 验证节点名称是否在当前任务内唯一
  const validateNodeName = (
    value: string,
    currentNodeIndex: number
  ): string | null => {
    if (!value.trim()) {
      return "节点名称不能为空";
    }

    // 检查是否与其他节点重名
    const isDuplicate = nodes.some(
      (node, index) => index !== currentNodeIndex && node.name === value
    );

    if (isDuplicate) {
      return "节点名称已在当前任务中使用，请使用不同的名称";
    }

    return null;
  };

  // 验证目标 JSON
  const validateTarget = (jsonString: string): unknown[] | null => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        return null; // 必须是数组
      }
      return parsed;
    } catch (_) {
      return null;
    }
  };

  // 验证节点参数 JSON
  const validateNodeParams = (
    jsonString: string
  ): Record<string, unknown> | null => {
    try {
      const parsed = JSON.parse(jsonString);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        return null; // 必须是对象
      }
      return parsed as Record<string, unknown>;
    } catch (_) {
      return null;
    }
  };

  // 处理焦点事件，清除成功消息但保留错误信息直到用户修改
  const handleFieldFocus = (fieldName: string) => {
    setFocusedField(fieldName);
    // 清除成功消息
    setSaveSuccess(false);

    // 检查是否是节点相关的字段，如果是则清除对应的错误
    if (fieldName.startsWith("node_")) {
      const newNodeErrors = { ...nodeErrors };

      // 如果该字段有错误，删除相应的错误信息
      if (fieldName in newNodeErrors) {
        delete newNodeErrors[fieldName];
        setNodeErrors(newNodeErrors);

        // 如果没有其他错误了，也清除主错误信息
        if (Object.keys(newNodeErrors).length === 0) {
          setError(null);
        }
      }
    }
  };

  // 用户输入名称时的处理函数
  const handleNameChange = (value: string) => {
    setName(value);
    setNameError(null); // 用户修改名称时清除名称错误
  };

  // 更新目标输入
  const handleTargetChange = (value: string) => {
    setTarget(value);
    setTargetError(null); // 用户修改目标时清除目标错误
  };

  // 添加新节点
  const handleAddNode = () => {
    // 增加节点计数器并使用它生成默认节点名称
    const nextCounter = nodeCounter + 1;
    setNodeCounter(nextCounter);

    const newNode = createNode(`节点 ${nextCounter}`);
    setNodes([...nodes, newNode]);
    setActiveNodeIndex(nodes.length);

    // 添加节点后清除提示信息
    setSaveSuccess(false);
  };

  // 删除节点
  const handleDeleteNode = (index: number) => {
    const newNodes = [...nodes];
    newNodes.splice(index, 1);
    setNodes(newNodes);
    setActiveNodeIndex(null);

    // 清除此节点相关的错误
    const newNodeErrors = { ...nodeErrors };
    delete newNodeErrors[`node_name_${index}`];
    delete newNodeErrors[`node_type_${index}`];
    delete newNodeErrors[`node_params_${index}`];
    setNodeErrors(newNodeErrors);
  };

  // 更新节点名称
  const handleNodeNameChange = (index: number, value: string) => {
    const newNodes = [...nodes];
    newNodes[index].name = value;
    setNodes(newNodes);

    // 清除此节点的名称错误
    const newNodeErrors = { ...nodeErrors };
    delete newNodeErrors[`node_name_${index}`];
    setNodeErrors(newNodeErrors);
  };

  // 更新节点类型
  const handleNodeTypeChange = (index: number, value: string) => {
    const newNodes = [...nodes];
    newNodes[index].node_type = value;
    setNodes(newNodes);

    // 清除此节点的类型错误
    const newNodeErrors = { ...nodeErrors };
    delete newNodeErrors[`node_type_${index}`];
    setNodeErrors(newNodeErrors);
  };

  // 更新节点参数
  const handleNodeParamsChange = (index: number, value: string) => {
    // 更新节点的参数文本，不进行JSON解析验证，只保存用户输入的内容
    const newNodes = [...nodes];
    // 保存用户输入的原始文本
    newNodes[index]._paramsText = value;
    setNodes(newNodes);

    // 清除此节点的参数错误
    const newNodeErrors = { ...nodeErrors };
    delete newNodeErrors[`node_params_${index}`];
    setNodeErrors(newNodeErrors);
  };

  // 添加机器人到节点
  const handleAddRobot = (index: number, robotName: string) => {
    const newNodes = [...nodes];
    if (!newNodes[index].robots.includes(robotName)) {
      newNodes[index].robots.push(robotName);
      setNodes(newNodes);
    }
  };

  // 从节点中删除机器人
  const handleRemoveRobot = (index: number, robotName: string) => {
    const newNodes = [...nodes];
    newNodes[index].robots = newNodes[index].robots.filter(
      (name) => name !== robotName
    );
    setNodes(newNodes);
  };

  // 添加传感器到节点
  const handleAddSensor = (index: number, sensorName: string) => {
    const newNodes = [...nodes];
    if (!newNodes[index].sensors.includes(sensorName)) {
      newNodes[index].sensors.push(sensorName);
      setNodes(newNodes);
    }
  };

  // 从节点中删除传感器
  const handleRemoveSensor = (index: number, sensorName: string) => {
    const newNodes = [...nodes];
    newNodes[index].sensors = newNodes[index].sensors.filter(
      (name) => name !== sensorName
    );
    setNodes(newNodes);
  };

  // 保存任务配置
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    setNameError(null);
    setTargetError(null);
    setNodeErrors({});

    try {
      let updatedTask: Task;

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

          // 验证target是数组
          if (
            parsedJson.target !== undefined &&
            !Array.isArray(parsedJson.target)
          ) {
            setError("target必须是一个数组");
            setIsSaving(false);
            return;
          }

          // 验证nodes是数组
          if (
            parsedJson.nodes !== undefined &&
            !Array.isArray(parsedJson.nodes)
          ) {
            setError("nodes必须是一个数组");
            setIsSaving(false);
            return;
          }

          // 验证nodeCounter是数字
          if (
            parsedJson.nodeCounter !== undefined &&
            typeof parsedJson.nodeCounter !== "number"
          ) {
            setError("nodeCounter必须是一个数字");
            setIsSaving(false);
            return;
          }

          // 验证nodes中的每个节点
          if (parsedJson.nodes) {
            // 收集所有节点名称，用于检查重复
            const nodeNames = new Set<string>();

            for (let i = 0; i < parsedJson.nodes.length; i++) {
              const node = parsedJson.nodes[i];

              // 验证node.name
              if (!node.name || typeof node.name !== "string") {
                setError(`节点 ${i + 1}: name必须是一个有效的字符串`);
                setIsSaving(false);
                return;
              }

              // 检查节点名称是否重复
              if (nodeNames.has(node.name)) {
                setError(
                  `节点名称"${node.name}"重复，每个节点必须有唯一的名称`
                );
                setIsSaving(false);
                return;
              }
              nodeNames.add(node.name);

              // 验证node_type
              if (!node.node_type || typeof node.node_type !== "string") {
                setError(`节点 ${i + 1}: node_type必须是一个有效的字符串`);
                setIsSaving(false);
                return;
              }

              // 验证robots是数组
              if (!Array.isArray(node.robots)) {
                setError(`节点 ${i + 1}: robots必须是一个数组`);
                setIsSaving(false);
                return;
              }

              // 验证sensors是数组
              if (!Array.isArray(node.sensors)) {
                setError(`节点 ${i + 1}: sensors必须是一个数组`);
                setIsSaving(false);
                return;
              }

              // 验证params是对象
              if (
                typeof node.params !== "object" ||
                node.params === null ||
                Array.isArray(node.params)
              ) {
                setError(`节点 ${i + 1}: params必须是一个对象`);
                setIsSaving(false);
                return;
              }
            }
          }

          // 检查名称是否重复
          if (checkDuplicateName(parsedJson.name, task.id)) {
            setError("名称已被使用，请使用不同的名称");
            setIsSaving(false);
            return;
          }

          updatedTask = {
            ...task,
            name: parsedJson.name,
            target: parsedJson.target || [],
            nodes: parsedJson.nodes || [],
            nodeCounter: parsedJson.nodeCounter || nodeCounter,
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

        // 验证目标 JSON
        const parsedTarget = validateTarget(target);
        if (parsedTarget === null) {
          setError("无效的 JSON 格式或不是数组");
          setTargetError("无效的 JSON 格式或不是数组");
          setIsSaving(false);
          return;
        }

        // 验证节点
        let hasNodeErrors = false;
        const newNodeErrors: Record<string, string> = {};
        const nodeNames = new Set<string>();

        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];

          // 验证节点名称
          const nodeNameError = validateNodeName(node.name, i);
          if (nodeNameError) {
            newNodeErrors[`node_name_${i}`] = nodeNameError;
            hasNodeErrors = true;
          } else {
            // 检查节点名称是否重复（与validateNodeName不同，这里是在所有节点名称已收集后检查）
            if (nodeNames.has(node.name)) {
              newNodeErrors[`node_name_${i}`] = "节点名称重复";
              hasNodeErrors = true;
            }
            nodeNames.add(node.name);
          }

          // 验证node_type
          if (!node.node_type.trim()) {
            newNodeErrors[`node_type_${i}`] = "节点类型不能为空";
            hasNodeErrors = true;
          }

          // 验证节点参数是否为合法的JSON对象
          let isValid = true;

          try {
            // 如果存在用户输入的文本，尝试解析它
            if (node._paramsText !== undefined) {
              const parsedParams = JSON.parse(node._paramsText);

              if (
                typeof parsedParams !== "object" ||
                parsedParams === null ||
                Array.isArray(parsedParams)
              ) {
                isValid = false;
                newNodeErrors[`node_params_${i}`] = "参数必须是有效的JSON对象";
              } else {
                // 如果解析成功，更新节点的params属性
                node.params = parsedParams;
              }
            } else if (
              typeof node.params !== "object" ||
              node.params === null ||
              Array.isArray(node.params)
            ) {
              // 如果没有用户输入的文本，检查现有的params是否是有效对象
              isValid = false;
              newNodeErrors[`node_params_${i}`] = "参数必须是有效的JSON对象";
            }
          } catch (error) {
            isValid = false;
            newNodeErrors[`node_params_${i}`] = `参数JSON格式无效: ${
              (error as Error).message
            }`;
          }

          if (!isValid) {
            hasNodeErrors = true;
          }
        }

        if (hasNodeErrors) {
          setNodeErrors(newNodeErrors);
          setError("节点配置存在错误，请检查并修正");
          setIsSaving(false);
          return;
        }

        // 创建更新后的任务对象
        updatedTask = {
          ...task,
          name,
          target: parsedTarget,
          nodes,
          nodeCounter, // 保存节点计数器
        };
      }

      // 保存任务配置
      const success = await onSave(updatedTask);

      if (success) {
        setSaveSuccess(true);
        // 清除所有错误状态
        setError(null);
        setNameError(null);
        setTargetError(null);
        setNodeErrors({});

        // 更新表单状态和原始数据
        setName(updatedTask.name);
        setTarget(JSON.stringify(updatedTask.target || [], null, 2));
        setNodes(updatedTask.nodes || []);
        setNodeCounter(updatedTask.nodeCounter || 0);

        // 更新JSON文本
        const jsonObj = {
          name: updatedTask.name,
          target: updatedTask.target,
          nodes: updatedTask.nodes,
          nodeCounter: updatedTask.nodeCounter,
        };
        setJsonText(formatJsonCompact(jsonObj));

        // 更新 task 对象的引用
        task.name = updatedTask.name;
        task.target = updatedTask.target;
        task.nodes = updatedTask.nodes;
        task.nodeCounter = updatedTask.nodeCounter;
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
        name: task.name,
        target: task.target || [],
        nodes: task.nodes || [],
        nodeCounter: task.nodeCounter || 0,
      };
      setJsonText(formatJsonCompact(jsonObj));
      setIsJsonMode(true);
    }
    // 清除之前的错误信息
    setError(null);
    setNameError(null);
    setTargetError(null);
    setNodeErrors({});
    setSaveSuccess(false);
  };

  // 处理键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 检测 Ctrl+S 组合键
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault(); // 阻止浏览器默认的保存页面行为
      handleSave();
    }
  };

  // 渲染节点列表项
  const renderNodeItem = (node: Node, index: number) => {
    const isActive = activeNodeIndex === index;
    const nodeNameError = nodeErrors[`node_name_${index}`];
    const nodeTypeError = nodeErrors[`node_type_${index}`];
    const nodeParamsError = nodeErrors[`node_params_${index}`];

    // 过滤出尚未添加到此节点的机器人和传感器
    const availableRobotsForNode = availableRobots.filter(
      (robot: Robot) => !node.robots.includes(robot.name)
    );
    const availableSensorsForNode = availableSensors.filter(
      (sensor: Sensor) => !node.sensors.includes(sensor.name)
    );

    return (
      <div key={index} className="node-item">
        <Accordion.Title
          active={isActive}
          index={index}
          onClick={() => setActiveNodeIndex(isActive ? null : index)}
        >
          <Icon name="dropdown" />
          {node.name || `节点 ${index + 1}`}
          <Button
            icon="trash"
            size="mini"
            negative
            floated="right"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteNode(index);
            }}
          />
        </Accordion.Title>
        <Accordion.Content active={isActive}>
          <Form.Field error={!!nodeNameError}>
            <label>节点名称</label>
            <input
              value={node.name}
              onChange={(e) => handleNodeNameChange(index, e.target.value)}
              placeholder="输入节点名称"
              onFocus={() => handleFieldFocus(`node_name_${index}`)}
              onBlur={() => setFocusedField(null)}
            />
            {nodeNameError && <div className="error-text">{nodeNameError}</div>}
          </Form.Field>

          <Form.Field error={!!nodeTypeError}>
            <label>节点类型</label>
            <input
              value={node.node_type}
              onChange={(e) => handleNodeTypeChange(index, e.target.value)}
              placeholder="输入节点类型"
              onFocus={() => handleFieldFocus(`node_type_${index}`)}
              onBlur={() => setFocusedField(null)}
            />
            {nodeTypeError && <div className="error-text">{nodeTypeError}</div>}
          </Form.Field>

          <Form.Field>
            <label>机器人</label>
            <div className="tags-container">
              {node.robots.map((robotName, rIndex) => (
                <span key={rIndex} className="node-tag">
                  {robotName}
                  <Icon
                    name="delete"
                    onClick={() => handleRemoveRobot(index, robotName)}
                  />
                </span>
              ))}
            </div>
            <Button
              icon="add"
              content={
                availableRobotsForNode.length > 0
                  ? "添加机器人"
                  : "当前无可用机器人"
              }
              disabled={availableRobotsForNode.length === 0}
              onClick={(e) => {
                e.preventDefault();
                if (availableRobotsForNode.length > 0) {
                  // 显示下拉菜单
                  const dropdown = document.getElementById(
                    `robot-dropdown-${index}`
                  );
                  if (dropdown) dropdown.click();
                }
                // 点击按钮时也清除提示信息
                handleFieldFocus(`robots_${index}`);
              }}
            />
            <Dropdown
              id={`robot-dropdown-${index}`}
              style={{ display: "none" }}
              icon={null}
              floating
              className="icon"
            >
              <Dropdown.Menu>
                {availableRobotsForNode.map((robot: Robot) => (
                  <Dropdown.Item
                    key={robot.id}
                    text={robot.name}
                    onClick={() => {
                      handleAddRobot(index, robot.name);
                      // 选择机器人时也清除提示信息
                      handleFieldFocus(`robots_${index}`);
                    }}
                  />
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Form.Field>

          <Form.Field>
            <label>传感器</label>
            <div className="tags-container">
              {node.sensors.map((sensorName, sIndex) => (
                <span key={sIndex} className="node-tag">
                  {sensorName}
                  <Icon
                    name="delete"
                    onClick={() => handleRemoveSensor(index, sensorName)}
                  />
                </span>
              ))}
            </div>
            <Button
              icon="add"
              content={
                availableSensorsForNode.length > 0
                  ? "添加传感器"
                  : "当前无可用传感器"
              }
              disabled={availableSensorsForNode.length === 0}
              onClick={(e) => {
                e.preventDefault();
                if (availableSensorsForNode.length > 0) {
                  // 显示下拉菜单
                  const dropdown = document.getElementById(
                    `sensor-dropdown-${index}`
                  );
                  if (dropdown) dropdown.click();
                }
                // 点击按钮时也清除提示信息
                handleFieldFocus(`sensors_${index}`);
              }}
            />
            <Dropdown
              id={`sensor-dropdown-${index}`}
              style={{ display: "none" }}
              icon={null}
              floating
              className="icon"
            >
              <Dropdown.Menu>
                {availableSensorsForNode.map((sensor: Sensor) => (
                  <Dropdown.Item
                    key={sensor.id}
                    text={sensor.name}
                    onClick={() => {
                      handleAddSensor(index, sensor.name);
                      // 选择传感器时也清除提示信息
                      handleFieldFocus(`sensors_${index}`);
                    }}
                  />
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Form.Field>

          <Form.Field error={!!nodeParamsError}>
            <label>参数 (JSON)</label>
            <TextArea
              placeholder="{}"
              value={
                node._paramsText !== undefined
                  ? node._paramsText
                  : JSON.stringify(node.params, null, 2)
              }
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleNodeParamsChange(index, e.target.value)
              }
              className="node-params-textarea"
              spellCheck={false}
              onFocus={() => handleFieldFocus(`node_params_${index}`)}
              onBlur={() => setFocusedField(null)}
            />
            {nodeParamsError && (
              <div className="error-text">{nodeParamsError}</div>
            )}
          </Form.Field>
        </Accordion.Content>
      </div>
    );
  };

  return (
    <Modal open={open} onClose={onClose} size="small">
      <Modal.Header>
        编辑任务配置
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
                className={`editor-json-textarea-task ${
                  focusedField === "jsonText" ? "focus" : ""
                }`}
                spellCheck={false}
                onFocus={() => handleFieldFocus("jsonText")}
                onBlur={() => setFocusedField(null)}
                onKeyDown={handleKeyDown}
              />
            </Form>
          ) : (
            <Form>
              <Form.Input label="ID" value={task.id} readOnly />
              <p className="editor-id-hint">任务 ID 不能被修改</p>
              <Form.Field
                error={
                  nameError ? { content: nameError, pointing: "above" } : false
                }
              >
                <label>名称</label>
                <input
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleNameChange(e.target.value)
                  }
                  onFocus={() => handleFieldFocus("name")}
                  onBlur={() => setFocusedField(null)}
                />
              </Form.Field>

              <Form.Field
                error={
                  targetError
                    ? { content: targetError, pointing: "above" }
                    : false
                }
              >
                <label>目标 (JSON数组)</label>
                <TextArea
                  placeholder="[]"
                  value={target}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleTargetChange(e.target.value)
                  }
                  className={`target-textarea ${
                    focusedField === "target" ? "focus" : ""
                  }`}
                  spellCheck={false}
                  onFocus={() => handleFieldFocus("target")}
                  onBlur={() => setFocusedField(null)}
                />
              </Form.Field>

              <Segment>
                <Header as="h5">
                  节点配置
                  <Button
                    icon="add"
                    content="添加节点"
                    size="mini"
                    primary
                    floated="right"
                    onClick={handleAddNode}
                    style={{ marginTop: "-5px" }}
                  />
                </Header>
                <Accordion fluid styled className="nodes-accordion">
                  {nodes.map((node, index) => renderNodeItem(node, index))}
                  {nodes.length === 0 && (
                    <div className="no-nodes-message">
                      还没有节点，点击"添加节点"按钮创建一个新节点
                    </div>
                  )}
                </Accordion>
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
              <p>任务配置已成功更新</p>
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

export default TaskEditor;
