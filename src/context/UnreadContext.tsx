import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { notificationService } from "../services/notificationService";

// Shared unread-notifications count so the tab badge and the Notifications screen stay in sync
// (marking all as read clears the badge instantly, instead of waiting for the 30s poll).
interface UnreadCtx {
  count: number;
  refresh: () => void;
  setZero: () => void;
}

const Ctx = createContext<UnreadCtx>({ count: 0, refresh: () => {}, setZero: () => {} });

export const useUnread = () => useContext(Ctx);

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      setCount(await notificationService.getUnreadCount());
    } catch {
      // badge missing is not fatal
    }
  }, []);

  const setZero = useCallback(() => setCount(0), []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [refresh]);

  return <Ctx.Provider value={{ count, refresh, setZero }}>{children}</Ctx.Provider>;
}
