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
} from "~/components/UIItem";
import {
  TextUIItemEditor,
  ImageUIItemEditor,
  ShapeUIItemEditor,
  CaptureUIItemEditor,
} from "~/components/UIItemEditor";

import "./styles.css";

interface UIDesignerProps {
  onBack: () => void;
}

const UIDesignerContent: FC = () => {
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

  const handleCanvasClick = (e: any) => {
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
    if (!selectedItem) return null;

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
          return <TextUIItem key={item.id} item={item} />;
        case "image":
          return <ImageUIItem key={item.id} item={item} />;
        case "rectangle":
          return <RectangleUIItem key={item.id} item={item} />;
        case "circle":
          return <CircleUIItem key={item.id} item={item} />;
        case "triangle":
          return <TriangleUIItem key={item.id} item={item} />;
        case "capture":
          return <CaptureUIItem key={item.id} item={item} />;
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

      <div className="ui-components-sidebar">
        <Segment>
          <Header as="h3">组件列表</Header>
          <List divided relaxed>
            <List.Item as="a" onClick={handleAddText}>
              <List.Icon name="font" size="large" verticalAlign="middle" />
              <List.Content>
                <List.Header>文本</List.Header>
                <List.Description>添加文本框</List.Description>
              </List.Content>
            </List.Item>
            <List.Item as="a" onClick={handleAddImage}>
              <List.Icon name="image" size="large" verticalAlign="middle" />
              <List.Content>
                <List.Header>图片</List.Header>
                <List.Description>添加图片</List.Description>
              </List.Content>
            </List.Item>
            <List.Item as="a" onClick={handleAddRectangle}>
              <List.Icon
                name="square outline"
                size="large"
                verticalAlign="middle"
              />
              <List.Content>
                <List.Header>矩形</List.Header>
                <List.Description>添加矩形</List.Description>
              </List.Content>
            </List.Item>
            <List.Item as="a" onClick={handleAddCircle}>
              <List.Icon
                name="circle outline"
                size="large"
                verticalAlign="middle"
              />
              <List.Content>
                <List.Header>圆形</List.Header>
                <List.Description>添加圆形</List.Description>
              </List.Content>
            </List.Item>
            <List.Item as="a" onClick={handleAddTriangle}>
              <List.Icon name="caret up" size="large" verticalAlign="middle" />
              <List.Content>
                <List.Header>三角形</List.Header>
                <List.Description>添加三角形</List.Description>
              </List.Content>
            </List.Item>
            <List.Item as="a" onClick={handleAddCapture}>
              <List.Icon name="desktop" size="large" verticalAlign="middle" />
              <List.Content>
                <List.Header>窗口捕获</List.Header>
                <List.Description>添加窗口捕获</List.Description>
              </List.Content>
            </List.Item>
          </List>
        </Segment>

        <Button
          primary
          fluid
          onClick={handleSaveUI}
          disabled={!currentUI}
          style={{ marginTop: "1rem" }}
        >
          <Icon name="save" />
          保存设计
        </Button>
      </div>

      <div className="ui-content-area">
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

        {isEditing && selectedItem && (
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

export const Page: FC<UIDesignerProps> = ({ onBack }) => {
  return (
    <UIDesignerProvider>
      <div className="ui-designer-page">
        <Button
          icon
          labelPosition="left"
          onClick={onBack}
          className="ui-designer-back-btn"
        >
          <Icon name="arrow left" />
          返回
        </Button>

        <Header
          as="h1"
          content="界面设计器"
          textAlign="center"
          className="ui-designer-header"
        />

        <UIDesignerContent />
      </div>
    </UIDesignerProvider>
  );
};
