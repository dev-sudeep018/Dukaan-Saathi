import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth.jsx";
import MarketingPage from "./pages/MarketingPage";
import SimulatorPage from "./pages/SimulatorPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

function RequireAuth({ children }) {
  const { isAuthed } = useAuth();
  return isAuthed ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MarketingPage />} />
      <Route path="/simulator" element={<SimulatorPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
