"use client";

import Image from "next/image";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Minus, PackageCheck, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { products as staticProducts } from "@/lib/catalog";
import { createBrowserSupabaseClient, isMobilePayConfigured, isStripeConfigured } from "@/lib/supabase/browser";
import type { Tables } from "@/lib/supabase/database.types";
import type { Locale } from "@/lib/i18n";

type ProductCatalogCopy = {
  title: string;
  subtitle: string;
  color: string;
  quantity: string;
  personalization: string;
  personalizationPlaceholder: string;
  addToCart: string;
  cartTitle: string;
  cartEmpty: string;
  subtotal: string;
  checkout: string;
  checkoutNote: string;
  checkoutMobilepay: string;
  deliveryAddress: string;
  noAddress: string;
  signInRequired: string;
  orderCreated: string;
  orderFailed: string;
  remove: string;
};

type DbProductMeta = {
  colors?: string[];
  customizable?: boolean;
  lead_time?: string;
  image_url?: string;
};

type DbProduct = Pick<
  Tables<"products">,
  "slug" | "name" | "base_price_dkk" | "category" | "is_active" | "metadata"
> & { id: string };

const DEFAULT_COLORS = ["Black", "White", "Grey"];

function resolveDbProducts(rows: DbProduct[], locale: Locale) {
  return rows.map((row) => {
    const nameObj = row.name as Record<string, string> | null;
    const meta = (row.metadata ?? {}) as DbProductMeta;
    return {
      slug: row.slug,
      name: nameObj?.[locale] ?? nameObj?.["en"] ?? row.slug,
      category: row.category ?? "",
      priceDkk: row.base_price_dkk,
      leadTime: meta.lead_time ?? "",
      image: meta.image_url ?? "/images/product-cable-dock.png",
      colors: meta.colors ?? DEFAULT_COLORS,
      customizable: meta.customizable ?? false
    };
  });
}

type CartItem = {
  id: string;
  productSlug: string;
  name: string;
  unitPriceDkk: number;
  color: string;
  quantity: number;
  personalization: string;
};

type AddressRow = Pick<
  Tables<"addresses">,
  "city" | "country" | "id" | "is_default" | "label" | "line1" | "line2" | "postal_code"
>;

const cartStorageKey = "aarhus-3d-print-cart";

function formatPrice(value: number) {
  return `${value} DKK`;
}

function makeCartItemId(input: Pick<CartItem, "productSlug" | "color" | "personalization">) {
  return [input.productSlug, input.color, input.personalization.trim().toLowerCase()].join("::");
}

export function ProductCatalog({ copy, locale }: { copy: ProductCatalogCopy; locale: Locale }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [dbProducts, setDbProducts] = useState<DbProduct[] | null>(null);
  const products = useMemo(() => {
    if (dbProducts === null) return resolveDbProducts([], locale);
    if (dbProducts.length > 0) return resolveDbProducts(dbProducts, locale);
    return staticProducts;
  }, [dbProducts, locale]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const subtotal = useMemo(
    () => cart.reduce((total, item) => total + item.unitPriceDkk * item.quantity, 0),
    [cart]
  );

  useEffect(() => {
    const saved = window.localStorage.getItem(cartStorageKey);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as CartItem[];
      if (Array.isArray(parsed)) {
        setCart(parsed);
      }
    } catch {
      window.localStorage.removeItem(cartStorageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!supabase) {
      setDbProducts([]);
      return;
    }

    void supabase
      .from("products")
      .select("id,slug,name,base_price_dkk,category,is_active,metadata")
      .eq("is_active", true)
      .order("slug")
      .then(({ data }) => setDbProducts((data ?? []) as DbProduct[]));
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;

    async function loadUserAndAddresses() {
      const { data: userData } = await client.auth.getUser();
      const user = userData.user;
      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? null);

      if (!user) {
        setAddresses([]);
        setSelectedAddressId("");
        return;
      }

      const { data } = await client
        .from("addresses")
        .select("id,label,line1,line2,postal_code,city,country,is_default")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      const rows = data ?? [];
      setAddresses(rows);
      setSelectedAddressId((current) => current || rows[0]?.id || "");
    }

    void loadUserAndAddresses();

    const { data } = client.auth.onAuthStateChange(() => {
      void loadUserAndAddresses();
    });

    return () => data.subscription.unsubscribe();
  }, [supabase]);

  function addToCart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const productSlug = String(data.get("productSlug") ?? "");
    const product = products.find((item) => item.slug === productSlug);

    if (!product) {
      return;
    }

    const color = String(data.get("color") ?? product.colors[0]);
    const quantity = Math.max(1, Number(data.get("quantity") ?? 1));
    const personalization = String(data.get("personalization") ?? "").trim();
    const id = makeCartItemId({ productSlug, color, personalization });

    setCart((items) => {
      const existing = items.find((item) => item.id === id);
      if (existing) {
        return items.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }

      return [
        ...items,
        {
          id,
          productSlug,
          name: product.name,
          unitPriceDkk: product.priceDkk,
          color,
          quantity,
          personalization
        }
      ];
    });

    form.reset();
  }

  function updateQuantity(id: string, direction: 1 | -1) {
    setCart((items) =>
      items
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + direction) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(id: string) {
    setCart((items) => items.filter((item) => item.id !== id));
  }

  async function createOrder() {
    if (!supabase || cart.length === 0) {
      return;
    }

    if (!isStripeConfigured()) {
      setCheckoutMessage(copy.checkoutNote);
      return;
    }

    if (!userId) {
      setCheckoutMessage(copy.signInRequired);
      return;
    }

    if (!selectedAddressId) {
      setCheckoutMessage(copy.noAddress);
      return;
    }

    setCheckoutBusy(true);
    setCheckoutMessage(null);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        status: "pending_payment",
        total_dkk: subtotal,
        currency: "DKK",
        customer_email: userEmail
      })
      .select("id")
      .single();

    if (orderError || !order) {
      setCheckoutBusy(false);
      setCheckoutMessage(orderError?.message ?? copy.orderFailed);
      return;
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      cart.map((item) => ({
        order_id: order.id,
        item_type: "product",
        title: item.name,
        quantity: item.quantity,
        unit_price_dkk: item.unitPriceDkk,
        metadata: {
          productSlug: item.productSlug,
          color: item.color,
          personalization: item.personalization
        }
      }))
    );

    if (itemsError) {
      setCheckoutBusy(false);
      setCheckoutMessage(itemsError.message);
      return;
    }

    const { error: deliveryError } = await supabase.from("deliveries").insert({
      order_id: order.id,
      method: "pickup_aarhus",
      status: "not_required",
      address_id: selectedAddressId
    });

    setCheckoutBusy(false);

    if (deliveryError) {
      setCheckoutMessage(deliveryError.message);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setCheckoutBusy(false);
      setCheckoutMessage(copy.signInRequired);
      return;
    }

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ orderId: order.id, locale })
    });

    const result = await response.json() as { url?: string; error?: string };

    setCheckoutBusy(false);

    if (!response.ok || !result.url) {
      setCheckoutMessage(result.error ?? copy.orderFailed);
      return;
    }

    setCart([]);
    window.location.href = result.url;
  }

  async function createMobilePayOrder() {
    if (!supabase || cart.length === 0) return;

    if (!userId) {
      setCheckoutMessage(copy.signInRequired);
      return;
    }

    if (!selectedAddressId) {
      setCheckoutMessage(copy.noAddress);
      return;
    }

    setCheckoutBusy(true);
    setCheckoutMessage(null);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        status: "pending_payment",
        total_dkk: subtotal,
        currency: "DKK",
        customer_email: userEmail
      })
      .select("id")
      .single();

    if (orderError || !order) {
      setCheckoutBusy(false);
      setCheckoutMessage(orderError?.message ?? copy.orderFailed);
      return;
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      cart.map((item) => ({
        order_id: order.id,
        item_type: "product",
        title: item.name,
        quantity: item.quantity,
        unit_price_dkk: item.unitPriceDkk,
        metadata: {
          productSlug: item.productSlug,
          color: item.color,
          personalization: item.personalization
        }
      }))
    );

    if (itemsError) {
      setCheckoutBusy(false);
      setCheckoutMessage(itemsError.message);
      return;
    }

    await supabase.from("deliveries").insert({
      order_id: order.id,
      method: "pickup_aarhus",
      status: "not_required",
      address_id: selectedAddressId
    });

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setCheckoutBusy(false);
      setCheckoutMessage(copy.signInRequired);
      return;
    }

    const response = await fetch("/api/checkout/mobilepay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ orderId: order.id, locale })
    });

    const result = await response.json() as { url?: string; error?: string };
    setCheckoutBusy(false);

    if (!response.ok || !result.url) {
      setCheckoutMessage(result.error ?? copy.orderFailed);
      return;
    }

    setCart([]);
    window.location.href = result.url;
  }

  return (
    <div className="commerce-layout">
      <div className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.slug}>
            <div className="product-art">
              <Image alt={product.name} height={560} src={product.image} width={760} />
            </div>
            <form className="card-body product-form" onSubmit={addToCart}>
              <input name="productSlug" type="hidden" value={product.slug} />
              <h3>{product.name}</h3>
              <div className="meta">
                {product.category} · {product.leadTime}
              </div>
              <div className="price">{formatPrice(product.priceDkk)}</div>

              <div className="product-controls">
                <label className="field">
                  <span>{copy.color}</span>
                  <select defaultValue={product.colors[0]} name="color">
                    {product.colors.map((color) => (
                      <option key={color}>{color}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>{copy.quantity}</span>
                  <input defaultValue="1" min="1" name="quantity" type="number" />
                </label>
                {product.customizable && (
                  <label className="field full">
                    <span>{copy.personalization}</span>
                    <input
                      maxLength={32}
                      name="personalization"
                      placeholder={copy.personalizationPlaceholder}
                    />
                  </label>
                )}
              </div>

              <button className="btn btn--primary wide" type="submit">
                <ShoppingCart size={18} />
                {copy.addToCart}
              </button>
            </form>
          </article>
        ))}
      </div>

      <aside className="panel cart-panel" aria-label={copy.cartTitle}>
        <div className="cart-title">
          <PackageCheck size={20} />
          <h3>{copy.cartTitle}</h3>
        </div>

        {cart.length === 0 ? (
          <p className="empty-state">{copy.cartEmpty}</p>
        ) : (
          <div className="cart-items">
            {cart.map((item) => (
              <article className="cart-item" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {item.color}
                    {item.personalization ? ` · ${item.personalization}` : ""}
                  </span>
                  <em>{formatPrice(item.unitPriceDkk)} each</em>
                </div>
                <div className="cart-item-actions">
                  <button
                    aria-label="Decrease quantity"
                    onClick={() => updateQuantity(item.id, -1)}
                    type="button"
                  >
                    <Minus size={15} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => updateQuantity(item.id, 1)}
                    type="button"
                  >
                    <Plus size={15} />
                  </button>
                  <button
                    aria-label={copy.remove}
                    onClick={() => removeItem(item.id)}
                    type="button"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="cart-total">
          <span>{copy.subtotal}</span>
          <strong>{formatPrice(subtotal)}</strong>
        </div>

        <label className="field cart-address">
          <span>{copy.deliveryAddress}</span>
          <select
            disabled={!userId || addresses.length === 0}
            onChange={(event) => setSelectedAddressId(event.target.value)}
            value={selectedAddressId}
          >
            {addresses.length === 0 ? (
              <option>{copy.noAddress}</option>
            ) : (
              addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label} · {address.postal_code} {address.city}
                </option>
              ))
            )}
          </select>
        </label>

        <button
          className="btn btn--primary wide"
          disabled={cart.length === 0 || checkoutBusy}
          onClick={() => void createOrder()}
          type="button"
        >
          {copy.checkout}
        </button>
        {isMobilePayConfigured() && (
          <button
            className="btn mobilepay-button wide"
            disabled={cart.length === 0 || checkoutBusy}
            onClick={() => void createMobilePayOrder()}
            type="button"
          >
            <svg height="20" viewBox="0 0 60 24" width="50" xmlns="http://www.w3.org/2000/svg">
              <text fill="currentColor" fontFamily="system-ui,sans-serif" fontSize="14" fontWeight="700" y="18">MobilePay</text>
            </svg>
            {copy.checkoutMobilepay}
          </button>
        )}
        {!isStripeConfigured() && !isMobilePayConfigured() && (
          <p className="cart-note">{copy.checkoutNote}</p>
        )}
        {checkoutMessage && <p className="form-note">{checkoutMessage}</p>}
      </aside>
    </div>
  );
}
