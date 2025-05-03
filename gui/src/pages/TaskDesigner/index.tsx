import { FC, useState } from "react";
import { Button, Header, Icon } from "semantic-ui-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import TaskSidebar from "./TaskSidebar";
import ConfigArea from "./ConfigArea";
import TaskArea from "./TaskArea";

import DraggableDivider from "~/components/DraggableDivider";
import { useProject } from "~/components/contexts/ProjectContext";
import "./styles.css";

interface TaskDesignerProps {
  onBack: () => void;
}

export const Page: FC<TaskDesignerProps> = ({ onBack }) => {
  const { project } = useProject();
  const [topHeight, setTopHeight] = useState(250); // 将初始高度从200px修改为250px

  const handleDividerDrag = (deltaY: number) => {
    // 配置区最小高度为 250px
    setTopHeight((prev) => {
      const newHeight = prev + deltaY;
      // 确保高度不低于 250px
      return Math.max(250, newHeight);
    });
  };

  return (
    <div className="task-designer-page">
      <Button
        icon
        labelPosition="left"
        onClick={onBack}
        className="task-designer-back-btn"
      >
        <Icon name="arrow left" />
        返回
      </Button>
      <Header
        as="h1"
        content={project?.projectName || "任务设计器"}
        textAlign="center"
        className="task-designer-header"
      />
      <DndProvider backend={HTML5Backend}>
        <div className="task-designer-main">
          <TaskSidebar />
          <div className="task-designer-main-content">
            <div style={{ height: `${topHeight}px`, overflow: "auto" }}>
              <ConfigArea />
            </div>
            <DraggableDivider onDrag={handleDividerDrag} />
            <div style={{ flex: 1, overflow: "visible" }}>
              <TaskArea />
            </div>
          </div>
        </div>
      </DndProvider>
    </div>
  );
};
