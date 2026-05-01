"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import { LogOut, UserRound } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Locale } from "@/lib/i18n";

export function AccountNav({ label, locale }: { label: string; locale: Locale }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
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
