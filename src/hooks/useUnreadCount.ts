import { useEffect, useState } from "react";
import { notificationService } from "../services/notificationService";

export function useUnreadCount(pollIntervalMs = 30000) {
  const [count, setCount] = useState(0);

  async function fetch() {
    try {
      const n = await notificationService.getUnreadCount();
      setCount(n);
    } catch {
      // silently ignore — badge missing is not a fatal error
    }
  }

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, pollIntervalMs);
    return () => clearInterval(id);
  }, [pollIntervalMs]);

  return { count, refresh: fetch };
}
