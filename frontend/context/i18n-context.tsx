"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  Locale,
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  LOCALE_STORAGE_KEY,
  LOCALE_LABELS,
} from "@/lib/i18n/config";
import enDictionary from "@/lib/i18n/dictionaries/en.json";
import viDictionary from "@/lib/i18n/dictionaries/vi.json";
import { getCookie, setCookie } from "@/lib/cookies";

type Dictionary = typeof enDictionary;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (path: string, paramsOrFallback?: Record<string, string | number> | string, fallback?: string) => string;
  labels: typeof LOCALE_LABELS;
  isReady: boolean;
}

const DICTIONARIES: Record<Locale, Dictionary> = {
  en: enDictionary,
  vi: viDictionary as unknown as Dictionary,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return typeof current === "string" ? current : undefined;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [isReady, setIsReady] = useState(false);

  // Initialize locale from cookie / localStorage on client mount
  useEffect(() => {
    try {
      const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
      const cookieLocale = getCookie(LOCALE_COOKIE_KEY) as Locale | null;

      const detectedLocale =
        (storedLocale && LOCALES.includes(storedLocale) && storedLocale) ||
        (cookieLocale && LOCALES.includes(cookieLocale) && cookieLocale) ||
        DEFAULT_LOCALE;

      setLocaleState(detectedLocale);
      document.documentElement.lang = detectedLocale;
    } catch {
      // Ignore in restrictive storage environments
    } finally {
      setIsReady(true);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    if (!LOCALES.includes(newLocale)) return;
    setLocaleState(newLocale);

    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      setCookie(LOCALE_COOKIE_KEY, newLocale, {
        maxAge: 31536000, // 1 year
        path: "/",
      });
      document.documentElement.lang = newLocale;
    } catch {
      // Ignore
    }
  };

  const toggleLocale = () => {
    const nextLocale: Locale = locale === "en" ? "vi" : "en";
    setLocale(nextLocale);
  };

  const t = useMemo(() => {
    return (
      path: string,
      paramsOrFallback?: Record<string, string | number> | string,
      fallback?: string
    ): string => {
      let params: Record<string, string | number> | undefined;
      let defaultFallback = fallback;

      if (typeof paramsOrFallback === "string") {
        defaultFallback = paramsOrFallback;
      } else if (typeof paramsOrFallback === "object" && paramsOrFallback !== null) {
        params = paramsOrFallback;
      }

      const currentDict = DICTIONARIES[locale] || DICTIONARIES[DEFAULT_LOCALE];
      let val = getNestedValue(currentDict as unknown as Record<string, unknown>, path);

      // Fallback to default dictionary (EN)
      if (val === undefined && locale !== DEFAULT_LOCALE) {
        val = getNestedValue(
          DICTIONARIES[DEFAULT_LOCALE] as unknown as Record<string, unknown>,
          path
        );
      }

      let res = val !== undefined ? val : (defaultFallback ?? path);

      if (params) {
        for (const [k, v] of Object.entries(params)) {
          res = res.replaceAll(`{${k}}`, String(v));
        }
      }

      return res;
    };
  }, [locale]);

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        toggleLocale,
        t,
        labels: LOCALE_LABELS,
        isReady,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

export { useI18n as useTranslation };

