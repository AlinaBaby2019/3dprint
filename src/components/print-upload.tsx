"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Box, CheckCircle2, FileUp, RotateCcw, Send } from "lucide-react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { formatBuildVolume, printerConfig } from "@/lib/print-config";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/browser";

type UploadCopy = {
  title: string;
  description: string;
  dropTitle: string;
  dropSubtitle: string;
  material: string;
  color: string;
  quality: string;
  quantity: string;
  delivery: string;
  estimate: string;
  submit: string;
  submitSuccess: string;
  submitViewAccount: string;
  submitPartial: string;
};

type Dimensions = {
  x: number;
  y: number;
  z: number;
};

const materialRates: Record<string, number> = {
  PLA: 1,
  PETG: 1.25,
  ASA: 1.6,
  TPU: 1.9
};

const qualityRates: Record<string, number> = {
  Draft: 0.85,
  Standard: 1,
  Fine: 1.35
};

const deliveryPrices: Record<string, number> = {
  Pickup: 0,
  "Local delivery": 59,
  Shipping: 79
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function estimatePrice(input: {
  fileSizeMb: number;
  hasPreview: boolean;
  material: string;
  quality: string;
  quantity: number;
  delivery: string;
}) {
  const setup = 75;
  const fileComplexity = Math.max(35, Math.ceil(input.fileSizeMb * 22));
  const previewDiscount = input.hasPreview ? 0 : 1.18;
  const unit =
    (setup + fileComplexity) *
    (materialRates[input.material] ?? 1) *
    (qualityRates[input.quality] ?? 1) *
    previewDiscount;
  const total = Math.ceil(unit * input.quantity + (deliveryPrices[input.delivery] ?? 0));

  return {
    low: Math.max(75, Math.ceil(total * 0.85)),
    high: Math.ceil(total * 1.25)
  };
}

export function PrintUpload({ copy, locale }: { copy: UploadCopy; locale: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [material, setMaterial] = useState("PLA");
  const [color, setColor] = useState("Black");
  const [quality, setQuality] = useState("Standard");
  const [quantity, setQuantity] = useState(1);
  const [delivery, setDelivery] = useState("Pickup");
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedProjectId, setSubmittedProjectId] = useState<string | null>(null);
  const [fileUploadFailed, setFileUploadFailed] = useState(false);

  const estimate = useMemo(() => {
    const fileSizeMb = file ? file.size / 1024 / 1024 : 1;
    return estimatePrice({
      fileSizeMb,
      hasPreview: Boolean(dimensions),
      material,
      quality,
      quantity,
      delivery
    });
  }, [delivery, dimensions, file, material, quality, quantity]);

  const clearPreview = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current.domElement.remove();
      rendererRef.current = null;
    }

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
  }, []);

  const renderPreview = useCallback(
    async (selectedFile: File) => {
      const mount = mountRef.current;
      if (!mount) {
        return;
      }

      clearPreview();
      setDimensions(null);
      setPreviewError(null);

      if (!selectedFile.name.toLowerCase().endsWith(".stl")) {
        setPreviewError("Preview is currently available for STL files. Other files can still be quoted.");
        return;
      }

      try {
        const buffer = await selectedFile.arrayBuffer();
        const loader = new STLLoader();
        const geometry = loader.parse(buffer);
        geometry.computeBoundingBox();
        geometry.computeVertexNormals();

        const box = geometry.boundingBox;
        if (!box) {
          throw new Error("Missing bounding box");
        }

        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);

        setDimensions({ x: size.x, y: size.y, z: size.z });

        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#f2f4ef");

        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 2000);
        const maxDimension = Math.max(size.x, size.y, size.z, 1);
        camera.position.set(maxDimension * 1.1, maxDimension * 0.95, maxDimension * 1.45);
        camera.lookAt(0, 0, 0);

        const materialPreview = new THREE.MeshStandardMaterial({
          color: material === "PLA" ? "#2f6f62" : "#4f6777",
          metalness: 0.05,
          roughness: 0.72
        });
        const mesh = new THREE.Mesh(geometry, materialPreview);
        mesh.rotation.x = -Math.PI / 2;
        scene.add(mesh);

        const ambient = new THREE.AmbientLight("#ffffff", 1.9);
        scene.add(ambient);
        const key = new THREE.DirectionalLight("#ffffff", 2.8);
        key.position.set(1, 2, 3);
        scene.add(key);

        const grid = new THREE.GridHelper(maxDimension * 1.6, 12, "#c9d1cc", "#dce2dd");
        grid.position.y = -maxDimension * 0.42;
        scene.add(grid);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        rendererRef.current = renderer;
        mount.appendChild(renderer.domElement);

        const resize = () => {
          if (!mount || !rendererRef.current) {
            return;
          }
          const width = mount.clientWidth;
          const height = mount.clientHeight;
          camera.aspect = width / Math.max(height, 1);
          camera.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
        };
        resize();

        const animate = () => {
          mesh.rotation.z += 0.006;
          renderer.render(scene, camera);
          animationRef.current = requestAnimationFrame(animate);
        };
        animate();

        const observer = new ResizeObserver(resize);
        observer.observe(mount);
        resizeObserverRef.current = observer;
      } catch {
        setPreviewError("The file could not be previewed. You can still submit it for manual review.");
      }
    },
    [clearPreview, material]
  );

  const handleFile = useCallback(
    (selectedFile: File | undefined) => {
      if (!selectedFile) {
        return;
      }

      const maxBytes = 100 * 1024 * 1024;
      if (selectedFile.size > maxBytes) {
        setSubmitMessage(`File is too large (${formatFileSize(selectedFile.size)}). Maximum is 100 MB.`);
        return;
      }

      setSubmitMessage(null);
      setFile(selectedFile);
    },
    []
  );

  useEffect(() => {
    if (file?.name.toLowerCase().endsWith(".stl")) {
      void renderPreview(file);
    }

    return () => clearPreview();
  }, [clearPreview, file, renderPreview]);

  const oversized =
    dimensions &&
    (dimensions.x > printerConfig.buildVolumeMm.x ||
      dimensions.y > printerConfig.buildVolumeMm.y ||
      dimensions.z > printerConfig.buildVolumeMm.z);

  const submitForReview = async () => {
    if (!file) {
      setSubmitMessage("Choose a file first.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setSubmitMessage(
        "Supabase is not configured on this server yet. The form is ready, but remote project upload is disabled."
      );
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setSubmitMessage("Supabase client is not available.");
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData.user;

    if (userError || !user) {
      setSubmitting(false);
      setSubmitMessage("Sign in from the account page before sending files for review.");
      return;
    }

    const materialId = material.toLowerCase();
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        type: "print_existing_model",
        status: "needs_review",
        title: file.name,
        selected_material: materialId,
        selected_color: color,
        selected_quality: quality,
        quantity,
        delivery_method: delivery,
        estimate_low_dkk: estimate.low,
        estimate_high_dkk: estimate.high,
        metadata: {
          dimensions,
          originalFileName: file.name
        }
      })
      .select("id")
      .single();

    if (projectError || !project) {
      setSubmitting(false);
      setSubmitMessage(projectError?.message ?? "Could not create project.");
      return;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.id}/projects/${project.id}/uploads/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(storagePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false
      });

    if (uploadError) {
      setSubmitting(false);
      setFileUploadFailed(true);
      setSubmittedProjectId(project.id);
      return;
    }

    await supabase.from("project_files").insert({
      project_id: project.id,
      user_id: user.id,
      role: "original_upload",
      storage_provider: "supabase",
      bucket: "project-files",
      path: storagePath,
      original_name: file.name,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      metadata: {
        dimensions
      }
    });

    // Fire-and-forget: send confirmation email via server route
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (accessToken) {
      void fetch("/api/projects/submit-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ projectId: project.id })
      });
    }

    setSubmitting(false);
    setFileUploadFailed(false);
    setSubmittedProjectId(project.id);
  };

  function resetForm() {
    setFile(null);
    setDimensions(null);
    setPreviewError(null);
    setSubmitMessage(null);
    setSubmittedProjectId(null);
    setFileUploadFailed(false);
    clearPreview();
  }

  if (submittedProjectId) {
    return (
      <section className="upload-panel">
        <div className="submit-success">
          <CheckCircle2 size={40} className={fileUploadFailed ? "icon-warning" : "icon-success"} />
          <div>
            <p className="submit-success-message">
              {fileUploadFailed
                ? `${copy.submitPartial} #${submittedProjectId.slice(0, 8)}`
                : copy.submitSuccess}
            </p>
            {!fileUploadFailed && (
              <p className="muted-label">#{submittedProjectId.slice(0, 8)}</p>
            )}
          </div>
          <div className="upload-actions">
            <Link className="btn btn--primary" href={`/${locale}/account`}>
              {copy.submitViewAccount}
            </Link>
            <button className="btn btn--secondary" onClick={resetForm} type="button">
              {copy.submit}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const materialOptions = ["PLA", "PETG", "ASA", "TPU"];
  const colorOptions = ["Black", "White", "Grey", "Custom color"];
  const qualityOptions = ["Draft", "Standard", "Fine"];
  const deliveryOptions: { id: string; price: number }[] = [
    { id: "Pickup", price: deliveryPrices.Pickup },
    { id: "Local delivery", price: deliveryPrices["Local delivery"] },
    { id: "Shipping", price: deliveryPrices.Shipping }
  ];

  const renderChip = (
    value: string,
    selected: string,
    onSelect: (v: string) => void,
    suffix?: string
  ) => (
    <button
      aria-pressed={selected === value}
      className="config-chip"
      key={value}
      onClick={() => onSelect(value)}
      type="button"
    >
      <span>{value}</span>
      {suffix && <span className="config-chip__price">{suffix}</span>}
    </button>
  );

  return (
    <section className="upload-panel">
      <header className="upload-panel-head">
        <h2 className="t-display-md">{copy.title}</h2>
        <p className="t-lead-airy">{copy.description}</p>
      </header>

      <label
        className="dropzone interactive"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFile(event.dataTransfer.files[0]);
        }}
      >
        <input
          accept=".stl,.3mf,.obj,.step,.stp,.jpg,.jpeg,.png,.webp,.pdf,.zip"
          className="file-input"
          onChange={(event) => handleFile(event.target.files?.[0])}
          type="file"
        />
        <div>
          <FileUp size={34} />
          <strong>{file ? file.name : copy.dropTitle}</strong>
          <span>{file ? `${formatFileSize(file.size)} · ready for review` : copy.dropSubtitle}</span>
        </div>
      </label>

      <div className="preview-shell">
        <div className="model-preview" ref={mountRef}>
          {!file && (
            <div className="preview-empty">
              <Box size={28} />
              <span>STL preview</span>
            </div>
          )}
          {previewError && <div className="preview-message">{previewError}</div>}
        </div>
        <div className="file-facts">
          <div>
            <span>Dimensions</span>
            <strong>
              {dimensions
                ? `${Math.round(dimensions.x)} x ${Math.round(dimensions.y)} x ${Math.round(
                    dimensions.z
                  )} mm`
                : "Waiting for STL"}
            </strong>
          </div>
          <div>
            <span>Build volume</span>
            <strong className={oversized ? "warning" : undefined}>
              {oversized ? "Needs review" : formatBuildVolume()}
            </strong>
          </div>
        </div>
      </div>

      <div className="configurator">
        <fieldset className="chip-group">
          <legend>{copy.material}</legend>
          <div className="chip-row">
            {materialOptions.map((opt) => renderChip(opt, material, setMaterial))}
          </div>
        </fieldset>

        <fieldset className="chip-group">
          <legend>{copy.color}</legend>
          <div className="chip-row">
            {colorOptions.map((opt) => renderChip(opt, color, setColor))}
          </div>
        </fieldset>

        <fieldset className="chip-group">
          <legend>{copy.quality}</legend>
          <div className="chip-row">
            {qualityOptions.map((opt) => renderChip(opt, quality, setQuality))}
          </div>
        </fieldset>

        <div className="quantity-row">
          <label className="field">
            <span>{copy.quantity}</span>
            <input
              min="1"
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
              type="number"
              value={quantity}
            />
          </label>
        </div>

        <fieldset className="chip-group">
          <legend>{copy.delivery}</legend>
          <div className="chip-row">
            {deliveryOptions.map(({ id, price }) =>
              renderChip(id, delivery, setDelivery, price === 0 ? "Free" : `+${price} DKK`)
            )}
          </div>
        </fieldset>
      </div>

      <div className="estimate">
        <span>{copy.estimate}</span>
        <strong>
          {estimate.low}-{estimate.high} DKK
        </strong>
      </div>

      <div className="upload-actions">
        <button
          className="btn btn--secondary"
          onClick={() => {
            if (file) {
              void renderPreview(file);
            }
          }}
          type="button"
        >
          <RotateCcw size={18} />
          Refresh preview
        </button>
        <button className="btn btn--primary" onClick={submitForReview} type="button">
          <Send size={18} />
          {submitting ? "Sending..." : copy.submit}
        </button>
      </div>

      {submitMessage && <p className="form-note">{submitMessage}</p>}
    </section>
  );
}

