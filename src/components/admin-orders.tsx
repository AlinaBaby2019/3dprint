"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Mail, PackageCheck, RefreshCcw } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Database, Tables } from "@/lib/supabase/database.types";
import type { Locale } from "@/lib/i18n";

type AdminOrdersCopy = {
  ordersTitle: string;
  noOrders: string;
  orderStatus: string;
  deliveryStatus: string;
  saveOrderStatus: string;
  orderTotal: string;
  messageSaved: string;
  messageError: string;
  refresh: string;
  status: string;
  notifyOrderStatus: string;
};

type OrderStatus = Database["public"]["Enums"]["order_status"];
type DeliveryStatus = Database["public"]["Enums"]["delivery_status"];

type AdminOrder = Tables<"orders"> & {
  order_items: Pick<Tables<"order_items">, "id" | "title" | "quantity" | "unit_price_dkk">[];
  deliveries: Pick<Tables<"deliveries">, "id" | "method" | "status">[];
};

const orderStatuses: OrderStatus[] = [
  "pending_payment",
  "paid",
  "in_production",
  "ready",
  "fulfilled",
  "refunded",
  "cancelled"
];

const deliveryStatuses: DeliveryStatus[] = [
  "not_required",
  "pickup_ready",
  "out_for_delivery",
  "shipped",
  "delivered",
  "failed"
];

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function AdminOrders({ copy, locale }: { copy: AdminOrdersCopy; locale: Locale }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedOrder = orders.find((o) => o.id === selectedId) ?? orders[0];
  const selectedDelivery = selectedOrder?.deliveries[0];

  const loadOrders = useCallback(async () => {
    if (!supabase || !isAdmin) {
      return;
    }

    setBusy(true);
    setMessage(null);

    const { data, error } = await supabase
      .from("orders")
      .select("*,order_items(id,title,quantity,unit_price_dkk),deliveries(id,method,status)")
      .order("created_at", { ascending: false })
      .limit(100);

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    const rows = (data ?? []) as AdminOrder[];
    setOrders(rows);
    setSelectedId((current) => current ?? rows[0]?.id ?? null);
  }, [isAdmin, supabase]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    async function checkAdmin() {
      const { data } = await supabase!.auth.getUser();
      if (!data.user) {
        return;
      }

      const { data: profile } = await supabase!
        .from("profiles")
        .select("is_admin")
        .eq("id", data.user.id)
        .maybeSingle();

      setIsAdmin(Boolean(profile?.is_admin));
    }

    void checkAdmin();
  }, [supabase]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  async function saveOrderStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !selectedOrder) {
      return;
    }

    const data = new FormData(event.currentTarget);
    const orderStatus = String(data.get("orderStatus")) as OrderStatus;
    const deliveryStatus = String(data.get("deliveryStatus")) as DeliveryStatus;
    const sendNotification = data.get("sendNotification") === "on";

    setBusy(true);
    setMessage(null);

    const { error: orderError } = await supabase
      .from("orders")
      .update({ status: orderStatus })
      .eq("id", selectedOrder.id);

    if (orderError) {
      setBusy(false);
      setMessage(orderError.message);
      return;
    }

    if (selectedDelivery) {
      const { error: deliveryError } = await supabase
        .from("deliveries")
        .update({ status: deliveryStatus })
        .eq("id", selectedDelivery.id);

      if (deliveryError) {
        setBusy(false);
        setMessage(deliveryError.message);
        return;
      }
    }

    if (sendNotification && ["in_production", "ready", "fulfilled"].includes(orderStatus)) {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (token) {
        await fetch("/api/admin/notify-order-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ orderId: selectedOrder.id, newStatus: orderStatus })
        });
      }
    }

    setBusy(false);
    setMessage(copy.messageSaved);
    await loadOrders();
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <section className="admin-orders-section">
      <div className="admin-header">
        <div>
          <p className="eyebrow">{copy.ordersTitle}</p>
          <h2>{copy.ordersTitle}</h2>
        </div>
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => void loadOrders()}
          type="button"
        >
          <RefreshCcw size={18} />
          {copy.refresh}
        </button>
      </div>

      <div className="admin-grid">
        <aside className="panel admin-queue">
          <div className="admin-panel-title">
            <PackageCheck size={20} />
            <h2>{copy.ordersTitle}</h2>
          </div>

          {orders.length === 0 && <p className="empty-state">{copy.noOrders}</p>}

          <div className="admin-project-list">
            {orders.map((order) => (
              <button
                aria-current={order.id === selectedOrder?.id ? "true" : undefined}
                className="admin-project-button"
                key={order.id}
                onClick={() => setSelectedId(order.id)}
                type="button"
              >
                <strong>#{order.id.slice(0, 8)}</strong>
                <span>{formatStatus(order.status)}</span>
                <em>{formatDate(order.created_at, locale)}</em>
              </button>
            ))}
          </div>
        </aside>

        <section className="panel admin-detail">
          {selectedOrder ? (
            <>
              <div className="admin-summary">
                <div>
                  <span>{copy.status}</span>
                  <strong>{formatStatus(selectedOrder.status)}</strong>
                </div>
                <div>
                  <span>{copy.orderTotal}</span>
                  <strong>
                    {selectedOrder.total_dkk} {selectedOrder.currency}
                  </strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{selectedOrder.customer_email ?? "—"}</strong>
                </div>
              </div>

              <div className="admin-files">
                <h3>{copy.orderTotal}</h3>
                {selectedOrder.order_items.map((item) => (
                  <div className="admin-file-row" key={item.id}>
                    <strong>
                      {item.quantity} × {item.title}
                    </strong>
                    <span>{item.unit_price_dkk} DKK</span>
                  </div>
                ))}
              </div>

              <form className="admin-form compact" onSubmit={saveOrderStatus}>
                <h3>{copy.saveOrderStatus}</h3>
                <label className="field">
                  <span>{copy.orderStatus}</span>
                  <select defaultValue={selectedOrder.status} name="orderStatus">
                    {orderStatuses.map((s) => (
                      <option key={s} value={s}>
                        {formatStatus(s)}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedDelivery && (
                  <label className="field">
                    <span>{copy.deliveryStatus}</span>
                    <select defaultValue={selectedDelivery.status} name="deliveryStatus">
                      {deliveryStatuses.map((s) => (
                        <option key={s} value={s}>
                          {formatStatus(s)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="checkbox-label field full">
                  <input defaultChecked name="sendNotification" type="checkbox" />
                  <Mail size={15} />
                  {copy.notifyOrderStatus}
                </label>
                <div className="upload-actions full">
                  <button className="button primary" disabled={busy} type="submit">
                    <CheckCircle2 size={18} />
                    {copy.saveOrderStatus}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <p className="empty-state">{copy.noOrders}</p>
          )}

          {message && <p className="form-note">{message}</p>}
        </section>
      </div>
    </section>
  );
}
