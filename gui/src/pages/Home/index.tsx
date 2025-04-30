import { FC } from "react";
import { Button, Header } from "semantic-ui-react";

interface HomeProps {
  onNavigate: (page: string) => void;
}

export const Page: FC<HomeProps> = ({ onNavigate }) => {
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
      <Header
        as="h1"
        content="さあ始めましょう。今宵のマスカレードを！"
        textAlign="center"
      />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "10%",
          width: "100%",
        }}
      >
        <Button primary onClick={() => onNavigate("TaskDesigner")}>
          任务设计器
        </Button>
        <div style={{ width: "10%" }}></div>
        <Button primary onClick={() => onNavigate("UIDesigner")}>
          界面设计器
        </Button>
      </div>
    </div>
  );
};
