import { useEffect, useState } from "react";
import { api } from "../api/client";
import { getApiErrorMessage } from "../utils/apiError";

export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);

  const refetch = () => {
    if (!url) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await api.get<T>(url, { signal: controller.signal });
        setData(res.data);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "CanceledError") return;
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();

    return controller;
  };

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    const controller = refetch();
    return () => controller?.abort();
  }, [url]);

  return { data, loading, error, refetch };
}
