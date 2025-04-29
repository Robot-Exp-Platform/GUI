import React from "react";
import ReactDOM from "react-dom/client";

const App = () => {
  return (
    <React.StrictMode>
      <div>
        <h1>Hello, World!</h1>
        <p>This is a simple React application.</p>
      </div>
    </React.StrictMode>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(<App />);
