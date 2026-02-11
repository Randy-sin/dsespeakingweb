"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useCountdown(targetDate: string | null) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const prevTargetRef = useRef<string | null>(null);

  const calculateTimeLeft = useCallback(() => {
    if (!targetDate) return 0;
    const diff = new Date(targetDate).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  }, [targetDate]);

  // Synchronously update when targetDate changes to avoid stale-state issues
  if (targetDate !== prevTargetRef.current) {
    prevTargetRef.current = targetDate;
    const fresh = calculateTimeLeft();
    if (fresh !== timeLeft) {
      setTimeLeft(fresh);
    }
  }

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, [calculateTimeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formatted = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  // Compute isExpired directly from targetDate and Date.now() to avoid stale timeLeft
  const isExpired =
    targetDate !== null && new Date(targetDate).getTime() <= Date.now();

  const progress = targetDate
    ? Math.max(
        0,
        (timeLeft /
          ((new Date(targetDate).getTime() - Date.now() + timeLeft * 1000) /
            1000)) *
          100
      )
    : 0;

  return { timeLeft, minutes, seconds, formatted, isExpired, progress };
}
