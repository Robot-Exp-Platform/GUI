import { useState } from "react";
import React from "react";
import ReactDOM from "react-dom/client";

import { Home, TaskDesigner, UIDesigner } from "./pages";
import { Container } from "semantic-ui-react";
import "semantic-ui-css/semantic.min.css";

const App = () => {
  const [page, setPage] = useState("home");

  const renderPage = () => {
    switch (page) {
      case "home":
        return <Home.Page onNavigate={setPage} />;
      case "TaskDesigner":
        return <TaskDesigner.Page onBack={() => setPage("home")} />;
      case "UIDesigner":
        return <UIDesigner.Page onBack={() => setPage("home")} />;
      default:
        return <div>TODO Error Page</div>;
    }
  };

  return (
    <React.StrictMode>
      <Container style={{minWidth: "100vw"}}>{renderPage()}</Container>
    </React.StrictMode>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(<App />);
