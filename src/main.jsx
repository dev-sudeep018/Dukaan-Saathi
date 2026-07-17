import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./i18n";
import { AuthProvider } from "./lib/auth.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import App from "./App.jsx";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-shopfront border-t-leaf" />
        <span className="font-display text-lg font-bold text-shopfront">Dukaan Saathi</span>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Suspense fallback={<LoadingScreen />}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </Suspense>
  </StrictMode>,
);
