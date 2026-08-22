import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AuthCallback } from "./components/AuthCallback";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element was not found.");

const RootScreen = window.location.pathname === "/auth/callback" ? AuthCallback : App;

createRoot(root).render(
  <StrictMode>
    <RootScreen />
  </StrictMode>,
);
