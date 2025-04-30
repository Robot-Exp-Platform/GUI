import { FC, useState } from "react";
import { Button, Header, Icon } from "semantic-ui-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import TaskSidebar from "./TaskSidebar";
import TaskMainTop from "./TaskMainTop";
import TaskMainBottom from "./TaskMainBottom";

import DraggableDivider from "~/components/DraggableDivider";
import "./styles.css";

interface TaskDesignerProps {
  onBack: () => void;
}

export const Page: FC<TaskDesignerProps> = ({ onBack }) => {
  const [topHeight, setTopHeight] = useState(200);

  const handleDividerDrag = (deltaY: number) => {
    console.log("Dragging divider", deltaY);
    setTopHeight((prev) => Math.max(100, prev + deltaY));
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
        content="任务设计器"
        textAlign="center"
        className="task-designer-header"
      />
      <DndProvider backend={HTML5Backend}>
        <div className="task-designer-main">
          <TaskSidebar />
          <div className="task-designer-main-content">
            <div style={{ height: `${topHeight}px`, overflow: "auto" }}>
              <TaskMainTop />
            </div>
            <DraggableDivider onDrag={handleDividerDrag} />
            <div style={{ flex: 1, overflow: "visible" }}>
              <TaskMainBottom />
            </div>
          </div>
        </div>
      </DndProvider>
    </div>
  );
};
