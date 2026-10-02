"use client";

import { useEffect, useState } from "react";
import type { SessionUser } from "./types";

export interface ClientSession {
  user: SessionUser | null;
  role: string | null;
  regionScopes: string[];
  reporterStatus: string | null;
}

const EMPTY: ClientSession = { user: null, role: null, regionScopes: [], reporterStatus: null };

/** Reads the current session from the same-origin session route (client). */
export function useSession() {
  const [session, setSession] = useState<ClientSession>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((body: { success: boolean; data: ClientSession }) => {
        if (active && body.success) setSession(body.data ?? EMPTY);
      })
      .catch(() => undefined)
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { session, loading };
}
