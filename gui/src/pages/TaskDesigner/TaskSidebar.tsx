import { FC, useState, useRef } from "react";
import { Icon, Header, Segment } from "semantic-ui-react";
import { useDrop } from "react-dnd";
import "./styles.css";
import { convRef } from "~/utils";
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
    hover: (item, monitor) => {
      if (!deleteZoneRef.current) {
        return;
      }

      const deleteZoneRect = deleteZoneRef.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();

      if (clientOffset) {
        const overlapX =
          Math.min(clientOffset.x + 15, deleteZoneRect.right) -
          Math.max(clientOffset.x - 15, deleteZoneRect.left);
        const overlapY =
          Math.min(clientOffset.y + 15, deleteZoneRect.bottom) -
          Math.max(clientOffset.y - 15, deleteZoneRect.top);

        setIsHovering(overlapX >= 15 && overlapY >= 15);
      }
    },
    drop: () => {
      if (isHovering) {
        return { deleted: true };
      }
      return undefined;
    },
  });

  return (
    <DeleteZoneContext.Provider
      value={{
        ref: convRef(deleteZoneRef),
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
            <TaskDraggableItem type="robot" name="Panda" specificType="panda" />
            <TaskDraggableItem type="robot" name="UR" specificType="ur" />
          </div>
        </Segment>

        {/* 传感器区域 */}
        <Segment className="sidebar-section">
          <Header as="h4" className="sidebar-header">
            Sensors
          </Header>
          <div className="draggable-items-container">
            <TaskDraggableItem
              type="sensor"
              name="Sensor A"
              specificType="sensor_a"
            />
            <TaskDraggableItem
              type="sensor"
              name="Sensor B"
              specificType="sensor_b"
            />
          </div>
        </Segment>

        {/* 删除区域 */}
        <div
          ref={(el) => {
            drop(el);
            deleteZoneRef.current = el;
          }}
          className={`task-delete-zone ${
            isOver && isHovering ? "hovering" : ""
          }`}
        >
          <Icon name="trash" size="large" />
          <div className="task-delete-zone-text">拖放此处删除</div>
        </div>
      </div>
    </DeleteZoneContext.Provider>
  );
};

export default TaskSidebar;
