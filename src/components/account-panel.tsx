"use client";

import { useEffect, useMemo, useState } from "react";
import { LogOut, UserRound } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type AccountCopy = {
  title: string;
  subtitle: string;
  email: string;
  password: string;
  signIn: string;
  signUp: string;
  signOut: string;
};

export function AccountPanel({ copy }: { copy: AccountCopy }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }

    void supabase.auth.getUser().then(({ data }) => {
      setCurrentEmail(data.user?.email ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentEmail(session?.user.email ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function signIn() {
    if (!supabase) {
      return;
    }

    setBusy(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    setMessage(error ? error.message : "Signed in.");
  }

  async function signUp() {
    if (!supabase) {
      return;
    }

    setBusy(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          preferred_locale: "da"
        }
      }
    });
    setBusy(false);
    setMessage(error ? error.message : "Account created. Check your email if confirmation is enabled.");
  }

  async function signOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setMessage("Signed out.");
  }

  return (
    <section className="account-layout">
      <div>
        <p className="eyebrow">{copy.title}</p>
        <h1>{copy.title}</h1>
        <p className="hero-copy">{copy.subtitle}</p>
      </div>

      <div className="panel account-panel">
        {currentEmail ? (
          <div className="signed-in">
            <UserRound size={32} />
            <div>
              <span>Signed in as</span>
              <strong>{currentEmail}</strong>
            </div>
            <button className="button secondary" onClick={signOut} type="button">
              <LogOut size={18} />
              {copy.signOut}
            </button>
          </div>
        ) : (
          <>
            <label className="field">
              <span>{copy.email}</span>
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </label>
            <label className="field">
              <span>{copy.password}</span>
              <input
                autoComplete="current-password"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </label>
            <div className="upload-actions">
              <button className="button secondary" disabled={busy} onClick={signUp} type="button">
                {copy.signUp}
              </button>
              <button className="button primary" disabled={busy} onClick={signIn} type="button">
                {copy.signIn}
              </button>
            </div>
          </>
        )}

        {message && <p className="form-note">{message}</p>}
      </div>
    </section>
  );
}
