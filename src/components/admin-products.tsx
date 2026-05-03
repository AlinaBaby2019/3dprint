"use client";

import { type ChangeEvent, type FormEvent, Fragment, useEffect, useMemo, useRef, useState } from "react";
import { PackagePlus, Pencil, ToggleLeft, ToggleRight, X } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Json, Tables } from "@/lib/supabase/database.types";

type ProductRow = Tables<"products">;

type AdminProductsCopy = {
  productsTitle: string;
  noProducts: string;
  productActive: string;
  productPrice: string;
  productSlug: string;
  productName: string;
  addProduct: string;
  productEdit: string;
  productSave: string;
  productCancel: string;
  productNameDa: string;
  productNameEn: string;
  productNameZh: string;
  productDescDa: string;
  productDescEn: string;
  productDescZh: string;
  productImageUpload: string;
  productImageUploading: string;
  productVideo: string;
  productColors: string;
  productCustomizable: string;
  productLeadTime: string;
  saved: string;
  error: string;
};

function getLocaleStr(json: unknown, key: string): string {
  if (json && typeof json === "object") return String((json as Record<string, unknown>)[key] ?? "");
  return "";
}

function getMetaStr(json: unknown, key: string): string {
  if (json && typeof json === "object") {
    const val = (json as Record<string, unknown>)[key];
    if (Array.isArray(val)) return val.join(", ");
    return String(val ?? "");
  }
  return "";
}

function getMetaBool(json: unknown, key: string): boolean {
  if (json && typeof json === "object") return !!(json as Record<string, unknown>)[key];
  return false;
}

type FormValues = {
  slug: string;
  nameDa: string;
  nameEn: string;
  nameZh: string;
  descDa: string;
  descEn: string;
  descZh: string;
  price: string;
  category: string;
  imagePath: string;
  videoUrl: string;
  colors: string;
  customizable: boolean;
  leadTime: string;
};

const emptyForm: FormValues = {
  slug: "", nameDa: "", nameEn: "", nameZh: "",
  descDa: "", descEn: "", descZh: "",
  price: "", category: "", imagePath: "",
  videoUrl: "", colors: "", customizable: false, leadTime: "",
};

function productToForm(p: ProductRow): FormValues {
  return {
    slug: p.slug,
    nameDa: getLocaleStr(p.name, "da"),
    nameEn: getLocaleStr(p.name, "en"),
    nameZh: getLocaleStr(p.name, "zh"),
    descDa: getLocaleStr(p.description, "da"),
    descEn: getLocaleStr(p.description, "en"),
    descZh: getLocaleStr(p.description, "zh"),
    price: String(p.base_price_dkk),
    category: p.category ?? "",
    imagePath: p.image_path ?? "",
    videoUrl: getMetaStr(p.metadata, "video_url"),
    colors: getMetaStr(p.metadata, "colors"),
    customizable: getMetaBool(p.metadata, "customizable"),
    leadTime: getMetaStr(p.metadata, "lead_time_days"),
  };
}

function buildPayload(f: FormValues) {
  const colorsArr = f.colors.split(",").map((c) => c.trim()).filter(Boolean);
  const meta: Record<string, unknown> = {};
  if (f.videoUrl.trim()) meta.video_url = f.videoUrl.trim();
  if (colorsArr.length) meta.colors = colorsArr;
  if (f.customizable) meta.customizable = true;
  if (f.leadTime.trim()) meta.lead_time_days = f.leadTime.trim();
  const nameEn = f.nameEn.trim() || f.nameDa.trim();
  return {
    slug: f.slug.trim().toLowerCase().replace(/\s+/g, "-"),
    name: { da: f.nameDa.trim() || nameEn, en: nameEn, zh: f.nameZh.trim() || nameEn },
    description: { da: f.descDa.trim(), en: f.descEn.trim(), zh: f.descZh.trim() },
    base_price_dkk: Math.round(Number(f.price)),
    category: f.category.trim() || null,
    image_path: f.imagePath.trim() || null,
    metadata: meta as Json,
  };
}

export function AdminProducts({ copy }: { copy: AdminProductsCopy }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!supabase) return;
    void supabase.from("products").select("*").order("slug").then(({ data }) => {
      if (data) setProducts(data);
    });
  }, [supabase]);

  function startEdit(product: ProductRow) {
    setEditId(product.id);
    setForm(productToForm(product));
    setShowAdd(false);
    setMessage(null);
  }

  function startAdd() {
    setEditId(null);
    setForm(emptyForm);
    setShowAdd(true);
    setMessage(null);
  }

  function cancelEdit() {
    setEditId(null);
    setShowAdd(false);
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    setUploading(true);
    setMessage(null);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `products/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (upErr) { setMessage(upErr.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm((prev) => ({ ...prev, imagePath: publicUrl }));
    setUploading(false);
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !editId) return;
    const payload = buildPayload(form);
    if (!payload.slug || !payload.base_price_dkk) return;
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.from("products").update(payload).eq("id", editId);
    setBusy(false);
    if (error) { setMessage(copy.error); return; }
    setMessage(copy.saved);
    setProducts((prev) => prev.map((p) =>
      p.id === editId ? { ...p, ...payload, metadata: payload.metadata as ProductRow["metadata"] } : p
    ));
    setEditId(null);
  }

  async function saveAdd(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    const payload = buildPayload(form);
    if (!payload.slug || !payload.base_price_dkk) return;
    setBusy(true);
    setMessage(null);
    const { data: inserted, error } = await supabase
      .from("products")
      .insert({ ...payload, is_active: true })
      .select()
      .single();
    setBusy(false);
    if (error) { setMessage(copy.error); return; }
    setMessage(copy.saved);
    if (inserted) setProducts((prev) => [...prev, inserted]);
    setShowAdd(false);
    setForm(emptyForm);
  }

  async function toggleActive(id: string, current: boolean) {
    if (!supabase) return;
    const { error } = await supabase.from("products").update({ is_active: !current }).eq("id", id);
    if (!error) setProducts((prev) => prev.map((p) => p.id === id ? { ...p, is_active: !current } : p));
  }

  function set(key: keyof FormValues) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function ProductForm({ onSubmit, isAdd }: { onSubmit: (e: FormEvent) => void; isAdd: boolean }) {
    return (
      <form className="admin-product-form" onSubmit={onSubmit}>
        <div className="admin-product-grid">
          <label className="field">
            <span>{copy.productSlug}</span>
            <input disabled={!isAdd} onChange={set("slug")} placeholder="my-product" required type="text" value={form.slug} />
          </label>
          <label className="field">
            <span>{copy.productPrice}</span>
            <input min="1" onChange={set("price")} placeholder="99" required step="1" type="number" value={form.price} />
          </label>
          <label className="field">
            <span>Category</span>
            <input onChange={set("category")} placeholder="Workspace" type="text" value={form.category} />
          </label>
          <label className="field">
            <span>{copy.productLeadTime}</span>
            <input onChange={set("leadTime")} placeholder="2-3" type="text" value={form.leadTime} />
          </label>
        </div>

        <div className="admin-product-grid">
          <label className="field">
            <span>{copy.productNameDa}</span>
            <input onChange={set("nameDa")} placeholder="Dansk navn" type="text" value={form.nameDa} />
          </label>
          <label className="field">
            <span>{copy.productNameEn}</span>
            <input onChange={set("nameEn")} placeholder="English name" required type="text" value={form.nameEn} />
          </label>
          <label className="field">
            <span>{copy.productNameZh}</span>
            <input onChange={set("nameZh")} placeholder="中文名称" type="text" value={form.nameZh} />
          </label>
        </div>

        <div className="admin-product-grid">
          <label className="field">
            <span>{copy.productDescDa}</span>
            <textarea onChange={set("descDa")} placeholder="Dansk beskrivelse" rows={2} value={form.descDa} />
          </label>
          <label className="field">
            <span>{copy.productDescEn}</span>
            <textarea onChange={set("descEn")} placeholder="English description" rows={2} value={form.descEn} />
          </label>
          <label className="field">
            <span>{copy.productDescZh}</span>
            <textarea onChange={set("descZh")} placeholder="中文描述" rows={2} value={form.descZh} />
          </label>
        </div>

        <div className="admin-product-grid">
          <div>
            <label className="field">
              <span>{copy.productImageUpload}</span>
              <input accept="image/*" onChange={handleImageUpload} ref={fileRef} type="file" />
            </label>
            {uploading && <p className="form-note">{copy.productImageUploading}</p>}
            {form.imagePath && (
              <div className="admin-product-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="product preview" src={form.imagePath} />
              </div>
            )}
          </div>
          <label className="field">
            <span>{copy.productVideo}</span>
            <input onChange={set("videoUrl")} placeholder="https://youtube.com/..." type="text" value={form.videoUrl} />
          </label>
          <label className="field">
            <span>{copy.productColors}</span>
            <input onChange={set("colors")} placeholder="Red, Blue, Green" type="text" value={form.colors} />
          </label>
        </div>

        <label className="field-checkbox">
          <input
            checked={form.customizable}
            onChange={(e) => setForm((f) => ({ ...f, customizable: e.target.checked }))}
            type="checkbox"
          />
          <span>{copy.productCustomizable}</span>
        </label>

        <div className="upload-actions">
          <button className="button primary" disabled={busy || uploading} type="submit">
            {isAdd && <PackagePlus size={16} />}
            {copy.productSave}
          </button>
          <button className="button secondary" onClick={cancelEdit} type="button">
            {copy.productCancel}
          </button>
        </div>
      </form>
    );
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
              <Fragment key={product.id}>
                <tr>
                  <td>
                    <strong>{getLocaleStr(product.name, "en") || getLocaleStr(product.name, "da")}</strong>
                    <em className="muted-label"> ({product.slug})</em>
                    {product.category && <em className="muted-label"> · {product.category}</em>}
                    {product.image_path && <em className="muted-label"> · img</em>}
                  </td>
                  <td>{product.base_price_dkk} DKK</td>
                  <td>
                    <button
                      className="toggle-button"
                      onClick={() => void toggleActive(product.id, product.is_active)}
                      title={product.is_active ? "Deactivate" : "Activate"}
                      type="button"
                    >
                      {product.is_active
                        ? <ToggleRight color="var(--accent)" size={22} />
                        : <ToggleLeft color="var(--muted)" size={22} />}
                    </button>
                  </td>
                  <td>
                    {editId === product.id ? (
                      <button className="button secondary small" onClick={cancelEdit} type="button">
                        <X size={14} />
                      </button>
                    ) : (
                      <button className="button secondary small" onClick={() => startEdit(product)} type="button">
                        <Pencil size={14} />
                        {copy.productEdit}
                      </button>
                    )}
                  </td>
                </tr>
                {editId === product.id && (
                  <tr>
                    <td className="admin-product-edit-cell" colSpan={4}>
                      <ProductForm isAdd={false} onSubmit={(e) => void saveEdit(e)} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}

      {showAdd ? (
        <div className="admin-product-add-wrap">
          <h3 style={{ marginBottom: "12px" }}>{copy.addProduct}</h3>
          <ProductForm isAdd={true} onSubmit={(e) => void saveAdd(e)} />
        </div>
      ) : (
        <div style={{ marginTop: "16px" }}>
          <button className="button primary" onClick={startAdd} type="button">
            <PackagePlus size={16} />
            {copy.addProduct}
          </button>
        </div>
      )}

      {message && <p className="form-note" style={{ marginTop: "12px" }}>{message}</p>}
    </section>
  );
}
