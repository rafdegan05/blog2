export { en, type Translations } from "./en";
export { it } from "./it";

export const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
] as const;

export type LanguageCode = (typeof languages)[number]["code"];

export const DEFAULT_LANGUAGE: LanguageCode = "en";
