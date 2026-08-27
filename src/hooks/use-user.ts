"use client";

import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import type { Profile } from "@/lib/supabase/types";

type SupabaseBrowserClient = ReturnType<typeof createClient>;

type UserContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  supabase: SupabaseBrowserClient;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;

    const loadProfile = async (nextUser: User | null) => {
      if (!nextUser) {
        if (active) setProfile(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", nextUser.id)
        .maybeSingle();
      if (active) setProfile(data);
    };

    const bootstrap = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;

      if (!session) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const {
        data: { user: verifiedUser },
      } = await supabase.auth.getUser();
      if (!active) return;

      setUser(verifiedUser);
      await loadProfile(verifiedUser);
      if (active) setLoading(false);
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setLoading(false);
      window.queueMicrotask(() => void loadProfile(nextUser));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return createElement(
    UserContext.Provider,
    { value: { user, profile, loading, supabase } },
    children,
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used inside UserProvider");
  return context;
}
