import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { getApiErrorMessage } from "../utils/apiError";
import type { PageResponse } from "../types";

export function usePaginatedFetch<T>(baseUrl: string, pageSize = 10) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    async (pageNum: number, reset = false) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (reset) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const url = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}page=${pageNum}&size=${pageSize}`;
        const res = await api.get<PageResponse<T>>(url, {
          signal: controller.signal,
        });
        const data = res.data;
        setTotalPages(data.totalPages);
        setItems((prev) => (reset ? data.content : [...prev, ...data.content]));
        setPage(pageNum);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "CanceledError") return;
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [baseUrl, pageSize]
  );

  useEffect(() => {
    fetchPage(0, true);
    return () => abortRef.current?.abort();
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loadingMore && page + 1 < totalPages) fetchPage(page + 1);
  }, [loadingMore, page, totalPages, fetchPage]);

  const refresh = useCallback(() => fetchPage(0, true), [fetchPage]);

  return { items, loading, loadingMore, error, loadMore, refresh, totalPages, page };
}
