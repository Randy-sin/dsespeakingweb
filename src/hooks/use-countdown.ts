"use client";

import { useState, useEffect, useCallback } from "react";

export function useCountdown(targetDate: string | null) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const calculateTimeLeft = useCallback(() => {
    if (!targetDate) return 0;
    const diff = new Date(targetDate).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  }, [targetDate]);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [calculateTimeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formatted = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
  const isExpired = timeLeft <= 0 && targetDate !== null;
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
