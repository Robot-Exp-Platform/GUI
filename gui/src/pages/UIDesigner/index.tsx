import { FC } from "react";
import { Button, Header, Icon } from "semantic-ui-react";

interface UIDesignerProps {
  onBack: () => void;
}

export const Page: FC<UIDesignerProps> = ({ onBack }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Button
        icon
        labelPosition="left"
        onClick={onBack}
        style={{
          position: "absolute",
          top: "1rem",
          left: "1rem",
        }}
      >
        <Icon name="arrow left" />
        返回
      </Button>
      <Header as="h1" content="界面设计器" textAlign="center" />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "10%",
          width: "100%",
        }}
      ></div>
    </div>
  );
};
