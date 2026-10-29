import { Locale, DEFAULT_LOCALE } from "./config";

export * from "./config";

export const dictionaries = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  vi: () => import("./dictionaries/vi.json").then((m) => m.default),
};

export const hasLocale = (locale: string): locale is Locale => {
  return locale === "en" || locale === "vi";
};

export const getDictionary = async (locale: Locale = DEFAULT_LOCALE) => {
  const loader = dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
  return loader();
};

