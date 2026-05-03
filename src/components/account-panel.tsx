"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Building2, Clock3, FileBox, LogOut, MapPin, RefreshCcw, Star, UserRound } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Locale } from "@/lib/i18n";
import type { Database, Tables } from "@/lib/supabase/database.types";

type CustomerType = Database["public"]["Enums"]["customer_type"];

type ProfileRow = Pick<
  Tables<"profiles">,
  "full_name" | "phone" | "customer_type" | "company_name" | "cvr" | "ean" | "invoice_email"
>;

type AccountCopy = {
  title: string;
  subtitle: string;
  email: string;
  password: string;
  confirmPassword: string;
  signIn: string;
  signUp: string;
  signOut: string;
  modeSignIn: string;
  modeSignUp: string;
  signUpHelp: string;
  signInHelp: string;
  passwordMismatch: string;
  projectsTitle: string;
  projectsEmpty: string;
  projectsError: string;
  projectsRefresh: string;
  estimateLabel: string;
  quoteLabel: string;
  submittedLabel: string;
  addressesTitle: string;
  addressesEmpty: string;
  addressesError: string;
  addressSaved: string;
  addressDefaultSaved: string;
  addressLabel: string;
  addressName: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  saveAddress: string;
  defaultAddress: string;
  makeDefault: string;
  acceptQuote: string;
  acceptingQuote: string;
  deliveryPickup: string;
  deliveryLocal: string;
  deliveryShipping: string;
  selectAddress: string;
  confirmAndPay: string;
  messagesTitle: string;
  messagesEmpty: string;
  messagesPlaceholder: string;
  messagesSend: string;
  photosTitle: string;
  photosButton: string;
  photosEmpty: string;
  profileTitle: string;
  statuses: Record<string, string>;
  profileFullName: string;
  profilePhone: string;
  profileCustomerType: string;
  profilePrivate: string;
  profileBusiness: string;
  profileCompanyName: string;
  profileCvr: string;
  profileEan: string;
  profileInvoiceEmail: string;
  saveProfile: string;
  profileSaved: string;
  profileError: string;
};

type ProjectRow = Pick<
  Tables<"projects">,
  | "id"
  | "created_at"
  | "delivery_method"
  | "estimate_high_dkk"
  | "estimate_low_dkk"
  | "quantity"
  | "selected_color"
  | "selected_material"
  | "selected_quality"
  | "status"
  | "title"
  | "type"
> & {
  quotes: Pick<
    Tables<"quotes">,
    "id" | "amount_dkk" | "currency" | "expected_completion_at" | "status"
  >[];
  project_files: Pick<Tables<"project_files">, "id" | "path" | "bucket" | "original_name" | "role">[];
};

type AddressRow = Tables<"addresses">;

function statusLabel(status: string, statuses: Record<string, string>): string {
  return statuses[status] ?? status.replaceAll("_", " ");
}

function statusBadgeClass(status: string): string {
  if (["completed", "paid", "fulfilled", "done", "accepted"].includes(status)) return "status-badge status-success";
  if (["in_production", "printing", "post_processing", "quoted", "sent", "approved"].includes(status)) return "status-badge status-info";
  if (["needs_review", "pending_payment", "queued", "reprinting", "uploaded", "draft"].includes(status)) return "status-badge status-warning";
  if (["cancelled", "declined", "failed", "expired", "refunded"].includes(status)) return "status-badge status-error";
  return "status-badge status-muted";
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function AccountPanel({ copy, locale }: { copy: AccountCopy; locale: Locale }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [projectsMessage, setProjectsMessage] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [addressesMessage, setAddressesMessage] = useState<string | null>(null);
  const [addressReloadKey, setAddressReloadKey] = useState(0);
  const [addressBusy, setAddressBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [expandedMsgProject, setExpandedMsgProject] = useState<string | null>(null);
  const [projectMessages, setProjectMessages] = useState<Map<string, { id: string; body: string; created_at: string; user_id: string | null }[]>>(new Map());
  const msgFormRef = useRef<HTMLFormElement>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [profileCustomerType, setProfileCustomerType] = useState<CustomerType>("private");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [expandedPhotosProject, setExpandedPhotosProject] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string[]>>(new Map());
  const [activeTab, setActiveTab] = useState<"profile" | "projects" | "addresses">("projects");
  const [pendingAccept, setPendingAccept] = useState<{ quoteId: string; deliveryMethod: string } | null>(null);
  const [pendingAcceptAddressId, setPendingAcceptAddressId] = useState<string>("");

  useEffect(() => {
    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }

    const client = supabase;

    async function loadInitialUser() {
      const { data } = await client.auth.getUser();
      setCurrentUserId(data.user?.id ?? null);
      setCurrentEmail(data.user?.email ?? null);
    }

    void loadInitialUser();

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user.id ?? null);
      setCurrentEmail(session?.user.email ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, [supabase]);

  const loadProjects = useCallback(async () => {
    if (!supabase || !currentEmail) {
      setProjects([]);
      return;
    }

    setProjectsMessage(null);

    const { data, error } = await supabase
      .from("projects")
      .select(
        "id,created_at,delivery_method,estimate_high_dkk,estimate_low_dkk,quantity,selected_color,selected_material,selected_quality,status,title,type,quotes(id,amount_dkk,currency,expected_completion_at,status),project_files(id,path,bucket,original_name,role)"
      )
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      setProjects([]);
      setProjectsMessage(copy.projectsError);
      return;
    }

    setProjects((data ?? []) as ProjectRow[]);
  }, [copy.projectsError, currentEmail, supabase]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!supabase || !currentUserId) {
      setAddresses([]);
      return;
    }

    const client = supabase;
    let cancelled = false;

    async function loadAddresses() {
      setAddressesMessage(null);

      const { data, error } = await client
        .from("addresses")
        .select("*")
        .eq("user_id", currentUserId!)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (cancelled) {
        return;
      }

      if (error) {
        setAddresses([]);
        setAddressesMessage(copy.addressesError);
        return;
      }

      setAddresses(data ?? []);
    }

    void loadAddresses();

    return () => {
      cancelled = true;
    };
  }, [addressReloadKey, copy.addressesError, currentUserId, supabase]);

  useEffect(() => {
    if (!supabase || !currentUserId) {
      setProfile(null);
      return;
    }

    void supabase
      .from("profiles")
      .select("full_name,phone,customer_type,company_name,cvr,ean,invoice_email")
      .eq("id", currentUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setProfileCustomerType(data.customer_type);
        }
      });
  }, [currentUserId, supabase]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !currentUserId) {
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload: Partial<ProfileRow> = {
      full_name: String(data.get("fullName") ?? "").trim() || null,
      phone: String(data.get("phone") ?? "").trim() || null,
      customer_type: profileCustomerType,
      company_name: String(data.get("companyName") ?? "").trim() || null,
      cvr: String(data.get("cvr") ?? "").trim() || null,
      ean: String(data.get("ean") ?? "").trim() || null,
      invoice_email: String(data.get("invoiceEmail") ?? "").trim() || null
    };

    setProfileBusy(true);
    setProfileMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", currentUserId);

    setProfileBusy(false);

    if (error) {
      setProfileMessage(copy.profileError);
      return;
    }

    setProfile((prev) => (prev ? { ...prev, ...payload } : null));
    setProfileMessage(copy.profileSaved);
  }

  async function togglePhotos(project: ProjectRow) {
    if (expandedPhotosProject === project.id) {
      setExpandedPhotosProject(null);
      return;
    }
    setExpandedPhotosProject(project.id);
    if (!supabase || photoUrls.has(project.id)) return;

    const photos = project.project_files.filter((f) => f.role === "final_photo");
    if (photos.length === 0) {
      setPhotoUrls((prev) => new Map(prev).set(project.id, []));
      return;
    }

    const { data } = await supabase.storage
      .from("project-files")
      .createSignedUrls(photos.map((f) => f.path), 3600);

    const urls = (data ?? []).map((item) => item.signedUrl).filter((u): u is string => Boolean(u));
    setPhotoUrls((prev) => new Map(prev).set(project.id, urls));
  }

  function readCredentials(form: HTMLFormElement) {
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");
    const authAction = mode;

    if (!email || !password) {
      setMessage("Enter email and password first.");
      return null;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return null;
    }

    if (authAction === "signUp" && password !== confirmPassword) {
      setMessage(copy.passwordMismatch);
      return null;
    }

    return { authAction, email, password };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    const credentials = readCredentials(event.currentTarget);
    if (!credentials) {
      return;
    }

    setBusy(true);
    setMessage(null);

    if (credentials.authAction === "signUp") {
      const { error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: `${window.location.origin}/${locale}/account`,
          data: {
            preferred_locale: locale
          }
        }
      });

      setBusy(false);
      setMessage(
        error ? error.message : "Account created. Check your email if confirmation is enabled."
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = `/${locale}`;
  }

  async function signOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setMessage("Signed out.");
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !currentUserId) {
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const label = String(data.get("addressLabel") ?? "").trim();
    const fullName = String(data.get("addressName") ?? "").trim();
    const line1 = String(data.get("addressLine1") ?? "").trim();
    const line2 = String(data.get("addressLine2") ?? "").trim();
    const postalCode = String(data.get("postalCode") ?? "").trim();
    const city = String(data.get("city") ?? "").trim();
    const country = String(data.get("country") ?? "Denmark").trim();
    const phone = String(data.get("phone") ?? "").trim();

    if (!label || !fullName || !line1 || !postalCode || !city || !country) {
      setAddressesMessage(copy.addressesError);
      return;
    }

    setAddressBusy(true);
    setAddressesMessage(null);

    const shouldBecomeDefault = addresses.length === 0;
    const { error } = await supabase.from("addresses").insert({
      user_id: currentUserId,
      label,
      full_name: fullName,
      line1,
      line2: line2 || null,
      postal_code: postalCode,
      city,
      country,
      phone: phone || null,
      is_default: shouldBecomeDefault
    });

    setAddressBusy(false);

    if (error) {
      setAddressesMessage(error.message);
      return;
    }

    form.reset();
    setAddressesMessage(copy.addressSaved);
    setAddressReloadKey((value) => value + 1);
  }

  async function makeDefaultAddress(addressId: string) {
    if (!supabase || !currentUserId) {
      return;
    }

    setAddressBusy(true);
    setAddressesMessage(null);

    const { error } = await supabase.rpc("set_default_address", { p_address_id: addressId });

    setAddressBusy(false);

    if (error) {
      setAddressesMessage(error.message);
      return;
    }

    setAddressesMessage(copy.addressDefaultSaved);
    setAddressReloadKey((value) => value + 1);
  }

  async function toggleMessages(projectId: string) {
    if (expandedMsgProject === projectId) {
      setExpandedMsgProject(null);
      return;
    }
    setExpandedMsgProject(projectId);
    if (!supabase || projectMessages.has(projectId)) return;
    const { data } = await supabase
      .from("messages")
      .select("id,body,created_at,user_id")
      .eq("project_id", projectId)
      .eq("is_internal", false)
      .order("created_at", { ascending: true });
    setProjectMessages((prev) => new Map(prev).set(projectId, data ?? []));
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>, projectId: string) {
    event.preventDefault();
    if (!supabase || !currentUserId) return;
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") ?? "").trim();
    if (!body) return;
    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({ project_id: projectId, user_id: currentUserId, body, is_internal: false })
      .select("id,body,created_at,user_id")
      .single();
    if (!error && inserted) {
      setProjectMessages((prev) => {
        const updated = new Map(prev);
        updated.set(projectId, [...(prev.get(projectId) ?? []), inserted]);
        return updated;
      });
      form.reset();
    }
  }

  async function acceptQuote(quoteId: string, addressId: string | null) {
    if (!supabase) {
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      return;
    }

    setBusy(true);
    setProjectsMessage(null);
    setPendingAccept(null);

    const acceptRes = await fetch(`/api/quotes/${quoteId}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ address_id: addressId })
    });

    if (!acceptRes.ok) {
      const body = await acceptRes.json() as { error?: string };
      setBusy(false);
      setProjectsMessage(body.error ?? "Error accepting quote");
      return;
    }

    const { orderId } = await acceptRes.json() as { orderId: string };

    const checkoutRes = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ orderId, locale })
    });

    setBusy(false);

    if (!checkoutRes.ok) {
      const body = await checkoutRes.json() as { error?: string };
      setProjectsMessage(body.error ?? "Error creating checkout");
      return;
    }

    const { url } = await checkoutRes.json() as { url: string };
    if (url) {
      window.location.href = url;
    }
  }

  return (
    <section className="account-layout">
      <div>
        <p className="eyebrow">{copy.title}</p>
        <h1>{copy.title}</h1>
        <p className="hero-copy">{copy.subtitle}</p>
      </div>

      <div className="panel account-panel">
        {currentEmail ? (
          <>
            <div className="signed-in">
              <UserRound size={32} />
              <div>
                <span>Signed in as</span>
                <strong>{currentEmail}</strong>
              </div>
              <button className="button secondary" onClick={signOut} type="button">
                <LogOut size={18} />
                {copy.signOut}
              </button>
            </div>

            <div className="account-tabs" role="tablist" aria-label="Account sections">
              <button
                aria-selected={activeTab === "projects"}
                className="account-tab"
                onClick={() => setActiveTab("projects")}
                role="tab"
                type="button"
              >
                <FileBox size={15} />
                {copy.projectsTitle}
                {projects.length > 0 && <span className="tab-badge">{projects.length}</span>}
              </button>
              <button
                aria-selected={activeTab === "addresses"}
                className="account-tab"
                onClick={() => setActiveTab("addresses")}
                role="tab"
                type="button"
              >
                <MapPin size={15} />
                {copy.addressesTitle}
              </button>
              <button
                aria-selected={activeTab === "profile"}
                className="account-tab"
                onClick={() => setActiveTab("profile")}
                role="tab"
                type="button"
              >
                <Building2 size={15} />
                {copy.profileTitle}
              </button>
            </div>

            {activeTab === "profile" && <section className="account-profile" aria-label={copy.profileTitle}>
              <div className="account-projects-head">
                <Building2 size={20} />
                <h2>{copy.profileTitle}</h2>
              </div>

              <form className="address-form" onSubmit={saveProfile}>
                <label className="field">
                  <span>{copy.profileFullName}</span>
                  <input defaultValue={profile?.full_name ?? ""} name="fullName" />
                </label>
                <label className="field">
                  <span>{copy.profilePhone}</span>
                  <input autoComplete="tel" defaultValue={profile?.phone ?? ""} name="phone" type="tel" />
                </label>
                <label className="field full">
                  <span>{copy.profileCustomerType}</span>
                  <select
                    name="customerType"
                    onChange={(e) => setProfileCustomerType(e.target.value as CustomerType)}
                    value={profileCustomerType}
                  >
                    <option value="private">{copy.profilePrivate}</option>
                    <option value="business">{copy.profileBusiness}</option>
                  </select>
                </label>
                {profileCustomerType === "business" && (
                  <>
                    <label className="field full">
                      <span>{copy.profileCompanyName}</span>
                      <input defaultValue={profile?.company_name ?? ""} name="companyName" />
                    </label>
                    <label className="field">
                      <span>{copy.profileCvr}</span>
                      <input defaultValue={profile?.cvr ?? ""} name="cvr" placeholder="12345678" />
                    </label>
                    <label className="field">
                      <span>{copy.profileEan}</span>
                      <input defaultValue={profile?.ean ?? ""} name="ean" placeholder="5790000000000" />
                    </label>
                    <label className="field full">
                      <span>{copy.profileInvoiceEmail}</span>
                      <input
                        autoComplete="email"
                        defaultValue={profile?.invoice_email ?? ""}
                        name="invoiceEmail"
                        type="email"
                      />
                    </label>
                  </>
                )}
                <div className="upload-actions full">
                  <button className="button primary" disabled={profileBusy} type="submit">
                    {copy.saveProfile}
                  </button>
                </div>
              </form>

              {profileMessage && <p className="form-note">{profileMessage}</p>}
            </section>}

            {activeTab === "projects" && <section className="account-projects" aria-label={copy.projectsTitle}>
              <div className="account-projects-head">
                <FileBox size={20} />
                <h2>{copy.projectsTitle}</h2>
                <button
                  className="button secondary small"
                  onClick={() => void loadProjects()}
                  type="button"
                >
                  <RefreshCcw size={14} />
                  {copy.projectsRefresh}
                </button>
              </div>

              {projectsMessage && <p className="form-note">{projectsMessage}</p>}

              {!projectsMessage && projects.length === 0 && (
                <p className="empty-state">{copy.projectsEmpty}</p>
              )}

              {projects.length > 0 && (
                <div className="project-list">
                  {projects.map((project) => {
                    const latestQuote = project.quotes[0];

                    return (
                      <article className="project-row" key={project.id}>
                        <div>
                          <div className="project-row-title">
                            <strong>{project.title ?? project.type}</strong>
                            <span className={statusBadgeClass(project.status)}>{statusLabel(project.status, copy.statuses)}</span>
                          </div>
                          <div className="project-meta">
                            <span>
                              <Clock3 size={14} />
                              {copy.submittedLabel} {formatDate(project.created_at, locale)}
                            </span>
                            <span>
                              {project.quantity} x{" "}
                              {project.selected_material?.toUpperCase() ?? "material"}
                              {project.selected_color ? `, ${project.selected_color}` : ""}
                            </span>
                            {project.selected_quality && <span>{project.selected_quality}</span>}
                            {project.delivery_method && (
                              <span>
                                {project.delivery_method === "Pickup"
                                  ? copy.deliveryPickup
                                  : project.delivery_method === "Local delivery"
                                    ? copy.deliveryLocal
                                    : copy.deliveryShipping}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="project-price">
                          <span>{latestQuote ? copy.quoteLabel : copy.estimateLabel}</span>
                          <strong>
                            {latestQuote
                              ? `${latestQuote.amount_dkk} ${latestQuote.currency}`
                              : project.estimate_low_dkk && project.estimate_high_dkk
                                ? `${project.estimate_low_dkk}-${project.estimate_high_dkk} DKK`
                                : "—"}
                          </strong>
                          {latestQuote && <em className={statusBadgeClass(latestQuote.status)}>{statusLabel(latestQuote.status, copy.statuses)}</em>}
                          {latestQuote?.status === "sent" && (
                            <button
                              className="button primary small"
                              disabled={busy}
                              onClick={() => {
                                if (project.delivery_method && project.delivery_method !== "Pickup") {
                                  setPendingAcceptAddressId(addresses[0]?.id ?? "");
                                  setPendingAccept({ quoteId: latestQuote.id, deliveryMethod: project.delivery_method });
                                } else {
                                  void acceptQuote(latestQuote.id, null);
                                }
                              }}
                              type="button"
                            >
                              {busy ? copy.acceptingQuote : copy.acceptQuote}
                            </button>
                          )}
                        </div>

                        {pendingAccept?.quoteId === latestQuote?.id && (
                          <div className="quote-address-picker">
                            <p className="form-label">{copy.selectAddress}</p>
                            {addresses.length === 0 ? (
                              <p className="form-note">{copy.addressesEmpty}</p>
                            ) : (
                              <select
                                className="field-select"
                                onChange={(e) => setPendingAcceptAddressId(e.target.value)}
                                value={pendingAcceptAddressId}
                              >
                                {addresses.map((addr) => (
                                  <option key={addr.id} value={addr.id}>
                                    {addr.label} — {addr.city}
                                  </option>
                                ))}
                              </select>
                            )}
                            <div className="upload-actions">
                              <button
                                className="button primary small"
                                disabled={busy || !pendingAcceptAddressId}
                                onClick={() => void acceptQuote(pendingAccept.quoteId, pendingAcceptAddressId)}
                                type="button"
                              >
                                {busy ? copy.acceptingQuote : copy.confirmAndPay}
                              </button>
                              <button
                                className="button secondary small"
                                onClick={() => setPendingAccept(null)}
                                type="button"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="project-messages-toggle">
                          <button
                            className="button secondary small"
                            onClick={() => toggleMessages(project.id)}
                            type="button"
                          >
                            {copy.messagesTitle}
                          </button>
                          {project.project_files.some((f) => f.role === "final_photo") && (
                            <button
                              className="button secondary small"
                              onClick={() => void togglePhotos(project)}
                              type="button"
                            >
                              {copy.photosButton}
                            </button>
                          )}
                        </div>

                        {expandedPhotosProject === project.id && (
                          <div className="project-photos">
                            <p className="form-label">{copy.photosTitle}</p>
                            {(photoUrls.get(project.id) ?? []).length === 0 ? (
                              <p className="empty-state">{copy.photosEmpty}</p>
                            ) : (
                              <div className="photo-grid">
                                {(photoUrls.get(project.id) ?? []).map((url) => (
                                  <a href={url} key={url} rel="noopener noreferrer" target="_blank">
                                    <div style={{ position: "relative", aspectRatio: "1", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--border)" }}>
                                      <Image
                                        alt="Production photo"
                                        fill
                                        src={url}
                                        style={{ objectFit: "cover" }}
                                        unoptimized
                                      />
                                    </div>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {expandedMsgProject === project.id && (
                          <div className="project-message-thread">
                            {(projectMessages.get(project.id) ?? []).length === 0 ? (
                              <p className="empty-state">{copy.messagesEmpty}</p>
                            ) : (
                              <div className="message-thread">
                                {(projectMessages.get(project.id) ?? []).map((msg) => (
                                  <div
                                    className={`message-bubble ${msg.user_id === currentUserId ? "message-mine" : "message-theirs"}`}
                                    key={msg.id}
                                  >
                                    <p>{msg.body}</p>
                                    <time>{new Date(msg.created_at).toLocaleString(locale)}</time>
                                  </div>
                                ))}
                              </div>
                            )}
                            <form
                              className="message-form"
                              onSubmit={(e) => sendMessage(e, project.id)}
                              ref={msgFormRef}
                            >
                              <textarea
                                name="body"
                                placeholder={copy.messagesPlaceholder}
                                required
                                rows={2}
                              />
                              <div className="message-form-actions">
                                <button className="button primary small" type="submit">
                                  {copy.messagesSend}
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>}

            {activeTab === "addresses" && <section className="account-addresses" aria-label={copy.addressesTitle}>
              <div className="account-projects-head">
                <MapPin size={20} />
                <h2>{copy.addressesTitle}</h2>
              </div>

              {addresses.length === 0 && !addressesMessage && (
                <p className="empty-state">{copy.addressesEmpty}</p>
              )}

              {addresses.length > 0 && (
                <div className="address-list">
                  {addresses.map((address) => (
                    <article className="address-row" key={address.id}>
                      <div>
                        <div className="address-row-title">
                          <strong>{address.label}</strong>
                          {address.is_default && (
                            <span>
                              <Star size={13} />
                              {copy.defaultAddress}
                            </span>
                          )}
                        </div>
                        <p>
                          {address.full_name}
                          <br />
                          {address.line1}
                          {address.line2 ? `, ${address.line2}` : ""}
                          <br />
                          {address.postal_code} {address.city}, {address.country}
                          {address.phone ? (
                            <>
                              <br />
                              {address.phone}
                            </>
                          ) : null}
                        </p>
                      </div>

                      {!address.is_default && (
                        <button
                          className="button secondary"
                          disabled={addressBusy}
                          onClick={() => void makeDefaultAddress(address.id)}
                          type="button"
                        >
                          <Star size={16} />
                          {copy.makeDefault}
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              )}

              <form className="address-form" onSubmit={saveAddress}>
                <label className="field">
                  <span>{copy.addressLabel}</span>
                  <input name="addressLabel" placeholder="Home" required />
                </label>
                <label className="field">
                  <span>{copy.addressName}</span>
                  <input autoComplete="name" name="addressName" required />
                </label>
                <label className="field full">
                  <span>{copy.addressLine1}</span>
                  <input autoComplete="address-line1" name="addressLine1" required />
                </label>
                <label className="field full">
                  <span>{copy.addressLine2}</span>
                  <input autoComplete="address-line2" name="addressLine2" />
                </label>
                <label className="field">
                  <span>{copy.postalCode}</span>
                  <input autoComplete="postal-code" name="postalCode" required />
                </label>
                <label className="field">
                  <span>{copy.city}</span>
                  <input autoComplete="address-level2" name="city" required />
                </label>
                <label className="field">
                  <span>{copy.country}</span>
                  <input autoComplete="country-name" defaultValue="Denmark" name="country" required />
                </label>
                <label className="field">
                  <span>{copy.phone}</span>
                  <input autoComplete="tel" name="phone" />
                </label>
                <div className="upload-actions full">
                  <button className="button primary" disabled={addressBusy} type="submit">
                    {copy.saveAddress}
                  </button>
                </div>
              </form>

              {addressesMessage && <p className="form-note">{addressesMessage}</p>}
            </section>}
          </>
        ) : (
          <form className="account-panel-form" onSubmit={handleSubmit}>
            <div className="auth-tabs" role="tablist" aria-label="Account action">
              <button
                aria-selected={mode === "signIn"}
                className="auth-tab"
                onClick={() => setMode("signIn")}
                role="tab"
                type="button"
              >
                {copy.modeSignIn}
              </button>
              <button
                aria-selected={mode === "signUp"}
                className="auth-tab"
                onClick={() => setMode("signUp")}
                role="tab"
                type="button"
              >
                {copy.modeSignUp}
              </button>
            </div>
            <p className="form-helper">{mode === "signUp" ? copy.signUpHelp : copy.signInHelp}</p>
            <label className="field">
              <span>{copy.email}</span>
              <input
                autoComplete="email"
                name="email"
                placeholder="name@example.com"
                required
                type="email"
              />
            </label>
            <label className="field">
              <span>{copy.password}</span>
              <input
                autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                minLength={6}
                name="password"
                placeholder="At least 6 characters"
                required
                type="password"
              />
            </label>
            {mode === "signUp" && (
              <label className="field">
                <span>{copy.confirmPassword}</span>
                <input
                  autoComplete="new-password"
                  minLength={6}
                  name="confirmPassword"
                  placeholder="Repeat password"
                  required
                  type="password"
                />
              </label>
            )}
            <div className="upload-actions">
              <button className="button primary wide" disabled={busy} type="submit">
                {mode === "signUp" ? copy.signUp : copy.signIn}
              </button>
            </div>
          </form>
        )}

        {message && <p className="form-note">{message}</p>}
      </div>
    </section>
  );
}
