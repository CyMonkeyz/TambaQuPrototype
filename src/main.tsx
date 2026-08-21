import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";
import { AppErrorBoundary } from "./components/common/AppErrorBoundary";
import { prepareDevelopmentServiceWorkerSafety } from "./services/pwa/devServiceWorkerSafety";
import "./styles/global.css";

async function bootstrap() {
  await prepareDevelopmentServiceWorkerSafety();
  const root = document.getElementById("root");
  if (!root) throw new Error("Elemen root TambaQu tidak ditemukan.");
  createRoot(root).render(
    <StrictMode>
      <AppErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppErrorBoundary>
    </StrictMode>,
  );
}

void bootstrap();
