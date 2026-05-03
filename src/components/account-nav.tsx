"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import { LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Locale } from "@/lib/i18n";

export function AccountNav({ label = "Account", locale }: { label?: string; locale: Locale }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;

    async function loadUser() {
      const { data } = await client.auth.getUser();
      const user = data.user;
      setEmail(user?.email ?? null);

      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data: profile } = await client
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      setIsAdmin(Boolean(profile?.is_admin));
    }

    void loadUser();

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
      if (!session?.user) {
        setIsAdmin(false);
      } else {
        void loadUser();
      }
    });

    return () => data.subscription.unsubscribe();
  }, [supabase]);

  if (!email) {
    return <Link href={`/${locale}/account` as Route}>{label}</Link>;
  }

  return (
    <span className="account-nav">
      <Link href={`/${locale}/account` as Route}>
        <UserRound size={16} />
        <span>{email}</span>
      </Link>
      {isAdmin && (
        <Link aria-label="Admin" href={`/${locale}/admin` as Route}>
          <LayoutDashboard size={16} />
        </Link>
      )}
      <button
        aria-label="Sign out"
        onClick={() => {
          void supabase?.auth.signOut();
        }}
        type="button"
      >
        <LogOut size={16} />
      </button>
    </span>
  );
}
