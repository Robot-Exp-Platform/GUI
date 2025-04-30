import { FC } from "react";
import { Divider } from "semantic-ui-react";
import { useDrag } from "react-dnd";
import "./styles.css";

interface DraggableDividerProps {
  onDrag: (deltaY: number) => void;
}

const DraggableDivider: FC<DraggableDividerProps> = ({ onDrag }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "DIVIDER",
    item: {},
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (delta) {
        onDrag(delta.y);
      }
    },
  }));

  return (
    <div
      ref={drag as unknown as React.RefObject<HTMLDivElement>}
      style={{
        cursor: "row-resize",
        padding: "8px 0",
        margin: "-8px 0",
      }}
    >
      <Divider
        className="task-designer-divider"
        style={{
          backgroundColor: isDragging ? "#2185d0" : undefined,
          opacity: isDragging ? 0.8 : 1,
        }}
      />
    </div>
  );
};

export default DraggableDivider;