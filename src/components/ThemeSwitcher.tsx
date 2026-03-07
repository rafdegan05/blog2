"use client";

import { useEffect, useSyncExternalStore } from "react";

const themes = [
  "light",
  "dark",
  "night",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
];

const DEFAULT_THEME = "night";

function subscribeToTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getThemeSnapshot(): string {
  return localStorage.getItem("theme") || DEFAULT_THEME;
}

function getServerSnapshot(): string {
  return DEFAULT_THEME;
}

export default function ThemeSwitcher() {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleChange = (newTheme: string) => {
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    window.dispatchEvent(new StorageEvent("storage", { key: "theme" }));
  };

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
        <span className="hidden sm:inline text-xs">{theme}</span>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content bg-base-200 rounded-box z-50 w-52 p-2 shadow-xl max-h-80 overflow-y-auto menu menu-sm"
      >
        {themes.map((t) => (
          <li key={t}>
            <button className={`${t === theme ? "active" : ""}`} onClick={() => handleChange(t)}>
              <div data-theme={t} className="flex items-center gap-2 w-full">
                <div className="flex gap-0.5">
                  <span className="bg-primary w-2 h-4 rounded-sm" />
                  <span className="bg-secondary w-2 h-4 rounded-sm" />
                  <span className="bg-accent w-2 h-4 rounded-sm" />
                  <span className="bg-neutral w-2 h-4 rounded-sm" />
                </div>
                <span className="text-base-content text-xs capitalize">{t}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
