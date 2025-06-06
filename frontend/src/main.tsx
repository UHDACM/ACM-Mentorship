import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./tailwind_out.css";
import "./index.css";
import AppRouting from "./AppRouting.tsx";
import AuthProvider from "./features/Auth/AuthProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <AppRouting />
    </AuthProvider>
  </StrictMode>
);
