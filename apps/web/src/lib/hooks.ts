"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { proxy, type ProxyResult } from "./proxy";

export function useApiQuery<T>(key: unknown[], path: string) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const res = await proxy<T>(path);
      if (!res.ok) throw new Error(res.error?.message ?? "Request failed");
      return res.data as T;
    },
  });
}

export function useApiMutation<T, V = unknown>(
  path: string | ((vars: V) => string),
  options: { method?: string; invalidate?: unknown[][] } = {},
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: V) => {
      const p = typeof path === "function" ? path(vars) : path;
      const res: ProxyResult<T> = await proxy<T>(p, {
        method: options.method ?? "POST",
        body: vars,
      });
      if (!res.ok) throw new Error(res.error?.message ?? "Request failed");
      return res.data as T;
    },
    onSuccess: () => {
      for (const key of options.invalidate ?? []) qc.invalidateQueries({ queryKey: key });
    },
  });
}
