import { useEffect, useRef, useState } from "react";
import { getTimeLeft } from "../utils/formatters";

export function useCountdown(endsAt: string, onExpire?: () => void) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(endsAt));
  const expireFired = useRef(false);

  useEffect(() => {
    if (timeLeft.expired && !expireFired.current) {
      expireFired.current = true;
      onExpire?.();
      return;
    }
    const id = setInterval(() => {
      const next = getTimeLeft(endsAt);
      setTimeLeft(next);
      if (next.expired && !expireFired.current) {
        expireFired.current = true;
        onExpire?.();
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return timeLeft;
}
