"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { en, type Translations } from "@/lib/i18n/en";
import { it } from "@/lib/i18n/it";
import { DEFAULT_LANGUAGE, type LanguageCode } from "@/lib/i18n";

const translations: Record<LanguageCode, Translations> = { en, it };

function subscribeToLanguage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getLanguageSnapshot(): LanguageCode {
  return (localStorage.getItem("language") as LanguageCode) || DEFAULT_LANGUAGE;
}

function getServerSnapshot(): LanguageCode {
  return DEFAULT_LANGUAGE;
}

interface LanguageContextType {
  language: LanguageCode;
  t: Translations;
  setLanguage: (lang: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: DEFAULT_LANGUAGE,
  t: en,
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerSnapshot
  );
  const t = translations[language] || en;

  useEffect(() => {
    document.documentElement.setAttribute("lang", language);
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    localStorage.setItem("language", lang);
    document.documentElement.setAttribute("lang", lang);
    window.dispatchEvent(new StorageEvent("storage", { key: "language" }));
  };

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
