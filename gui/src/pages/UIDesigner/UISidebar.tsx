import { FC } from "react";
import { Button, Header, Icon, List, Segment } from "semantic-ui-react";
import { UIDesign } from "~/types/UI";

interface UISidebarProps {
  currentUI: UIDesign | null;
  onAddText: () => void;
  onAddRectangle: () => void;
  onAddCircle: () => void;
  onAddTriangle: () => void;
  onAddImage: () => void;
  onAddCapture: () => void;
  onAddCamera: () => void;
  onSaveUI: () => void;
  onToggleRunMode: () => void;
}

export const UISidebar: FC<UISidebarProps> = ({
  currentUI,
  onAddText,
  onAddRectangle,
  onAddCircle,
  onAddTriangle,
  onAddImage,
  onAddCapture,
  onAddCamera,
  onSaveUI,
  onToggleRunMode,
}) => {
  return (
    <div className="ui-components-sidebar">
      <Segment>
        <Header as="h3">组件列表</Header>
        <List divided relaxed>
          <List.Item as="a" onClick={onAddText}>
            <List.Icon name="font" size="large" verticalAlign="middle" />
            <List.Content>
              <List.Header>文本</List.Header>
              <List.Description>添加文本框</List.Description>
            </List.Content>
          </List.Item>
          <List.Item as="a" onClick={onAddImage}>
            <List.Icon name="image" size="large" verticalAlign="middle" />
            <List.Content>
              <List.Header>图片</List.Header>
              <List.Description>添加图片</List.Description>
            </List.Content>
          </List.Item>
          <List.Item as="a" onClick={onAddRectangle}>
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
          <List.Item as="a" onClick={onAddCircle}>
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
          <List.Item as="a" onClick={onAddTriangle}>
            <List.Icon name="caret up" size="large" verticalAlign="middle" />
            <List.Content>
              <List.Header>三角形</List.Header>
              <List.Description>添加三角形</List.Description>
            </List.Content>
          </List.Item>
          <List.Item as="a" onClick={onAddCapture}>
            <List.Icon name="desktop" size="large" verticalAlign="middle" />
            <List.Content>
              <List.Header>窗口捕获</List.Header>
              <List.Description>添加窗口捕获</List.Description>
            </List.Content>
          </List.Item>
          <List.Item as="a" onClick={onAddCamera}>
            <List.Icon
              name="video camera"
              size="large"
              verticalAlign="middle"
            />
            <List.Content>
              <List.Header>摄像头</List.Header>
              <List.Description>添加摄像头捕获</List.Description>
            </List.Content>
          </List.Item>
        </List>
      </Segment>

      <Button
        primary
        fluid
        onClick={onSaveUI}
        disabled={!currentUI}
        style={{ marginTop: "1rem" }}
      >
        <Icon name="save" />
        保存设计
      </Button>

      <Button
        color="green"
        fluid
        onClick={onToggleRunMode}
        disabled={!currentUI}
        style={{ marginTop: "1rem" }}
      >
        <Icon name="play" />
        进入运行状态
      </Button>
    </div>
  );
};
