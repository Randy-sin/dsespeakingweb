"use client";

import React from "react";
import { I18nProvider } from "@/components/providers/i18n-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>;
}
