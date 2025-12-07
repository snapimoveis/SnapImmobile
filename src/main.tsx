import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// 🔥 IMPORTANTE: este caminho é relativo a /src
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
