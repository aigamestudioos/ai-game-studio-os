"use client";

import { useEffect, useState } from "react";
import { getSession, login, logout, subscribe, type Session } from "../lib/auth-store";

export function useAuth() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    setSession(getSession());
    return subscribe(() => setSession(getSession()));
  }, []);

  return { session, login, logout };
}
