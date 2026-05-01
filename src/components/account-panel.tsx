"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
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

  function readCredentials(form: HTMLFormElement) {
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const authAction = String(data.get("authAction") ?? "signIn");

    if (!email || !password) {
      setMessage("Enter email and password first.");
      return null;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return null;
    }

    return { authAction, email, password };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    const credentials = readCredentials(event.currentTarget);
    if (!credentials) {
      return;
    }

    setBusy(true);
    setMessage(null);

    if (credentials.authAction === "signUp") {
      const { error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            preferred_locale: "da"
          }
        }
      });

      setBusy(false);
      setMessage(
        error ? error.message : "Account created. Check your email if confirmation is enabled."
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    setBusy(false);
    setMessage(error ? error.message : "Signed in.");
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
          <form className="account-panel-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>{copy.email}</span>
              <input
                autoComplete="email"
                name="email"
                required
                type="email"
              />
            </label>
            <label className="field">
              <span>{copy.password}</span>
              <input
                autoComplete="current-password"
                minLength={6}
                name="password"
                required
                type="password"
              />
            </label>
            <div className="upload-actions">
              <button
                className="button secondary"
                disabled={busy}
                name="authAction"
                type="submit"
                value="signUp"
              >
                {copy.signUp}
              </button>
              <button
                className="button primary"
                disabled={busy}
                name="authAction"
                type="submit"
                value="signIn"
              >
                {copy.signIn}
              </button>
            </div>
          </form>
        )}

        {message && <p className="form-note">{message}</p>}
      </div>
    </section>
  );
}
