import { FC } from "react";
import { Button, Header, Icon, Segment } from "semantic-ui-react";
import { useProject } from "~/components/contexts/ProjectContext";

interface ProjectPageProps {
  onNavigate: (page: string) => void;
  onBack: () => void;
}

export const Page: FC<ProjectPageProps> = ({ onNavigate, onBack }) => {
  const { project } = useProject();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        padding: "2rem",
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
        返回主页
      </Button>

      <Header 
        as="h1" 
        content={project?.projectName || "项目页面"} 
        textAlign="center"
        style={{ marginTop: "1rem" }}
      />
      
      <Segment basic textAlign="center" style={{ marginTop: "4rem" }}>
        <Header as="h2" content="请选择要进入的设计器" />
        
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          gap: "2rem",
          marginTop: "3rem"
        }}>
          <Button 
            primary 
            size="large"
            icon="tasks" 
            content="任务设计器" 
            labelPosition="left"
            onClick={() => onNavigate("TaskDesigner")} 
          />
          
          <Button 
            primary 
            size="large"
            icon="paint brush" 
            content="界面设计器" 
            labelPosition="left"
            onClick={() => onNavigate("UIDesigner")} 
          />
        </div>
      </Segment>
    </div>
  );
};