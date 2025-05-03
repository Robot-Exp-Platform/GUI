import React, { FC, useState, useRef } from "react";
import { Icon, Header, Segment } from "semantic-ui-react";
import { useDrop } from "react-dnd";
import "./styles.css";
import { conv_ref } from "~/utils";
import TaskDraggableItem from "~/components/DraggableItem/TaskDraggableItem";
import { DeleteZoneContext } from "~/components/contexts/DeleteZoneContext";

const TaskSidebar: FC = () => {
  const [isHovering, setIsHovering] = useState(false);
  const deleteZoneRef = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop({
    accept: ["TASK", "ROBOT", "SENSOR"],
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
    hover: (item: any, monitor) => {
      if (!deleteZoneRef.current) return;

      const deleteZoneRect = deleteZoneRef.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();

      if (clientOffset) {
        const deleteZoneCenterX =
          (deleteZoneRect.left + deleteZoneRect.right) / 2;
        const deleteZoneCenterY =
          (deleteZoneRect.top + deleteZoneRect.bottom) / 2;

        const overlapX =
          Math.min(clientOffset.x + 15, deleteZoneRect.right) -
          Math.max(clientOffset.x - 15, deleteZoneRect.left);
        const overlapY =
          Math.min(clientOffset.y + 15, deleteZoneRect.bottom) -
          Math.max(clientOffset.y - 15, deleteZoneRect.top);

        setIsHovering(overlapX >= 15 && overlapY >= 15);
      }
    },
    drop: (item: any) => {
      if (isHovering) {
        return { deleted: true };
      }
      return undefined;
    },
  });

  return (
    <DeleteZoneContext.Provider
      value={{
        ref: conv_ref(deleteZoneRef),
        isHovering,
        setIsHovering,
      }}
    >
      <div className="task-sidebar">
        {/* 机器人区域 */}
        <Segment className="sidebar-section">
          <Header as="h4" className="sidebar-header">
            Robot
          </Header>
          <div className="draggable-items-container">
            <TaskDraggableItem type="robot" name="Panda" />
            <TaskDraggableItem type="robot" name="UR" />
          </div>
        </Segment>

        {/* 传感器区域 */}
        <Segment className="sidebar-section">
          <Header as="h4" className="sidebar-header">
            Sensors
          </Header>
          <div className="draggable-items-container">
            <TaskDraggableItem type="sensor" name="Sensor A" />
            <TaskDraggableItem type="sensor" name="Sensor B" />
          </div>
        </Segment>

        {/* 删除区域 */}
        <div
          ref={(el) => {
            drop(el);
            deleteZoneRef.current = el;
          }}
          className="task-delete-zone"
          style={{
            marginTop: "auto",
            backgroundColor: isOver && isHovering ? "#ff6b6b" : "#ffdddd",
            padding: "15px",
            borderRadius: "8px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "default",
            transition: "all 0.2s ease",
          }}
        >
          <Icon
            name="trash"
            size="large"
            style={{
              color: isOver && isHovering ? "#ffffff" : "#ff6b6b",
              transition: "all 0.2s ease",
            }}
          />
          <div
            style={{
              marginLeft: "10px",
              color: isOver && isHovering ? "#ffffff" : "#ff6b6b",
            }}
          >
            拖放此处删除
          </div>
        </div>
      </div>
    </DeleteZoneContext.Provider>
  );
};

export default TaskSidebar;
