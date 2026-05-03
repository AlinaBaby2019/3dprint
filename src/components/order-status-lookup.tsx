"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Package, Search } from "lucide-react";
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
  order_items: Pick<Tables<"order_items">, "id" | "metadata" | "quantity" | "title" | "unit_price_dkk">[];
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
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function deliveryMethodLabel(method: string, copy: OrderStatusCopy): string {
  if (method === "pickup_aarhus") return copy.deliveryPickup;
  if (method === "local_delivery") return copy.deliveryLocal;
  if (method === "shipping") return copy.deliveryShipping;
  return method;
}

export function OrderStatusLookup({
  copy,
  locale
}: {
  copy: OrderStatusCopy;
  locale: Locale;
}) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const visibleOrders = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return orders;
    return orders.filter(
      (order) =>
        order.id.toLowerCase().startsWith(value) ||
        order.customer_email?.toLowerCase().includes(value) ||
        order.order_items.some((item) => item.title.toLowerCase().includes(value))
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

    if (error) {
      setOrders([]);
      setMessage(error.message);
      return;
    }

    setOrders((data ?? []) as OrderRow[]);
  }

  useEffect(() => {
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  function searchOrders(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadOrders();
  }

  return (
    <div className="order-status-panel">
      <form className="status-box" onSubmit={searchOrders}>
        <input
          onChange={(e) => setQuery(e.target.value)}
          placeholder={copy.placeholder}
          type="text"
          value={query}
        />
        <button className="button primary" disabled={loading} type="submit">
          <Search size={18} />
          {copy.action}
        </button>
      </form>

      {message && <p className="form-note">{message}</p>}

      {!message && visibleOrders.length === 0 && (
        <p className="empty-state">{copy.empty}</p>
      )}

      {visibleOrders.length > 0 && (
        <div className="order-list">
          {visibleOrders.map((order) => {
            const delivery = order.deliveries[0];
            const printJob = order.print_jobs[0];
            const showFooter =
              (delivery && delivery.status !== "not_required") ||
              delivery?.tracking_reference ||
              (printJob && printJob.status !== "done");

            return (
              <article className="order-card" key={order.id}>

                {/* header: order ID + status badge */}
                <div className="order-card-head">
                  <div className="order-card-ref">
                    <span className="order-card-label">{copy.order}</span>
                    <strong>#{order.id.slice(0, 8).toUpperCase()}</strong>
                  </div>
                  <span className={statusBadgeClass(order.status)}>
                    {statusLabel(order.status, copy.statuses)}
                  </span>
                </div>

                {/* meta bar: date + total */}
                <div className="order-card-meta">
                  <span>{copy.created} {formatDate(order.created_at, locale)}</span>
                  <span>{order.total_dkk} {order.currency}</span>
                </div>

                {/* items */}
                <ul className="order-item-list">
                  {order.order_items.map((item) => (
                    <li className="order-item-line" key={item.id}>
                      <span>{item.quantity} × {item.title}</span>
                      <span>{item.unit_price_dkk} DKK</span>
                    </li>
                  ))}
                </ul>

                {/* delivery / print footer */}
                {showFooter && (
                  <div className="order-card-footer">
                    {delivery && (
                      <span className="order-card-footer-item">
                        <Package size={13} />
                        {delivery.status !== "not_required"
                          ? statusLabel(delivery.status, copy.statuses)
                          : deliveryMethodLabel(delivery.method, copy)}
                        {delivery.tracking_reference && (
                          <em className="order-tracking">{delivery.tracking_reference}</em>
                        )}
                      </span>
                    )}
                    {printJob && printJob.status !== "done" && (
                      <span className={statusBadgeClass(printJob.status)}>
                        {statusLabel(printJob.status, copy.statuses)}
                      </span>
                    )}
                  </div>
                )}

              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
