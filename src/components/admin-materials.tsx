"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, PackagePlus, ToggleLeft, ToggleRight } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Tables } from "@/lib/supabase/database.types";

type MaterialRow = Tables<"material_options">;
type ColorRow = Tables<"color_options">;

type AdminMaterialsCopy = {
  materialsTitle: string;
  colorsTitle: string;
  noMaterials: string;
  noColors: string;
  multiplier: string;
  active: string;
  inStock: string;
  saveMaterial: string;
  addColor: string;
  addColorName: string;
  addColorHex: string;
  addColorMaterial: string;
  saved: string;
  error: string;
};

export function AdminMaterials({ copy }: { copy: AdminMaterialsCopy }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [colors, setColors] = useState<ColorRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    void supabase
      .from("material_options")
      .select("*")
      .order("id")
      .then(({ data }) => {
        if (data) setMaterials(data);
      });
    void supabase
      .from("color_options")
      .select("*")
      .order("id")
      .then(({ data }) => {
        if (data) setColors(data);
      });
  }, [supabase]);

  async function toggleMaterialActive(id: string, current: boolean) {
    if (!supabase) return;
    const { error } = await supabase
      .from("material_options")
      .update({ is_active: !current })
      .eq("id", id);
    if (!error) {
      setMaterials((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_active: !current } : m))
      );
    }
  }

  async function saveMaterialMultiplier(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    if (!supabase) return;
    const form = event.currentTarget;
    const value = Number(new FormData(form).get("multiplier"));
    if (!value || value <= 0) return;
    setBusy(true);
    setMessage(null);
    const { error } = await supabase
      .from("material_options")
      .update({ multiplier: value })
      .eq("id", id);
    setBusy(false);
    setMessage(error ? copy.error : copy.saved);
    if (!error) {
      setMaterials((prev) =>
        prev.map((m) => (m.id === id ? { ...m, multiplier: value } : m))
      );
    }
  }

  async function toggleColorStock(id: string, current: boolean) {
    if (!supabase) return;
    const { error } = await supabase
      .from("color_options")
      .update({ in_stock: !current })
      .eq("id", id);
    if (!error) {
      setColors((prev) =>
        prev.map((c) => (c.id === id ? { ...c, in_stock: !current } : c))
      );
    }
  }

  async function addColor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const id = String(data.get("id") ?? "").trim().toLowerCase().replace(/\s+/g, "-");
    const name = String(data.get("name") ?? "").trim();
    const hex = String(data.get("hex") ?? "").trim() || null;
    const materialId = String(data.get("material_id") ?? "").trim() || null;
    if (!id || !name) return;
    setBusy(true);
    setMessage(null);
    const { data: inserted, error } = await supabase
      .from("color_options")
      .insert({ id, name, hex, material_id: materialId, in_stock: false })
      .select()
      .single();
    setBusy(false);
    setMessage(error ? copy.error : copy.saved);
    if (!error && inserted) {
      setColors((prev) => [...prev, inserted]);
      form.reset();
    }
  }

  return (
    <section className="admin-materials-section">
      <h2>{copy.materialsTitle}</h2>

      {materials.length === 0 ? (
        <p className="empty-state">{copy.noMaterials}</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{copy.multiplier}</th>
              <th>{copy.active}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {materials.map((mat) => (
              <tr key={mat.id}>
                <td><strong>{mat.name}</strong> <em className="muted-label">{mat.id}</em></td>
                <td>
                  <form className="inline-form" onSubmit={(e) => saveMaterialMultiplier(e, mat.id)}>
                    <input
                      defaultValue={mat.multiplier}
                      min="0.1"
                      name="multiplier"
                      step="0.05"
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
                    onClick={() => toggleMaterialActive(mat.id, mat.is_active)}
                    title={mat.is_active ? "Deactivate" : "Activate"}
                    type="button"
                  >
                    {mat.is_active
                      ? <ToggleRight size={22} color="var(--accent)" />
                      : <ToggleLeft size={22} color="var(--muted)" />}
                  </button>
                </td>
                <td className="muted-label">{mat.is_active ? copy.active : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ marginTop: "32px" }}>{copy.colorsTitle}</h2>

      {colors.length === 0 ? (
        <p className="empty-state">{copy.noColors}</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Hex</th>
              <th>{copy.inStock}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {colors.map((color) => (
              <tr key={color.id}>
                <td>
                  <span
                    style={{
                      display: "inline-block",
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: color.hex ?? "#ccc",
                      border: "1px solid var(--border)",
                      marginRight: 6,
                      verticalAlign: "middle"
                    }}
                  />
                  <strong>{color.name}</strong>
                  {color.material_id && <em className="muted-label"> ({color.material_id})</em>}
                </td>
                <td className="muted-label">{color.hex ?? "–"}</td>
                <td>
                  <button
                    className="toggle-button"
                    onClick={() => toggleColorStock(color.id, color.in_stock)}
                    title={color.in_stock ? "Out of stock" : "In stock"}
                    type="button"
                  >
                    {color.in_stock
                      ? <ToggleRight size={22} color="var(--accent)" />
                      : <ToggleLeft size={22} color="var(--muted)" />}
                  </button>
                </td>
                <td className="muted-label">{color.in_stock ? copy.inStock : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form className="admin-form" onSubmit={addColor} style={{ marginTop: "24px" }}>
        <h3>{copy.addColor}</h3>
        <label className="field">
          <span>ID</span>
          <input name="id" placeholder="red-pla" required type="text" />
        </label>
        <label className="field">
          <span>{copy.addColorName}</span>
          <input name="name" placeholder="Red" required type="text" />
        </label>
        <label className="field">
          <span>{copy.addColorHex}</span>
          <input name="hex" placeholder="#ef4444" type="text" />
        </label>
        <label className="field">
          <span>{copy.addColorMaterial}</span>
          <select name="material_id">
            <option value="">— any —</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </label>
        <div className="upload-actions full">
          <button className="button primary" disabled={busy} type="submit">
            <PackagePlus size={18} />
            {copy.addColor}
          </button>
        </div>
      </form>

      {message && <p className="form-note">{message}</p>}
    </section>
  );
}
