import { useEffect, useState } from "react";

/** Seconds left until zero. Call `start(n)` to (re)start; returns 0 when idle. */
export function useCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  return { secondsLeft, start: (seconds: number) => setSecondsLeft(Math.max(0, Math.ceil(seconds))) };
}
