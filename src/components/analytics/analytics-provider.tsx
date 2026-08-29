"use client";

import { useEffect } from "react";
import {
  Analytics,
  type BeforeSendEvent,
} from "@vercel/analytics/react";
import { PRODUCT_ANALYTICS_OPT_OUT_KEY } from "../../lib/analytics/privacy";
import { disableProductAnalyticsSession, trackProductEvent } from "../../lib/analytics/client";
import type { ProductEventSurface } from "../../lib/analytics/events";

export const ANALYTICS_OPT_OUT_KEY = PRODUCT_ANALYTICS_OPT_OUT_KEY;

export function hasAnalyticsOptOut(storage: Pick<Storage, "getItem">): boolean {
  try {
    return storage.getItem(ANALYTICS_OPT_OUT_KEY) === "1";
  } catch {
    return true;
  }
}

export function shouldBlockAnalytics(
  doNotTrack: string | null | undefined,
  storage: Pick<Storage, "getItem">,
): boolean {
  const normalizedDoNotTrack = doNotTrack?.trim().toLowerCase();
  return normalizedDoNotTrack === "1" || normalizedDoNotTrack === "yes" || hasAnalyticsOptOut(storage);
}

export function sanitizeAnalyticsUrl(rawUrl: string, fallbackUrl: string): string {
  try {
    const url = new URL(rawUrl, fallbackUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    const fallback = new URL(fallbackUrl);
    return `${fallback.origin}${fallback.pathname}`;
  }
}

export function isPrivateAnalyticsPath(rawUrl: string, fallbackUrl: string): boolean {
  try {
    return new URL(rawUrl, fallbackUrl).pathname.startsWith("/admin/");
  } catch {
    return true;
  }
}

export function surfaceForPath(pathname: string): ProductEventSurface | undefined {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/onboarding")) return "onboarding";
  if (pathname.startsWith("/papers")) return "papers";
  if (pathname.startsWith("/learn")) return "learn";
  if (pathname.startsWith("/practice")) return "practice";
  if (pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/auth")) return "auth";
  return undefined;
}

export function filterAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  if (typeof window === "undefined") return null;
  if (shouldBlockAnalytics(navigator.doNotTrack, window.localStorage)) return null;

  if (isPrivateAnalyticsPath(event.url, window.location.href)) return null;

  return {
    ...event,
    url: sanitizeAnalyticsUrl(event.url, window.location.href),
  };
}

export function AnalyticsProvider() {
  useEffect(() => {
    if (shouldBlockAnalytics(navigator.doNotTrack, window.localStorage)) {
      void disableProductAnalyticsSession();
      return;
    }
    if (window.location.pathname.startsWith("/admin/")) return;
    trackProductEvent({
      name: "site_session_started",
      surface: surfaceForPath(window.location.pathname),
      context: "navigation",
    });
  }, []);

  return <Analytics beforeSend={filterAnalyticsEvent} />;
}
