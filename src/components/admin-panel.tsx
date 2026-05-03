"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ClipboardList, Download, FileText, Lock, Mail, RefreshCcw } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Database, Tables } from "@/lib/supabase/database.types";
import type { Locale } from "@/lib/i18n";

type StatusLabels = Record<string, string>;

type AdminCopy = {
  title: string;
  subtitle: string;
  locked: string;
  loading: string;
  refresh: string;
  queue: string;
  filterAll: string;
  detail: string;
  noProjects: string;
  customerContact: string;
  quote: string;
  amount: string;
  customerNotes: string;
  adminNotes: string;
  expiresAt: string;
  expectedAt: string;
  saveQuote: string;
  status: string;
  projectStatus: string;
  printStatus: string;
  saveStatus: string;
  files: string;
  noFiles: string;
  options: string;
  statuses: StatusLabels;
  latestQuote: string;
  download: string;
  sendQuoteEmail: string;
  messageSaved: string;
  messageError: string;
  messagesTitle: string;
  messagesEmpty: string;
  messagesPlaceholder: string;
  messagesSend: string;
  messagesInternal: string;
  messagesInternalBadge: string;
  photoTitle: string;
  photoUpload: string;
  photoUploading: string;
  photoUploaded: string;
};

type ProjectStatus = Database["public"]["Enums"]["project_status"];
type PrintJobStatus = Database["public"]["Enums"]["print_job_status"];

type AdminProject = Tables<"projects"> & {
  profiles: Pick<Tables<"profiles">, "full_name" | "customer_type" | "company_name" | "phone"> | null;
  project_files: Pick<
    Tables<"project_files">,
    "bucket" | "created_at" | "id" | "original_name" | "path" | "role" | "size_bytes"
  >[];
  quotes: Pick<
    Tables<"quotes">,
    | "admin_notes"
    | "amount_dkk"
    | "created_at"
    | "currency"
    | "customer_notes"
    | "expected_completion_at"
    | "expires_at"
    | "id"
    | "status"
  >[];
  print_jobs: Pick<
    Tables<"print_jobs">,
    "id" | "status" | "material_id" | "color" | "printer_name" | "updated_at"
  >[];
};

const projectStatuses: ProjectStatus[] = [
  "needs_review",
  "quoted",
  "approved",
  "in_production",
  "completed",
  "cancelled"
];

const printStatuses: PrintJobStatus[] = [
  "queued",
  "printing",
  "post_processing",
  "ready",
  "failed",
  "reprinting",
  "done"
];

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AdminPanel({ copy, locale }: { copy: AdminCopy; locale: Locale }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [projectMessages, setProjectMessages] = useState<{
    id: string; body: string; is_internal: boolean; created_at: string; user_id: string | null
  }[]>([]);
  const msgFormRef = useRef<HTMLFormElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const filteredProjects = statusFilter === "all"
    ? projects
    : projects.filter((p) => p.status === statusFilter);
  const selectedProject = filteredProjects.find((project) => project.id === selectedId) ?? filteredProjects[0];
  const latestQuote = selectedProject?.quotes[0];
  const latestPrintJob = selectedProject?.print_jobs[0];

  const loadProjects = useCallback(async () => {
    if (!supabase || !isAdmin) {
      return;
    }

    setBusy(true);
    setMessage(null);

    const { data, error } = await supabase
      .from("projects")
      .select(
        "*,profiles(full_name,customer_type,company_name,phone),project_files(id,bucket,created_at,original_name,path,role,size_bytes),quotes(id,status,amount_dkk,currency,customer_notes,admin_notes,expires_at,expected_completion_at,created_at),print_jobs(id,status,material_id,color,printer_name,updated_at)"
      )
      .order("created_at", { ascending: false })
      .limit(50);

    setBusy(false);

    if (error) {
      setMessage(error.message);
      setProjects([]);
      return;
    }

    const rows = (data ?? []) as AdminProject[];
    setProjects(rows);
    setSelectedId((current) => current ?? rows[0]?.id ?? null);
  }, [isAdmin, supabase]);

  useEffect(() => {
    if (!supabase) {
      setCheckingAccess(false);
      return;
    }

    const client = supabase;

    async function checkAccess() {
      const { data: userData } = await client.auth.getUser();
      const userId = userData.user?.id;
      setAdminUserId(userId ?? null);

      if (!userId) {
        setCheckingAccess(false);
        return;
      }

      const { data } = await client
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .maybeSingle();

      setIsAdmin(Boolean(data?.is_admin));
      setCheckingAccess(false);
    }

    void checkAccess();
  }, [supabase]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!supabase || !selectedProject) {
      setProjectMessages([]);
      return;
    }

    void supabase
      .from("messages")
      .select("id,body,is_internal,created_at,user_id")
      .eq("project_id", selectedProject.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setProjectMessages(data ?? []));
  }, [supabase, selectedProject]);

  async function sendProjectMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !selectedProject || !adminUserId) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const body = String(data.get("body") ?? "").trim();
    const isInternal = data.get("is_internal") === "on";
    if (!body) return;
    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({ project_id: selectedProject.id, user_id: adminUserId, body, is_internal: isInternal })
      .select("id,body,is_internal,created_at,user_id")
      .single();
    if (!error && inserted) {
      setProjectMessages((prev) => [...prev, inserted]);
      msgFormRef.current?.reset();
    }
  }

  async function saveQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !selectedProject || !adminUserId) {
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const amount = Number(data.get("amount"));

    if (!amount || amount < 0) {
      setMessage(copy.messageError);
      return;
    }

    setBusy(true);
    setMessage(null);

    const quotePayload = {
      project_id: selectedProject.id,
      status: "sent" as const,
      amount_dkk: Math.round(amount),
      currency: "DKK",
      customer_notes: String(data.get("customerNotes") ?? "").trim() || null,
      admin_notes: String(data.get("adminNotes") ?? "").trim() || null,
      expires_at: String(data.get("expiresAt") ?? "") || null,
      expected_completion_at: String(data.get("expectedAt") ?? "") || null,
      created_by: adminUserId
    };

    const result = latestQuote
      ? await supabase.from("quotes").update(quotePayload).eq("id", latestQuote.id)
      : await supabase.from("quotes").insert(quotePayload);

    if (!result.error) {
      await supabase.from("projects").update({ status: "quoted" }).eq("id", selectedProject.id);
    }

    setBusy(false);
    setMessage(result.error ? result.error.message : copy.messageSaved);
    await loadProjects();
  }

  async function downloadFile(bucket: string, path: string) {
    if (!supabase) {
      return;
    }

    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);

    if (error || !data) {
      setMessage(error?.message ?? "Could not generate download link.");
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  async function sendQuoteEmailNotification() {
    if (!supabase || !selectedProject) {
      return;
    }

    const quoteId = selectedProject.quotes[0]?.id;
    if (!quoteId) {
      setMessage(copy.messageError);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setMessage(copy.messageError);
      return;
    }

    setBusy(true);
    setMessage(null);

    const res = await fetch("/api/admin/notify-quote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ quoteId, locale })
    });

    setBusy(false);
    setMessage(res.ok ? copy.messageSaved : copy.messageError);
  }

  async function saveStatuses(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !selectedProject) {
      return;
    }

    const data = new FormData(event.currentTarget);
    const projectStatus = String(data.get("projectStatus")) as ProjectStatus;
    const printStatus = String(data.get("printStatus")) as PrintJobStatus;

    setBusy(true);
    setMessage(null);

    const { error: projectError } = await supabase
      .from("projects")
      .update({ status: projectStatus })
      .eq("id", selectedProject.id);

    if (projectError) {
      setBusy(false);
      setMessage(projectError.message);
      return;
    }

    const printPayload = {
      project_id: selectedProject.id,
      status: printStatus,
      material_id: selectedProject.selected_material,
      color: selectedProject.selected_color
    };

    const printResult = latestPrintJob
      ? await supabase.from("print_jobs").update(printPayload).eq("id", latestPrintJob.id)
      : await supabase.from("print_jobs").insert(printPayload);

    setBusy(false);
    setMessage(printResult.error ? printResult.error.message : copy.messageSaved);
    await loadProjects();
  }

  async function uploadPhoto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !selectedProject) return;
    const file = photoInputRef.current?.files?.[0];
    if (!file) return;

    setPhotoUploading(true);
    setMessage(null);

    const ext = file.name.split(".").pop() ?? "jpg";
    const timestamp = Date.now();
    const ownerUid = selectedProject.user_id ?? adminUserId ?? "admin";
    const path = `${ownerUid}/projects/${selectedProject.id}/photos/${timestamp}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from("project-files")
      .upload(path, file, { upsert: false });

    if (storageError) {
      setPhotoUploading(false);
      setMessage(storageError.message);
      return;
    }

    const { error: dbError } = await supabase.from("project_files").insert({
      project_id: selectedProject.id,
      user_id: selectedProject.user_id ?? adminUserId,
      bucket: "project-files",
      path,
      original_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      role: "final_photo",
      storage_provider: "supabase"
    });

    setPhotoUploading(false);

    if (dbError) {
      setMessage(dbError.message);
      return;
    }

    setMessage(copy.photoUploaded);
    if (photoInputRef.current) photoInputRef.current.value = "";
    await loadProjects();
  }

  if (checkingAccess) {
    return <p className="form-note">{copy.loading}</p>;
  }

  if (!isAdmin) {
    return (
      <section className="admin-locked">
        <Lock size={28} />
        <h1>{copy.title}</h1>
        <p>{copy.locked}</p>
      </section>
    );
  }

  return (
    <section className="admin-layout">
      <div className="admin-header">
        <div>
          <p className="eyebrow">{copy.title}</p>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <button className="button secondary" disabled={busy} onClick={() => void loadProjects()} type="button">
          <RefreshCcw size={18} />
          {copy.refresh}
        </button>
      </div>

      <div className="admin-grid">
        <aside className="panel admin-queue">
          <div className="admin-panel-title">
            <ClipboardList size={20} />
            <h2>{copy.queue}</h2>
          </div>

          <div className="admin-status-filters">
            <button
              className={`admin-filter-chip ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
              type="button"
            >
              {copy.filterAll}
            </button>
            {(["needs_review", "quoted", "approved", "in_production", "completed", "cancelled"] as ProjectStatus[]).map((s) => (
              <button
                className={`admin-filter-chip ${statusFilter === s ? "active" : ""}`}
                key={s}
                onClick={() => setStatusFilter(s)}
                type="button"
              >
                {copy.statuses[s] ?? formatStatus(s)}
              </button>
            ))}
          </div>

          {filteredProjects.length === 0 && <p className="empty-state">{copy.noProjects}</p>}

          <div className="admin-project-list">
            {filteredProjects.map((project) => (
              <button
                aria-current={project.id === selectedProject?.id ? "true" : undefined}
                className="admin-project-button"
                key={project.id}
                onClick={() => setSelectedId(project.id)}
                type="button"
              >
                <strong>{project.title ?? project.type}</strong>
                <span>{copy.statuses[project.status] ?? formatStatus(project.status)}</span>
                <em>{formatDate(project.created_at, locale)}</em>
              </button>
            ))}
          </div>
        </aside>

        <section className="panel admin-detail">
          <div className="admin-panel-title">
            <FileText size={20} />
            <h2>{copy.detail}</h2>
          </div>

          {selectedProject ? (
            <>
              <div className="admin-summary">
                <div>
                  <span>{copy.status}</span>
                  <strong>{formatStatus(selectedProject.status)}</strong>
                </div>
                <div>
                  <span>{copy.options}</span>
                  <strong>
                    {selectedProject.quantity} x{" "}
                    {selectedProject.selected_material?.toUpperCase() ?? "material"}
                  </strong>
                  <em>
                    {[selectedProject.selected_color, selectedProject.selected_quality, selectedProject.delivery_method]
                      .filter(Boolean)
                      .join(" · ")}
                  </em>
                </div>
                <div>
                  <span>{copy.latestQuote}</span>
                  <strong>
                    {latestQuote ? `${latestQuote.amount_dkk} ${latestQuote.currency}` : "Pending"}
                  </strong>
                  {latestQuote && <em>{formatStatus(latestQuote.status)}</em>}
                </div>
              </div>

              {selectedProject.profiles && (
                <div className="admin-customer-info">
                  <h3>{copy.customerContact}</h3>
                  <div className="admin-customer-grid">
                    {selectedProject.profiles.full_name && (
                      <span><em>Navn</em>{selectedProject.profiles.full_name}</span>
                    )}
                    {selectedProject.profiles.phone && (
                      <span><em>Tlf.</em>{selectedProject.profiles.phone}</span>
                    )}
                    {selectedProject.profiles.customer_type && (
                      <span><em>Type</em>{selectedProject.profiles.customer_type}</span>
                    )}
                    {selectedProject.profiles.company_name && (
                      <span><em>Firma</em>{selectedProject.profiles.company_name}</span>
                    )}
                    <span><em>User ID</em><code>{selectedProject.user_id}</code></span>
                  </div>
                </div>
              )}

              <div className="admin-files">
                <h3>{copy.files}</h3>
                {selectedProject.project_files.length === 0 && <p className="empty-state">{copy.noFiles}</p>}
                {selectedProject.project_files.map((file) => (
                  <div className="admin-file-row" key={file.id}>
                    <strong>{file.original_name}</strong>
                    <span>{file.role} · {formatFileSize(file.size_bytes)}</span>
                    <button
                      className="button secondary"
                      onClick={() => void downloadFile(file.bucket, file.path)}
                      type="button"
                    >
                      <Download size={15} />
                      {copy.download}
                    </button>
                  </div>
                ))}
              </div>

              <form className="admin-form" onSubmit={saveQuote}>
                <h3>{copy.quote}</h3>
                <label className="field">
                  <span>{copy.amount}</span>
                  <input defaultValue={latestQuote?.amount_dkk ?? ""} min="0" name="amount" required type="number" />
                </label>
                <label className="field full">
                  <span>{copy.customerNotes}</span>
                  <textarea defaultValue={latestQuote?.customer_notes ?? ""} name="customerNotes" rows={3} />
                </label>
                <label className="field full">
                  <span>{copy.adminNotes}</span>
                  <textarea defaultValue={latestQuote?.admin_notes ?? ""} name="adminNotes" rows={3} />
                </label>
                <label className="field">
                  <span>{copy.expiresAt}</span>
                  <input defaultValue={latestQuote?.expires_at?.slice(0, 16) ?? ""} name="expiresAt" type="datetime-local" />
                </label>
                <label className="field">
                  <span>{copy.expectedAt}</span>
                  <input defaultValue={latestQuote?.expected_completion_at?.slice(0, 16) ?? ""} name="expectedAt" type="datetime-local" />
                </label>
                <div className="upload-actions full">
                  <button className="button primary" disabled={busy} type="submit">
                    <CheckCircle2 size={18} />
                    {copy.saveQuote}
                  </button>
                  {latestQuote && (
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={sendQuoteEmailNotification}
                      type="button"
                    >
                      <Mail size={18} />
                      {copy.sendQuoteEmail}
                    </button>
                  )}
                </div>
              </form>

              <form className="admin-form compact" onSubmit={saveStatuses}>
                <h3>{copy.status}</h3>
                <label className="field">
                  <span>{copy.projectStatus}</span>
                  <select defaultValue={selectedProject.status} name="projectStatus">
                    {projectStatuses.map((status) => (
                      <option key={status} value={status}>{formatStatus(status)}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>{copy.printStatus}</span>
                  <select defaultValue={latestPrintJob?.status ?? "queued"} name="printStatus">
                    {printStatuses.map((status) => (
                      <option key={status} value={status}>{formatStatus(status)}</option>
                    ))}
                  </select>
                </label>
                <div className="upload-actions full">
                  <button className="button secondary" disabled={busy} type="submit">
                    {copy.saveStatus}
                  </button>
                </div>
              </form>

              <div className="admin-photos">
                <h3>{copy.photoTitle}</h3>
                {selectedProject.project_files.filter((f) => f.role === "final_photo").length === 0 ? (
                  <p className="empty-state muted-label">—</p>
                ) : (
                  <div className="admin-file-list">
                    {selectedProject.project_files
                      .filter((f) => f.role === "final_photo")
                      .map((file) => (
                        <div className="admin-file-row" key={file.id}>
                          <strong>{file.original_name}</strong>
                          <span>{formatFileSize(file.size_bytes)}</span>
                          <button
                            className="button secondary"
                            onClick={() => void downloadFile(file.bucket, file.path)}
                            type="button"
                          >
                            <Download size={15} />
                            {copy.download}
                          </button>
                        </div>
                      ))}
                  </div>
                )}
                <form className="admin-form compact" onSubmit={uploadPhoto}>
                  <label className="field full">
                    <span>{copy.photoUpload}</span>
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      name="photo"
                      ref={photoInputRef}
                      required
                      type="file"
                    />
                  </label>
                  <div className="upload-actions full">
                    <button className="button secondary" disabled={photoUploading} type="submit">
                      {photoUploading ? copy.photoUploading : copy.photoUpload}
                    </button>
                  </div>
                </form>
              </div>

              <div className="admin-messages">
                <h3>{copy.messagesTitle}</h3>
                {projectMessages.length === 0 ? (
                  <p className="empty-state">{copy.messagesEmpty}</p>
                ) : (
                  <div className="message-thread">
                    {projectMessages.map((msg) => (
                      <div
                        className={`message-bubble ${msg.user_id === adminUserId ? "message-mine" : "message-theirs"} ${msg.is_internal ? "message-internal" : ""}`}
                        key={msg.id}
                      >
                        {msg.is_internal && (
                          <span className="message-internal-badge">{copy.messagesInternalBadge}</span>
                        )}
                        <p>{msg.body}</p>
                        <time>{new Date(msg.created_at).toLocaleString(locale)}</time>
                      </div>
                    ))}
                  </div>
                )}
                <form className="message-form" onSubmit={sendProjectMessage} ref={msgFormRef}>
                  <textarea
                    name="body"
                    placeholder={copy.messagesPlaceholder}
                    required
                    rows={3}
                  />
                  <div className="message-form-actions">
                    <label className="checkbox-label">
                      <input name="is_internal" type="checkbox" />
                      {copy.messagesInternal}
                    </label>
                    <button className="button primary small" type="submit">
                      {copy.messagesSend}
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <p className="empty-state">{copy.noProjects}</p>
          )}

          {message && <p className="form-note">{message}</p>}
        </section>
      </div>
    </section>
  );
}
