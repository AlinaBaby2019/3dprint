"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, PackagePlus, ToggleLeft, ToggleRight } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Tables } from "@/lib/supabase/database.types";

type ProductRow = Tables<"products">;

type AdminProductsCopy = {
  productsTitle: string;
  noProducts: string;
  productActive: string;
  productPrice: string;
  productSlug: string;
  productName: string;
  addProduct: string;
  saved: string;
  error: string;
};

function getProductName(name: unknown): string {
  if (typeof name === "string") return name;
  if (name && typeof name === "object") {
    const obj = name as Record<string, unknown>;
    return String(obj.en ?? obj.da ?? obj.zh ?? Object.values(obj)[0] ?? "");
  }
  return "";
}

export function AdminProducts({ copy }: { copy: AdminProductsCopy }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    void supabase
      .from("products")
      .select("*")
      .order("slug")
      .then(({ data }) => {
        if (data) setProducts(data);
      });
  }, [supabase]);

  async function toggleActive(id: string, current: boolean) {
    if (!supabase) return;
    const { error } = await supabase
      .from("products")
      .update({ is_active: !current })
      .eq("id", id);
    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !current } : p))
      );
    }
  }

  async function savePrice(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    if (!supabase) return;
    const value = Number(new FormData(event.currentTarget).get("price"));
    if (!value || value <= 0) return;
    setBusy(true);
    setMessage(null);
    const { error } = await supabase
      .from("products")
      .update({ base_price_dkk: Math.round(value) })
      .eq("id", id);
    setBusy(false);
    setMessage(error ? copy.error : copy.saved);
    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, base_price_dkk: Math.round(value) } : p))
      );
    }
  }

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const slug = String(data.get("slug") ?? "").trim().toLowerCase().replace(/\s+/g, "-");
    const nameEn = String(data.get("name") ?? "").trim();
    const price = Number(data.get("price"));
    const category = String(data.get("category") ?? "").trim() || null;
    if (!slug || !nameEn || !price || price <= 0) return;
    setBusy(true);
    setMessage(null);
    const { data: inserted, error } = await supabase
      .from("products")
      .insert({
        slug,
        name: { en: nameEn, da: nameEn, zh: nameEn },
        description: {},
        base_price_dkk: Math.round(price),
        category,
        is_active: true
      })
      .select()
      .single();
    setBusy(false);
    setMessage(error ? copy.error : copy.saved);
    if (!error && inserted) {
      setProducts((prev) => [...prev, inserted]);
      form.reset();
    }
  }

  return (
    <section className="admin-materials-section">
      <h2>{copy.productsTitle}</h2>

      {products.length === 0 ? (
        <p className="empty-state">{copy.noProducts}</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>{copy.productName}</th>
              <th>{copy.productPrice}</th>
              <th>{copy.productActive}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <strong>{getProductName(product.name)}</strong>
                  <em className="muted-label"> ({product.slug})</em>
                  {product.category && <em className="muted-label"> · {product.category}</em>}
                </td>
                <td>
                  <form className="inline-form" onSubmit={(e) => savePrice(e, product.id)}>
                    <input
                      defaultValue={product.base_price_dkk}
                      min="1"
                      name="price"
                      step="1"
                      type="number"
                      style={{ width: "80px" }}
                    />
                    <button className="button secondary small" disabled={busy} type="submit">
                      <CheckCircle2 size={14} />
                    </button>
                  </form>
                </td>
                <td>
                  <button
                    className="toggle-button"
                    onClick={() => toggleActive(product.id, product.is_active)}
                    title={product.is_active ? "Deactivate" : "Activate"}
                    type="button"
                  >
                    {product.is_active
                      ? <ToggleRight size={22} color="var(--accent)" />
                      : <ToggleLeft size={22} color="var(--muted)" />}
                  </button>
                </td>
                <td className="muted-label">{product.is_active ? copy.productActive : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form className="admin-form" onSubmit={addProduct} style={{ marginTop: "24px" }}>
        <h3>{copy.addProduct}</h3>
        <label className="field">
          <span>{copy.productSlug}</span>
          <input name="slug" placeholder="my-product" required type="text" />
        </label>
        <label className="field">
          <span>{copy.productName}</span>
          <input name="name" placeholder="My Product" required type="text" />
        </label>
        <label className="field">
          <span>{copy.productPrice}</span>
          <input min="1" name="price" placeholder="99" required step="1" type="number" />
        </label>
        <label className="field">
          <span>Category</span>
          <input name="category" placeholder="Workspace" type="text" />
        </label>
        <div className="upload-actions full">
          <button className="button primary" disabled={busy} type="submit">
            <PackagePlus size={18} />
            {copy.addProduct}
          </button>
        </div>
      </form>

      {message && <p className="form-note">{message}</p>}
    </section>
  );
}
