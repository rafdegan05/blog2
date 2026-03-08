"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { languages, type LanguageCode } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-sm btn-circle"
        aria-label="Change language"
      >
        <span className="text-lg">{languages.find((l) => l.code === language)?.flag || "🌐"}</span>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content bg-base-200 rounded-box z-50 w-40 p-2 shadow-xl menu menu-sm"
      >
        {languages.map((lang) => (
          <li key={lang.code}>
            <button
              className={language === lang.code ? "active" : ""}
              onClick={() => setLanguage(lang.code as LanguageCode)}
            >
              <span className="text-base">{lang.flag}</span>
              <span className="text-xs">{lang.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
