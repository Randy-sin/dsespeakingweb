"use client";

import {
  createProductEventEnvelope,
  type ProductEvent,
} from "./events";
import {
  PRODUCT_ANALYTICS_OPT_OUT_KEY,
  shouldTrackProductAnalytics,
} from "./privacy";
import {
  MAX_PRODUCT_EVENT_BODY_BYTES,
  PRODUCT_ANALYTICS_HEADER,
  PRODUCT_ANALYTICS_HEADER_VALUE,
} from "./request";

const ANALYTICS_ENDPOINT = "/api/analytics/events";
let deliveryQueue: Promise<void> = Promise.resolve();
let deliveryGeneration = 0;

function enqueueDelivery<T>(delivery: () => Promise<T>): Promise<T> {
  const result = deliveryQueue.then(delivery, delivery);
  deliveryQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function getPrivacySignals() {
  let optOutValue: string | null = null;
  try {
    optOutValue = window.localStorage.getItem(PRODUCT_ANALYTICS_OPT_OUT_KEY);
  } catch {
    optOutValue = "1";
  }

  return {
    doNotTrack: navigator.doNotTrack,
    optOutValue,
  };
}

export function trackProductEvent(event: ProductEvent): void {
  if (typeof window === "undefined") return;

  try {
    if (!shouldTrackProductAnalytics(getPrivacySignals())) return;

    const envelope = createProductEventEnvelope(event, crypto.randomUUID());
    if (!envelope) return;

    const body = JSON.stringify(envelope);
    if (new TextEncoder().encode(body).byteLength > MAX_PRODUCT_EVENT_BODY_BYTES) return;
    const queuedGeneration = deliveryGeneration;

    // Serialize delivery so the first response can establish the HttpOnly
    // session before any same-page follow-up event is sent.
    void enqueueDelivery(async () => {
      // Privacy preferences may change while an event is waiting behind an
      // earlier request. Never send a stale queued event after an opt-out.
      if (
        queuedGeneration !== deliveryGeneration ||
        !shouldTrackProductAnalytics(getPrivacySignals())
      ) {
        return;
      }

      await fetch(ANALYTICS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [PRODUCT_ANALYTICS_HEADER]: PRODUCT_ANALYTICS_HEADER_VALUE,
        },
        body,
        cache: "no-store",
        credentials: "same-origin",
        keepalive: true,
        referrerPolicy: "no-referrer",
      });
    }).catch(() => undefined);
  } catch {
    // Analytics must never interrupt speaking, recording, auth, or AI flows.
  }
}

export async function disableProductAnalyticsSession(): Promise<boolean> {
  // Invalidate deliveries that have not started, then append DELETE to the
  // same queue. A POST already in flight must finish before the server clears
  // the session cookie, so it cannot recreate that cookie after DELETE.
  deliveryGeneration += 1;

  try {
    const response = await enqueueDelivery(() => {
      return fetch(ANALYTICS_ENDPOINT, {
        method: "DELETE",
        headers: {
          [PRODUCT_ANALYTICS_HEADER]: PRODUCT_ANALYTICS_HEADER_VALUE,
        },
        cache: "no-store",
        credentials: "same-origin",
        keepalive: true,
        referrerPolicy: "no-referrer",
      });
    });
    return response.ok;
  } catch {
    return false;
  }
}
