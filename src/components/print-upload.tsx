"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, FileUp, RotateCcw, Send } from "lucide-react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
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

export function PrintUpload({ copy }: { copy: UploadCopy }) {
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
    dimensions && (dimensions.x > 256 || dimensions.y > 256 || dimensions.z > 260);

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
      setSubmitMessage(uploadError.message);
      return;
    }

    const { error: fileError } = await supabase.from("project_files").insert({
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

    setSubmitting(false);
    setSubmitMessage(
      fileError
        ? fileError.message
        : `Project submitted for review. Reference: ${project.id.slice(0, 8)}`
    );
  };

  return (
    <section className="panel upload-panel">
      <h2>{copy.title}</h2>
      <p>{copy.description}</p>

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
              {oversized ? "Needs review" : "256 x 256 x 260 mm"}
            </strong>
          </div>
        </div>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>{copy.material}</span>
          <select value={material} onChange={(event) => setMaterial(event.target.value)}>
            <option>PLA</option>
            <option>PETG</option>
            <option>ASA</option>
            <option>TPU</option>
          </select>
        </label>
        <label className="field">
          <span>{copy.color}</span>
          <select value={color} onChange={(event) => setColor(event.target.value)}>
            <option>Black</option>
            <option>White</option>
            <option>Grey</option>
            <option>Custom color</option>
          </select>
        </label>
        <label className="field">
          <span>{copy.quality}</span>
          <select value={quality} onChange={(event) => setQuality(event.target.value)}>
            <option>Draft</option>
            <option>Standard</option>
            <option>Fine</option>
          </select>
        </label>
        <label className="field">
          <span>{copy.quantity}</span>
          <input
            min="1"
            onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
            type="number"
            value={quantity}
          />
        </label>
        <label className="field full">
          <span>{copy.delivery}</span>
          <select value={delivery} onChange={(event) => setDelivery(event.target.value)}>
            <option>Pickup</option>
            <option>Local delivery</option>
            <option>Shipping</option>
          </select>
        </label>
      </div>

      <div className="estimate">
        <span>{copy.estimate}</span>
        <strong>
          {estimate.low}-{estimate.high} DKK
        </strong>
      </div>

      <div className="upload-actions">
        <button
          className="button secondary"
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
        <button className="button primary" onClick={submitForReview} type="button">
          <Send size={18} />
          {submitting ? "Sending..." : copy.submit}
        </button>
      </div>

      {submitMessage && <p className="form-note">{submitMessage}</p>}
    </section>
  );
}
