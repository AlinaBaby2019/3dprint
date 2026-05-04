"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Tables } from "@/lib/supabase/database.types";
import type { Locale } from "@/lib/i18n";

type OrderStatusCopy = {
  title: string;
  placeholder: string;
  action: string;
  signInRequired: string;
  empty: string;
  total: string;
  order: string;
  delivery: string;
  print: string;
  items: string;
  created: string;
  statuses: Record<string, string>;
  deliveryPickup: string;
  deliveryLocal: string;
  deliveryShipping: string;
};

type OrderRow = Tables<"orders"> & {
  order_items: Pick<Tables<"order_items">, "id" | "quantity" | "title" | "unit_price_dkk" | "metadata">[];
  deliveries: Pick<Tables<"deliveries">, "id" | "method" | "status" | "tracking_reference">[];
  print_jobs: Pick<Tables<"print_jobs">, "id" | "printer_name" | "status">[];
};

function statusLabel(status: string, statuses: Record<string, string>): string {
  return statuses[status] ?? status.replaceAll("_", " ");
}

function statusBadgeClass(status: string): string {
  if (["paid", "fulfilled", "done", "delivered"].includes(status)) return "status-badge status-success";
  if (["in_production", "printing", "post_processing", "ready", "shipped", "out_for_delivery", "pickup_ready"].includes(status)) return "status-badge status-info";
  if (["pending_payment", "queued"].includes(status)) return "status-badge status-warning";
  if (["cancelled", "failed", "refunded"].includes(status)) return "status-badge status-error";
  return "status-badge status-muted";
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function deliveryLabel(delivery: OrderRow["deliveries"][0] | undefined, copy: OrderStatusCopy): string {
  if (!delivery) return "—";
  if (delivery.status !== "not_required") return statusLabel(delivery.status, copy.statuses);
  if (delivery.method === "pickup_aarhus") return copy.deliveryPickup;
  if (delivery.method === "local_delivery") return copy.deliveryLocal;
  if (delivery.method === "shipping") return copy.deliveryShipping;
  return delivery.method;
}

function itemsSummary(items: OrderRow["order_items"]): string {
  return items.map((i) => `${i.quantity} × ${i.title}`).join(", ");
}

export function OrderStatusLookup({ copy, locale }: { copy: OrderStatusCopy; locale: Locale }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const visibleOrders = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return orders;
    return orders.filter(
      (o) =>
        o.id.toLowerCase().startsWith(value) ||
        o.customer_email?.toLowerCase().includes(value) ||
        o.order_items.some((i) => i.title.toLowerCase().includes(value))
    );
  }, [orders, query]);

  async function loadOrders() {
    if (!supabase) return;
    setLoading(true);
    setMessage(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setOrders([]);
      setLoading(false);
      setMessage(copy.signInRequired);
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*,order_items(id,title,quantity,unit_price_dkk,metadata),deliveries(id,status,method,tracking_reference),print_jobs(id,status,printer_name)")
      .order("created_at", { ascending: false })
      .limit(20);

    setLoading(false);
    if (error) { setOrders([]); setMessage(error.message); return; }
    setOrders((data ?? []) as OrderRow[]);
  }

  useEffect(() => { void loadOrders(); }, [supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="order-status-panel">
      <form className="status-box" onSubmit={(e: FormEvent) => { e.preventDefault(); void loadOrders(); }}>
        <input
          onChange={(e) => setQuery(e.target.value)}
          placeholder={copy.placeholder}
          type="text"
          value={query}
        />
        <button className="btn btn--primary" disabled={loading} type="submit">
          <Search size={18} />
          {copy.action}
        </button>
      </form>

      {message && <p className="form-note">{message}</p>}
      {!message && visibleOrders.length === 0 && <p className="empty-state">{copy.empty}</p>}

      {visibleOrders.length > 0 && (
        <div className="order-table-wrap">
          <table className="order-table">
            <thead>
              <tr>
                <th>{copy.order}</th>
                <th>{copy.created}</th>
                <th>{copy.items}</th>
                <th>{copy.total}</th>
                <th>{copy.delivery}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => (
                <tr key={order.id}>
                  <td className="order-table-id">#{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="order-table-date">{formatDate(order.created_at, locale)}</td>
                  <td className="order-table-items">{itemsSummary(order.order_items)}</td>
                  <td className="order-table-total">{order.total_dkk} {order.currency}</td>
                  <td className="order-table-delivery">{deliveryLabel(order.deliveries[0], copy)}</td>
                  <td><span className={statusBadgeClass(order.status)}>{statusLabel(order.status, copy.statuses)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
