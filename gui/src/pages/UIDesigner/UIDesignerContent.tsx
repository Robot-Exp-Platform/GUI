import { FC, useEffect, useState } from "react";
import {
  Button,
  Header,
  Icon,
  Segment,
  Modal,
  Form,
  List,
  Message,
} from "semantic-ui-react";
import { Stage, Layer, Rect } from "react-konva";
import {
  UIDesignerProvider,
  useUIDesigner,
} from "~/components/contexts/UIDesignerContext";
import { UIDesign, UIItem } from "~/types/UI";
import { useProject } from "~/components/contexts/ProjectContext";
import { v4 as uuidv4 } from "uuid";
import {
  TextUIItem,
  RectangleUIItem,
  CircleUIItem,
  TriangleUIItem,
  ImageUIItem,
  CaptureUIItem,
  CameraUIItem,
  ButtonUIItem,
} from "~/components/UIItem";
import {
  TextUIItemEditor,
  ImageUIItemEditor,
  ShapeUIItemEditor,
  CaptureUIItemEditor,
  CameraUIItemEditor,
  ButtonUIItemEditor,
} from "~/components/UIItemEditor";
import { UISidebar } from "./UISidebar";

import "./styles.css";

interface UIDesignerContentProps {
  handleToggleRunMode: () => void;
  isRunMode: boolean;
}

export const UIDesignerContent: FC<UIDesignerContentProps> = ({
  handleToggleRunMode,
  isRunMode,
}) => {
  const { project } = useProject();
  const {
    currentUI,
    currentUIFilePath,
    selectedItem,
    isEditing,
    setCurrentUI,
    setCurrentUIFilePath,
    addItem,
    selectItem,
    saveUIDesign,
  } = useUIDesigner();

  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [showFileModal, setShowFileModal] = useState(true);
  const [newUIName, setNewUIName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateSize = () => {
      const canvasContainer = document.getElementById("ui-canvas-container");
      if (canvasContainer) {
        setStageSize({
          width: canvasContainer.offsetWidth,
          height: canvasContainer.offsetHeight,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (!project || currentUI) return;
    setShowFileModal(true);
  }, [project, currentUI]);

  useEffect(() => {
    // 运行模式下不选择任何组件
    if (isRunMode && selectedItem) {
      selectItem(null);
    }
  }, [isRunMode, selectedItem, selectItem]);

  const handleCanvasClick = (e: any) => {
    if (isRunMode) return; // 运行模式下不允许选择组件

    const targetName = e.target?.getClassName?.() || "";

    if (
      targetName === "Stage" ||
      targetName === "Layer" ||
      (targetName === "Rect" && e.target.attrs?.name === "background")
    ) {
      selectItem(null);
    }
  };

  const handleCreateUI = async () => {
    if (!project) return;

    if (!newUIName.trim()) {
      setError("请输入UI文件名称");
      return;
    }

    try {
      const fileName = `${newUIName.trim()}.ui`;
      const filePath = `${project.projectPath}/${fileName}`;

      const newDesign: UIDesign = {
        id: uuidv4(),
        name: newUIName.trim(),
        items: [],
        width: 800,
        height: 600,
        backgroundColor: "#ffffff",
      };

      const uiFile = project.addUIFile(newUIName.trim(), filePath);

      await project.save();
      await project.saveUIDesign(newDesign, filePath);

      setCurrentUI(newDesign);
      setCurrentUIFilePath(filePath);
      setShowFileModal(false);
    } catch (err) {
      console.error("创建UI文件失败:", err);
      setError("创建UI文件失败");
    }
  };

  const handleSelectUI = async (filePath: string) => {
    if (!project) return;

    try {
      const design = await project.loadUIDesign(filePath);
      if (design) {
        setCurrentUI(design);
        setCurrentUIFilePath(filePath);
        setShowFileModal(false);
      } else {
        setError("加载UI设计失败");
      }
    } catch (err) {
      console.error("加载UI设计失败:", err);
      setError("加载UI设计文件失败");
    }
  };

  const handleAddText = () => {
    addItem({
      type: "text",
      x: 50,
      y: 50,
      width: 200,
      height: 30,
      rotation: 0,
      fill: "#000000",
      text: "新文本",
      fontSize: 16,
      fontFamily: "Arial",
      fontStyle: "normal",
    });
  };

  const handleAddRectangle = () => {
    addItem({
      type: "rectangle",
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
      fill: "#ff0000",
    });
  };

  const handleAddCircle = () => {
    addItem({
      type: "circle",
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
      fill: "#00ff00",
    });
  };

  const handleAddTriangle = () => {
    addItem({
      type: "triangle",
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
      fill: "#0000ff",
    });
  };

  const handleAddImage = async () => {
    try {
      const result = await window.electronAPI.selectImageFile();
      if (result.success && result.filePath) {
        addItem({
          type: "image",
          x: 50,
          y: 50,
          width: 200,
          height: 200,
          rotation: 0,
          fill: "transparent",
          src: result.filePath,
        });
      }
    } catch (error) {
      console.error("选择图片失败:", error);
    }
  };

  const handleAddCapture = () => {
    addItem({
      type: "capture",
      x: 50,
      y: 50,
      width: 320,
      height: 240,
      rotation: 0,
      fill: "#262626",
      windowId: "",
      windowTitle: "",
      hasSignal: false,
      frames: 1, // 默认帧率为每秒1帧
    });
  };

  const handleAddCamera = () => {
    addItem({
      type: "camera",
      x: 50,
      y: 50,
      width: 320,
      height: 240,
      rotation: 0,
      fill: "#262626",
      deviceId: "",
      deviceName: "",
      hasSignal: false,
      frames: 1, // 默认帧率为每秒1帧
    });
  };

  const handleAddButton = () => {
    addItem({
      type: "button",
      x: 50,
      y: 50,
      width: 120,
      height: 40,
      rotation: 0,
      fill: "#2185d0", // 使用蓝色作为默认按钮颜色
      text: "执行任务",
      taskJsonPath: "", // 默认为空，用户可以在编辑器中设置
      port: 6651, // 默认端口为6651
      isRunning: false, // 默认状态为非运行中
    });
  };

  const handleSaveUI = async () => {
    try {
      const success = await saveUIDesign();
      if (!success) {
        setError("保存UI设计失败");
      }
    } catch (err) {
      console.error("保存UI设计失败:", err);
      setError("保存UI设计失败");
    }
  };

  const renderEditor = () => {
    if (!selectedItem || isRunMode) return null;

    switch (selectedItem.type) {
      case "text":
        return <TextUIItemEditor item={selectedItem} />;
      case "image":
        return <ImageUIItemEditor item={selectedItem} />;
      case "capture":
        return <CaptureUIItemEditor item={selectedItem} />;
      case "rectangle":
      case "circle":
      case "triangle":
        return <ShapeUIItemEditor item={selectedItem} />;
      case "camera":
        return <CameraUIItemEditor item={selectedItem} />;
      case "button":
        return <ButtonUIItemEditor item={selectedItem} />;
      default:
        return null;
    }
  };

  const renderItems = () => {
    if (!currentUI) return null;

    const sortedItems = [...currentUI.items].sort(
      (a, b) => a.zIndex - b.zIndex
    );

    return sortedItems.map((item) => {
      switch (item.type) {
        case "text":
          return <TextUIItem key={item.id} item={item} isRunMode={isRunMode} />;
        case "image":
          return (
            <ImageUIItem key={item.id} item={item} isRunMode={isRunMode} />
          );
        case "rectangle":
          return (
            <RectangleUIItem key={item.id} item={item} isRunMode={isRunMode} />
          );
        case "circle":
          return (
            <CircleUIItem key={item.id} item={item} isRunMode={isRunMode} />
          );
        case "triangle":
          return (
            <TriangleUIItem key={item.id} item={item} isRunMode={isRunMode} />
          );
        case "capture":
          return (
            <CaptureUIItem key={item.id} item={item} isRunMode={isRunMode} />
          );
        case "camera":
          return (
            <CameraUIItem key={item.id} item={item} isRunMode={isRunMode} />
          );
        case "button":
          return (
            <ButtonUIItem key={item.id} item={item} isRunMode={isRunMode} />
          );
        default:
          return null;
      }
    });
  };

  const renderFileModal = () => (
    <Modal open={showFileModal} size="small">
      <Modal.Header>选择或创建UI文件</Modal.Header>
      <Modal.Content>
        {error && (
          <Message negative>
            <Message.Header>操作失败</Message.Header>
            <p>{error}</p>
          </Message>
        )}

        <Segment>
          <Header as="h4">创建新UI文件</Header>
          <Form>
            <Form.Input
              label="UI文件名称"
              placeholder="输入名称"
              value={newUIName}
              onChange={(e) => setNewUIName(e.target.value)}
            />
            <Button primary onClick={handleCreateUI}>
              创建
            </Button>
          </Form>
        </Segment>

        {project && project.config.uiFiles.length > 0 && (
          <Segment>
            <Header as="h4">现有UI文件</Header>
            <List divided relaxed>
              {project.config.uiFiles.map((file) => (
                <List.Item key={file.id}>
                  <List.Icon name="file" size="large" verticalAlign="middle" />
                  <List.Content>
                    <List.Header
                      as="a"
                      onClick={() => handleSelectUI(file.path)}
                    >
                      {file.name}
                    </List.Header>
                    <List.Description>{file.path}</List.Description>
                  </List.Content>
                </List.Item>
              ))}
            </List>
          </Segment>
        )}
      </Modal.Content>
    </Modal>
  );

  return (
    <div className="ui-designer-container">
      {renderFileModal()}

      {!isRunMode && (
        <UISidebar
          currentUI={currentUI}
          onAddText={handleAddText}
          onAddRectangle={handleAddRectangle}
          onAddCircle={handleAddCircle}
          onAddTriangle={handleAddTriangle}
          onAddImage={handleAddImage}
          onAddCapture={handleAddCapture}
          onAddCamera={handleAddCamera}
          onAddButton={handleAddButton}
          onSaveUI={handleSaveUI}
          onToggleRunMode={handleToggleRunMode}
        />
      )}

      <div className={`ui-content-area ${isRunMode ? "ui-run-mode" : ""}`}>
        <div id="ui-canvas-container" className="ui-canvas-container">
          {currentUI && (
            <Stage
              width={stageSize.width}
              height={stageSize.height}
              onClick={handleCanvasClick}
            >
              <Layer>
                <Rect
                  width={stageSize.width}
                  height={stageSize.height}
                  fill={currentUI.backgroundColor}
                  name="background"
                />
                {renderItems()}
              </Layer>
            </Stage>
          )}
        </div>

        {isEditing && selectedItem && !isRunMode && (
          <div className="ui-editor-container">
            <Segment>
              <Header as="h4">
                编辑{" "}
                {selectedItem.type === "text"
                  ? "文本"
                  : selectedItem.type === "image"
                  ? "图片"
                  : selectedItem.type === "rectangle"
                  ? "矩形"
                  : selectedItem.type === "circle"
                  ? "圆形"
                  : selectedItem.type === "triangle"
                  ? "三角形"
                  : selectedItem.type === "capture"
                  ? "窗口捕获"
                  : selectedItem.type === "camera"
                  ? "摄像头"
                  : selectedItem.type === "button"
                  ? "按钮"
                  : "组件"}
              </Header>
              {renderEditor()}
            </Segment>
          </div>
        )}
      </div>
    </div>
  );
};
