export const PRODUCT_ANALYTICS_OPT_OUT_KEY = "dse-analytics-opt-out:v1";

export type ProductAnalyticsPrivacySignals = {
  doNotTrack?: string | null;
  optOutValue?: string | null;
};

export function shouldTrackProductAnalytics(signals: ProductAnalyticsPrivacySignals): boolean {
  const doNotTrack = signals.doNotTrack?.trim().toLowerCase();
  if (doNotTrack === "1" || doNotTrack === "yes") return false;
  return signals.optOutValue !== "1";
}
