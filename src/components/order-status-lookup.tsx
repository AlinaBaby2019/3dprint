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
};

type OrderRow = Tables<"orders"> & {
  order_items: Pick<Tables<"order_items">, "id" | "metadata" | "quantity" | "title" | "unit_price_dkk">[];
  deliveries: Pick<Tables<"deliveries">, "id" | "method" | "status" | "tracking_reference">[];
  print_jobs: Pick<Tables<"print_jobs">, "id" | "printer_name" | "status">[];
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
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
    if (!value) {
      return orders;
    }

    return orders.filter((order) => {
      return (
        order.id.toLowerCase().startsWith(value) ||
        order.customer_email?.toLowerCase().includes(value) ||
        order.order_items.some((item) => item.title.toLowerCase().includes(value))
      );
    });
  }, [orders, query]);

  async function loadOrders() {
    if (!supabase) {
      return;
    }

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
      .select(
        "*,order_items(id,title,quantity,unit_price_dkk,metadata),deliveries(id,status,method,tracking_reference),print_jobs(id,status,printer_name)"
      )
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
          onChange={(event) => setQuery(event.target.value)}
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

      {!message && visibleOrders.length === 0 && <p className="empty-state">{copy.empty}</p>}

      {visibleOrders.length > 0 && (
        <div className="order-list">
          {visibleOrders.map((order) => {
            const delivery = order.deliveries[0];
            const printJob = order.print_jobs[0];

            return (
              <article className="order-row" key={order.id}>
                <div className="order-row-head">
                  <div>
                    <span>{copy.order}</span>
                    <strong>#{order.id.slice(0, 8)}</strong>
                    <em>{copy.created} {formatDate(order.created_at, locale)}</em>
                  </div>
                  <div>
                    <span>{copy.total}</span>
                    <strong>{order.total_dkk} {order.currency}</strong>
                    <em>{formatStatus(order.status)}</em>
                  </div>
                  <div>
                    <span>{copy.delivery}</span>
                    <strong>{delivery ? formatStatus(delivery.status) : "-"}</strong>
                    {delivery && <em>{delivery.method}</em>}
                  </div>
                  <div>
                    <span>{copy.print}</span>
                    <strong>{printJob ? formatStatus(printJob.status) : "-"}</strong>
                    {printJob?.printer_name && <em>{printJob.printer_name}</em>}
                  </div>
                </div>

                <div className="order-items">
                  <span>{copy.items}</span>
                  {order.order_items.map((item) => (
                    <div className="order-item-line" key={item.id}>
                      <strong>{item.quantity} x {item.title}</strong>
                      <em>{item.unit_price_dkk} DKK</em>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
