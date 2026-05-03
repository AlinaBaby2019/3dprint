"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, RefreshCcw } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Tables } from "@/lib/supabase/database.types";

type PaymentRow = Tables<"payments">;

type AdminPaymentsCopy = {
  paymentsTitle: string;
  noPayments: string;
  paymentProvider: string;
  paymentAmount: string;
  markRefunded: string;
  refresh: string;
  messageSaved: string;
  messageError: string;
  status: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function AdminPayments({ copy }: { copy: AdminPaymentsCopy }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [isAdmin, setIsAdmin] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadPayments = useCallback(async () => {
    if (!supabase || !isAdmin) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setBusy(false);
    if (error) {
      setMessage(error.message);
    } else {
      setPayments(data ?? []);
    }
  }, [isAdmin, supabase]);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", data.user.id)
        .maybeSingle();
      setIsAdmin(Boolean(profile?.is_admin));
    });
  }, [supabase]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  async function markRefunded(id: string) {
    if (!supabase) return;
    setBusy(true);
    setMessage(null);
    const { error } = await supabase
      .from("payments")
      .update({ status: "refunded" })
      .eq("id", id);
    setBusy(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage(copy.messageSaved);
      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "refunded" } : p))
      );
    }
  }

  if (!isAdmin) return null;

  return (
    <section className="admin-materials-section">
      <div className="admin-header" style={{ marginBottom: "16px" }}>
        <div>
          <p className="eyebrow">{copy.paymentsTitle}</p>
          <h2>{copy.paymentsTitle}</h2>
        </div>
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => void loadPayments()}
          type="button"
        >
          <RefreshCcw size={18} />
          {copy.refresh}
        </button>
      </div>

      {payments.length === 0 ? (
        <p className="empty-state">{copy.noPayments}</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>{copy.paymentProvider}</th>
              <th>{copy.paymentAmount}</th>
              <th>{copy.status}</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>
                  <span className="muted-label">#{payment.order_id.slice(0, 8)}</span>
                  {payment.provider_reference && (
                    <em className="muted-label" style={{ marginLeft: 8, fontSize: "0.8rem" }}>
                      {payment.provider_reference.slice(0, 12)}
                    </em>
                  )}
                </td>
                <td>
                  <CreditCard size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                  {payment.provider}
                </td>
                <td>
                  <strong>{payment.amount_dkk}</strong>
                  <span className="muted-label"> {payment.currency}</span>
                </td>
                <td>
                  <span
                    className={`status-badge ${payment.status === "paid" ? "status-active" : payment.status === "refunded" ? "status-muted" : ""}`}
                  >
                    {payment.status}
                  </span>
                </td>
                <td className="muted-label">{formatDate(payment.created_at)}</td>
                <td>
                  {payment.status === "paid" && (
                    <button
                      className="button secondary small"
                      disabled={busy}
                      onClick={() => void markRefunded(payment.id)}
                      type="button"
                    >
                      {copy.markRefunded}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {message && <p className="form-note">{message}</p>}
    </section>
  );
}
