"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  Locale,
  defaultLocale,
  detectBrowserLocale,
  getFlatMessages,
} from "@/lib/i18n/messages";

type I18nContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string, fallback?: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const initial = detectBrowserLocale();
    setLocaleState(initial);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale === "zh-Hant" ? "zh-Hant" : "en";
    }
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("app_locale", next);
    }
  };

  const value = useMemo<I18nContextValue>(() => {
    const dict = getFlatMessages(locale);
    const fallback = getFlatMessages("en");
    const t = (key: string, fb?: string) => dict[key] ?? fallback[key] ?? fb ?? key;
    return { locale, setLocale, t };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
