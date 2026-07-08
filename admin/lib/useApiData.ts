"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError, getStoredToken } from "@/lib/api";

type State<T> = {
  data: T | null;
  loading: boolean;
  error: ApiError | Error | null;
};

export function useApiData<T>(path: string, auth = false, enabled = true) {
  const [state, setState] = useState<State<T>>({
    data: null,
    loading: true,
    error: null
  });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!enabled) {
        setState({ data: null, loading: false, error: null });
        return;
      }

      setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const data = await apiFetch<T>(path, { token: auth ? getStoredToken() : null });
        if (alive) setState({ data, loading: false, error: null });
      } catch (error) {
        if (alive) {
          setState({ data: null, loading: false, error: error as Error });
        }
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [path, auth, enabled, version]);

  return { ...state, reload };
}
