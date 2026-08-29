"use client";

import { useEffect, useRef } from "react";
import { trackProductEvent } from "@/lib/analytics/client";

export function PaperOpenTracker({ contentId }: { contentId: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackProductEvent({
      name: "paper_opened",
      surface: "papers",
      context: "paper-detail",
      contentId,
    });
  }, [contentId]);

  return null;
}
