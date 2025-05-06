import React, { useState } from "react";
import ReactDOM from "react-dom/client";

import { Home, TaskDesigner, UIDesigner, ProjectPage } from "~/pages";
import { Container } from "semantic-ui-react";
import { ProjectProvider } from "~/components/contexts/ProjectContext";

const App = () => {
  const [page, setPage] = useState("home");

  const renderPage = () => {
    switch (page) {
    case "home":
      return <Home.Page onNavigate={setPage} />;
    case "ProjectPage":
      return <ProjectPage.Page onNavigate={setPage} onBack={() => setPage("home")} />;
    case "TaskDesigner":
      return <TaskDesigner.Page onBack={() => setPage("ProjectPage")} />;
    case "UIDesigner":
      return <UIDesigner.Page onBack={() => setPage("ProjectPage")} />;
    default:
      return <div>TODO Error Page</div>;
    }
  };

  return (
    <React.StrictMode>
      <ProjectProvider>
        <Container style={{ minWidth: "100vw" }}>{renderPage()}</Container>
      </ProjectProvider>
    </React.StrictMode>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(<App />);
