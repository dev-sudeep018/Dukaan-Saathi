import { useState, useEffect } from "react";

function applyLightTheme() {
  if (typeof window === "undefined") return;

  const root = window.document.documentElement;
  root.classList.remove("dark");
  root.style.colorScheme = "light";
  localStorage.setItem("dukaan_theme", "light");
  localStorage.setItem("dukaan_theme_explicit", "light");
}

export function useTheme() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    applyLightTheme();
  }, []);

  const toggleTheme = () => {
    applyLightTheme();
    setTheme("light");
  };

  return { theme, toggleTheme, setTheme };
}
