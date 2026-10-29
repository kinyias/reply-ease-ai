export type Locale = "en" | "vi";

export const LOCALES: Locale[] = ["en", "vi"];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, { label: string; short: string; flag: string }> = {
  en: {
    label: "English",
    short: "EN",
    flag: "🇺🇸",
  },
  vi: {
    label: "Tiếng Việt",
    short: "VI",
    flag: "🇻🇳",
  },
};

export const LOCALE_COOKIE_KEY = "NEXT_LOCALE";
export const LOCALE_STORAGE_KEY = "replyease_locale";

