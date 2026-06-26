import { useState } from "react";
import { useDebounce } from "./useDebounce";

export function useSearch(delay = 400) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const debouncedQuery = useDebounce(query, delay);

  function reset() {
    setQuery("");
    setCategoryId(null);
  }

  return { query, setQuery, categoryId, setCategoryId, debouncedQuery, reset };
}
