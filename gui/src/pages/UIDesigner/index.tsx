import { FC, useState } from "react";
import { Button, Header, Icon } from "semantic-ui-react";
import { UIDesignerProvider } from "~/components/contexts/UIDesignerContext";

import "./styles.css";
import { UIDesignerContent } from "./UIDesignerContent";

interface UIDesignerProps {
  onBack: () => void;
}

export const Page: FC<UIDesignerProps> = ({ onBack }) => {
  const [isRunMode, setIsRunMode] = useState(false);

  const handleToggleRunMode = () => {
    setIsRunMode(!isRunMode);
  };

  return (
    <UIDesignerProvider>
      <div className="ui-designer-page">
        <Button
          icon
          labelPosition="left"
          onClick={isRunMode ? handleToggleRunMode : onBack}
          className="ui-designer-back-btn"
          color={isRunMode ? "green" : undefined}
        >
          <Icon name={isRunMode ? "edit" : "arrow left"} />
          {isRunMode ? "返回设计模式" : "返回"}
        </Button>

        <Header
          as="h1"
          content={isRunMode ? "界面运行状态" : "界面设计器"}
          textAlign="center"
          className="ui-designer-header"
        />

        <UIDesignerContent
          handleToggleRunMode={handleToggleRunMode}
          isRunMode={isRunMode}
        />
      </div>
    </UIDesignerProvider>
  );
};
