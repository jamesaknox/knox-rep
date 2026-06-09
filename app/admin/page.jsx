"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const C = {
  charcoal: "#171717",
  warmWhite: "#F7F4EF",
  taupe: "#C8B8A6",
  gold: "#B98A44",
  brown: "#2A211B",
  line: "#E3DDD2",
};

const CATEGORIES = ["Interior", "Exterior", "Drone", "Twilight", "2D Floor Plans", "Virtual Staging", "Marketing"];

const usd = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;

function previewUrl(previewPath) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kc-previews/${previewPath}`;
}

// ── Authenticated API helper ──────────────────────────────────────────────────
async function api(path, method = "GET", body, token) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ── Login screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err || !data?.session) {
      setError(err?.message || "Login failed");
      setLoading(false);
    } else {
      onLogin(data.session);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.charcoal, display: "grid", placeItems: "center", fontFamily: "Inter, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');`}</style>
      <div style={{ background: C.warmWhite, borderRadius: 4, padding: "2.5rem", width: "min(100%, 400px)", borderTop: `3px solid ${C.gold}` }}>
        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 24, marginBottom: 6 }}>
          KNOX <span style={{ fontWeight: 500, color: C.gold }}>Creative</span>
        </div>
        <p style={{ fontSize: 13, color: C.brown, margin: "0 0 24px" }}>Admin dashboard</p>
        <form onSubmit={handleLogin}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required
            style={{ display: "block", width: "100%", padding: "11px 14px", marginBottom: 12, border: `1px solid ${C.line}`, borderRadius: 2, fontFamily: "Inter, sans-serif", fontSize: 14, boxSizing: "border-box" }} />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required
            style={{ display: "block", width: "100%", padding: "11px 14px", marginBottom: 18, border: `1px solid ${C.line}`, borderRadius: 2, fontFamily: "Inter, sans-serif", fontSize: 14, boxSizing: "border-box" }} />
          {error && <p style={{ color: "#c0392b", fontSize: 13, margin: "0 0 12px" }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width: "100%", background: C.charcoal, color: C.warmWhite, border: "none", borderRadius: 2, padding: "13px", fontSize: 13, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", cursor: loading ? "wait" : "pointer" }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Pac-Man deleting overlay ──────────────────────────────────────────────────
function PacManOverlay({ label = "Deleting photos…" }) {
  return (
    <>
      <style>{`
        @keyframes kc-chomp {
          0%,100% { clip-path: polygon(50% 50%,100% 18%,100% 0,0 0,0 100%,100% 100%,100% 82%); }
          50%      { clip-path: polygon(50% 50%,100% 48%,100% 0,0 0,0 100%,100% 100%,100% 52%); }
        }
        @keyframes kc-scoot {
          0%   { left: -60px; }
          100% { left: calc(100% + 20px); }
        }
        @keyframes kc-dot-eaten {
          0%   { opacity:1; transform:translateY(-50%) scale(1); }
          80%  { opacity:1; transform:translateY(-50%) scale(1); }
          100% { opacity:0; transform:translateY(-50%) scale(0); }
        }
      `}</style>
      <div style={{
        position: "absolute", inset: 0, zIndex: 20, borderRadius: 4,
        background: "rgba(247,244,239,0.93)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18,
      }}>
        <div style={{ position: "relative", width: "80%", maxWidth: 380, height: 56 }}>
          {/* Dots */}
          {[...Array(9)].map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              left: `${8 + i * 10.5}%`,
              top: "50%", transform: "translateY(-50%)",
              width: 11, height: 11,
              background: "#B98A44", borderRadius: "50%",
              animation: `kc-dot-eaten 2s ${i * 0.18}s infinite`,
            }} />
          ))}
          {/* Pac-Man */}
          <div style={{
            position: "absolute", top: "50%",
            width: 48, height: 48,
            marginTop: -24,
            background: "#F7C948",
            borderRadius: "50%",
            animation: "kc-chomp 0.28s infinite, kc-scoot 2s linear infinite",
          }} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#2A211B", letterSpacing: ".04em" }}>{label}</div>
      </div>
    </>
  );
}

// ── Photos modal ──────────────────────────────────────────────────────────────
function PhotosModal({ gallery, adminToken, onClose }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [category, setCategory] = useState("Interior");
  const [progress, setProgress] = useState({}); // { index: { status, pct, error } }
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const fileRef = useRef();
  const dragSrcRef = useRef(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    const data = await api(`/api/admin/media?galleryId=${gallery.id}`, "GET", null, adminToken);
    if (data.media) setMedia(data.media);
    setLoading(false);
  }, [gallery.id, adminToken]);

  useEffect(() => { loadMedia(); }, [loadMedia]);

  const addFiles = (files) => {
    const jpegs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setSelectedFiles((prev) => [...prev, ...jpegs]);
  };

  const removeSelected = (i) => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i));

  const uploadAll = async () => {
    if (!selectedFiles.length) return;
    setUploading(true);
    const initial = {};
    selectedFiles.forEach((_, i) => { initial[i] = { status: "pending", pct: 0 }; });
    setProgress(initial);

    const newMedia = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      try {
        // Step 1: get signed upload URL
        setProgress((p) => ({ ...p, [i]: { status: "uploading", pct: 10 } }));
        const urlRes = await api("/api/admin/upload-url", "POST", {
          galleryId: gallery.id,
          filename: file.name,
        }, adminToken);
        if (urlRes.error) throw new Error(urlRes.error);

        // Step 2: upload full-res directly to Supabase Storage
        const { error: upErr } = await supabase.storage
          .from("kc-full")
          .uploadToSignedUrl(urlRes.path, urlRes.uploadToken, file, { contentType: file.type });
        if (upErr) throw upErr;
        setProgress((p) => ({ ...p, [i]: { status: "processing", pct: 55 } }));

        // Step 3: server watermarks + creates preview + inserts DB row
        const procRes = await api("/api/admin/process-photo", "POST", {
          galleryId: gallery.id,
          fullPath: urlRes.path,
          category,
          label: file.name.replace(/\.[^.]+$/, ""),
          sortOrder: media.length + newMedia.length,
        }, adminToken);
        if (procRes.error) throw new Error(procRes.error);
        setProgress((p) => ({ ...p, [i]: { status: "done", pct: 100 } }));
        newMedia.push(procRes.media);
      } catch (err) {
        setProgress((p) => ({ ...p, [i]: { status: "error", pct: 0, error: err.message || "Upload failed" } }));
      }
    }

    setMedia((prev) => [...prev, ...newMedia.filter(Boolean)]);
    setSelectedFiles([]);
    setUploading(false);
  };

  const deleteMedia = async (id) => {
    if (!confirm("Delete this photo? This cannot be undone.")) return;
    await api("/api/admin/media", "DELETE", { id }, adminToken);
    setMedia((prev) => prev.filter((m) => m.id !== id));
    setCheckedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
  };

  const toggleCheck = (id) => setCheckedIds((prev) => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });

  const toggleSelectAll = () => {
    setCheckedIds(checkedIds.size === media.length ? new Set() : new Set(media.map(m => m.id)));
  };

  const deleteSelected = async () => {
    if (!checkedIds.size) return;
    if (!confirm(`Delete ${checkedIds.size} photo${checkedIds.size !== 1 ? "s" : ""}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    for (const id of checkedIds) {
      await api("/api/admin/media", "DELETE", { id }, adminToken);
    }
    setMedia((prev) => prev.filter((m) => !checkedIds.has(m.id)));
    setCheckedIds(new Set());
    setBulkDeleting(false);
  };

  const deleteAll = async () => {
    if (!media.length) return;
    if (!confirm(`Delete all ${media.length} photos from this gallery? This cannot be undone.`)) return;
    setBulkDeleting(true);
    for (const m of media) {
      await api("/api/admin/media", "DELETE", { id: m.id }, adminToken);
    }
    setMedia([]);
    setCheckedIds(new Set());
    setBulkDeleting(false);
  };

  const setHero = async (m) => {
    const result = await api("/api/admin/media", "PATCH", { id: m.id, gallery_id: gallery.id }, adminToken);
    if (result.media) {
      setMedia((prev) => prev.map((x) => ({ ...x, is_hero: x.id === m.id })));
    }
  };

  // ── Drag-to-reorder handlers ──
  const handleDragStart = (e, idx) => {
    dragSrcRef.current = idx;
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  };
  const handleDrop = async (e, dropIdx) => {
    e.preventDefault();
    const srcIdx = dragSrcRef.current;
    setDragOverIdx(null);
    dragSrcRef.current = null;
    if (srcIdx === null || srcIdx === dropIdx) return;
    const next = [...media];
    const [item] = next.splice(srcIdx, 1);
    next.splice(dropIdx, 0, item);
    setMedia(next);
    await api("/api/admin/media-sort", "POST", { updates: next.map((m, i) => ({ id: m.id, sort_order: i })) }, adminToken);
  };
  const handleDragEnd = () => { dragSrcRef.current = null; setDragOverIdx(null); };

  const inp = { border: `1px solid ${C.line}`, borderRadius: 2, padding: "9px 12px", fontFamily: "Inter, sans-serif", fontSize: 13, width: "100%", boxSizing: "border-box" };
  const label = { fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: C.brown, display: "block", marginBottom: 5 };

  const catColor = { Interior: "#2980b9", Exterior: "#27ae60", Drone: "#8e44ad", Twilight: "#c0392b", "2D Floor Plans": "#e67e22", "Virtual Staging": "#16a085", Marketing: C.gold };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(23,23,23,.65)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px 16px", zIndex: 50, overflowY: "auto" }}>
      <div style={{ background: C.warmWhite, borderRadius: 4, width: "100%", maxWidth: 860, borderTop: `3px solid ${C.gold}`, marginTop: 20, marginBottom: 20 }}>

        {/* Header */}
        <div style={{ padding: "1.5rem 1.75rem 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 22, margin: "0 0 4px" }}>Photos</h3>
            <p style={{ fontSize: 13, color: C.brown, margin: 0 }}>{gallery.address}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.taupe, lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {/* Upload zone */}
        <div style={{ padding: "1.25rem 1.75rem", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end", marginBottom: 12 }}>
            <div>
              <label style={label}>Category</label>
              <select style={inp} value={category} onChange={(e) => setCategory(e.target.value)} disabled={uploading}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{ ...btnOutline, padding: "9px 16px", whiteSpace: "nowrap" }}
            >
              Choose Files
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
            onChange={(e) => addFiles(e.target.files)} />

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            onClick={() => !selectedFiles.length && fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? C.gold : C.line}`,
              borderRadius: 3,
              padding: "18px 16px",
              background: dragOver ? "#faf7f1" : "#fff",
              cursor: selectedFiles.length ? "default" : "pointer",
              transition: "border-color .15s, background .15s",
              minHeight: selectedFiles.length ? "auto" : 72,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {selectedFiles.length === 0 ? (
              <p style={{ textAlign: "center", color: C.taupe, fontSize: 13, margin: 0 }}>
                Drag &amp; drop photos here, or click to choose
              </p>
            ) : (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {selectedFiles.map((f, i) => {
                    const prog = progress[i];
                    return (
                      <div key={i} style={{ position: "relative", width: 80, height: 80, borderRadius: 2, overflow: "hidden", border: `1px solid ${prog?.status === "done" ? "#27ae60" : C.line}`, background: "#f0ece5" }}>
                        <img src={URL.createObjectURL(f)} alt={f.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        {/* Staged: show queued ✓ once file is in memory, before upload */}
                        {!prog && (
                          <div style={{ position: "absolute", inset: 0, background: "rgba(247,244,239,.52)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ color: "#27ae60", fontSize: 22, fontWeight: 700, filter: "drop-shadow(0 1px 2px rgba(0,0,0,.25))" }}>✓</span>
                          </div>
                        )}
                        {/* Upload progress overlay */}
                        {prog && (
                          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}>
                            {prog.status === "done" ? (
                              <span style={{ color: "#2ecc71", fontSize: 20 }}>✓</span>
                            ) : prog.status === "error" ? (
                              <span style={{ color: "#e74c3c", fontSize: 20 }}>✕</span>
                            ) : (
                              <span style={{ color: "#fff", fontSize: 11 }}>{prog.status === "processing" ? "Processing…" : `${prog.pct}%`}</span>
                            )}
                          </div>
                        )}
                        {/* Remove button — always on top */}
                        {!uploading && (
                          <button onClick={() => removeSelected(i)}
                            style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,.6)", color: "#fff", border: "none", fontSize: 11, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 }}>
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontSize: 12, color: C.brown }}>{selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {!uploading && (
                      <button onClick={() => setSelectedFiles([])} style={{ ...btnOutline, padding: "7px 14px" }}>Clear</button>
                    )}
                    <button onClick={uploadAll} disabled={uploading}
                      style={{ ...btnSolid, padding: "7px 18px", background: C.gold, borderColor: C.gold, color: C.charcoal }}>
                      {uploading ? "Uploading…" : `Upload ${selectedFiles.length} Photo${selectedFiles.length !== 1 ? "s" : ""}`}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Existing photos grid */}
        <div style={{ padding: "1.25rem 1.75rem 1.75rem", position: "relative" }}>
          {bulkDeleting && <PacManOverlay label={`Deleting photos…`} />}
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: C.brown }}>
                {loading ? "Loading…" : `${media.length} Photo${media.length !== 1 ? "s" : ""}`}
              </span>
              {!loading && media.length > 0 && (
                <button onClick={toggleSelectAll} style={{ ...btnOutline, padding: "4px 10px", fontSize: 12 }}>
                  {checkedIds.size === media.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>
            {!loading && media.length > 0 && (
              <div style={{ display: "flex", gap: 8 }}>
                {checkedIds.size > 0 && (
                  <button onClick={deleteSelected} disabled={bulkDeleting}
                    style={{ ...btnOutline, padding: "6px 14px", fontSize: 12, borderColor: "#c0392b", color: "#c0392b" }}>
                    {bulkDeleting ? "Deleting…" : `Delete Selected (${checkedIds.size})`}
                  </button>
                )}
                <button onClick={deleteAll} disabled={bulkDeleting}
                  style={{ ...btnOutline, padding: "6px 14px", fontSize: 12, borderColor: "#c0392b", color: "#c0392b" }}>
                  {bulkDeleting ? "Deleting…" : "Delete All"}
                </button>
              </div>
            )}
          </div>

          {!loading && media.length === 0 && (
            <p style={{ color: C.taupe, fontSize: 13 }}>No photos yet — upload your first batch above.</p>
          )}
          {!loading && media.length > 0 && (
            <p style={{ fontSize: 11, color: C.taupe, margin: "-6px 0 10px", letterSpacing: ".04em" }}>
              ↕ Drag photos to reorder — order is saved automatically.
            </p>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {media.map((m, i) => {
              const checked = checkedIds.has(m.id);
              const isOver = dragOverIdx === i;
              return (
                <div key={m.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={(e) => handleDrop(e, i)}
                  onDragEnd={handleDragEnd}
                  onClick={() => toggleCheck(m.id)}
                  style={{ borderRadius: 2, overflow: "hidden", border: `2px solid ${isOver ? C.gold : checked ? C.gold : C.line}`, background: "#fff", position: "relative", cursor: "grab", transition: "border-color .1s, box-shadow .1s", boxShadow: isOver ? `0 0 0 2px ${C.gold}` : "none" }}>
                  {/* Checkbox overlay */}
                  <div style={{ position: "absolute", top: 6, left: 6, zIndex: 2, width: 18, height: 18, borderRadius: 3, background: checked ? C.gold : "rgba(255,255,255,.85)", border: `2px solid ${checked ? C.gold : C.taupe}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {checked && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1, fontWeight: 700 }}>✓</span>}
                  </div>
                  <img
                    src={previewUrl(m.preview_path)}
                    alt={m.label || ""}
                    style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }}
                    loading="lazy"
                  />
                  {/* Hero badge overlay */}
                  {m.is_hero && (
                    <div style={{ position: "absolute", top: 28, left: 6, zIndex: 2, background: "rgba(185,138,68,.92)", borderRadius: 2, padding: "1px 5px", fontSize: 9, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "#fff" }}>
                      HERO
                    </div>
                  )}
                  <div style={{ padding: "7px 8px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase",
                      color: catColor[m.category] || C.brown, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {m.category}
                    </span>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button onClick={(e) => { e.stopPropagation(); setHero(m); }}
                        style={{ background: "none", border: "none", color: m.is_hero ? C.gold : C.taupe, fontSize: 15, cursor: "pointer", lineHeight: 1, padding: 0 }}
                        title={m.is_hero ? "Hero image (click to change)" : "Set as hero image"}>
                        {m.is_hero ? "★" : "☆"}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteMedia(m.id); }}
                        style={{ background: "none", border: "none", color: C.taupe, fontSize: 14, cursor: "pointer", lineHeight: 1, padding: 0 }}
                        title="Delete">
                        🗑
                      </button>
                    </div>
                  </div>
                  {m.label && (
                    <div style={{ padding: "0 8px 8px", fontSize: 11, color: C.brown, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {m.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Gallery modal form ────────────────────────────────────────────────────────
function GalleryModal({ gallery, agents, token, onSave, onClose }) {
  const isNew = !gallery?.id;
  const [form, setForm] = useState({
    address: gallery?.address || "",
    city: gallery?.city || "Athens",
    state: gallery?.state || "TN",
    zip: gallery?.zip || "",
    sqft: gallery?.sqft || "",
    beds: gallery?.beds || "",
    baths: gallery?.baths || "",
    agent_id: gallery?.agent_id || "",
    total_dollars: gallery?.total_cents ? (gallery.total_cents / 100).toFixed(2) : "",
    deposit_dollars: gallery?.deposit_cents ? (gallery.deposit_cents / 100).toFixed(2) : "",
    status: gallery?.status || "preparing",
    shoot_date: gallery?.shoot_date || "",
    description: gallery?.description || "",
    link_virtual_tour: gallery?.link_virtual_tour || "",
    link_floorplan_3d: gallery?.link_floorplan_3d || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    const { total_dollars, deposit_dollars, ...rest } = form;
    const body = {
      ...rest,
      sqft: form.sqft ? Number(form.sqft) : null,
      beds: form.beds ? Number(form.beds) : null,
      baths: form.baths ? Number(form.baths) : null,
      total_cents: Math.round((parseFloat(total_dollars) || 0) * 100),
      deposit_cents: Math.round((parseFloat(deposit_dollars) || 0) * 100),
      agent_id: form.agent_id || null,
    };
    if (!isNew) body.id = gallery.id;
    const data = await api(
      "/api/admin/galleries",
      isNew ? "POST" : "PATCH",
      body,
      token
    );
    setSaving(false);
    if (data.gallery) onSave(data.gallery);
  };

  const inp = { border: `1px solid ${C.line}`, borderRadius: 2, padding: "9px 12px", fontFamily: "Inter, sans-serif", fontSize: 13, width: "100%", boxSizing: "border-box" };
  const label = { fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: C.brown, display: "block", marginBottom: 5 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(23,23,23,.6)", display: "grid", placeItems: "center", padding: 20, zIndex: 50, overflowY: "auto" }}>
      <div style={{ background: C.warmWhite, borderRadius: 4, maxWidth: 600, width: "100%", padding: "2rem", borderTop: `3px solid ${C.gold}` }}>
        <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 22, margin: "0 0 20px" }}>{isNew ? "New Gallery" : "Edit Gallery"}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}><label style={label}>Address</label><input style={inp} value={form.address} onChange={set("address")} placeholder="242 Fyke Dr" /></div>
          <div><label style={label}>City</label><input style={inp} value={form.city} onChange={set("city")} /></div>
          <div><label style={label}>ZIP</label><input style={inp} value={form.zip} onChange={set("zip")} /></div>
          <div><label style={label}>Sq Ft</label><input style={inp} type="number" value={form.sqft} onChange={set("sqft")} /></div>
          <div><label style={label}>Beds</label><input style={inp} type="number" value={form.beds} onChange={set("beds")} /></div>
          <div><label style={label}>Baths</label><input style={inp} type="number" step="0.5" value={form.baths} onChange={set("baths")} /></div>
          <div><label style={label}>Shoot Date</label><input style={inp} type="date" value={form.shoot_date} onChange={set("shoot_date")} /></div>
          <div>
            <label style={label}>Agent</label>
            <select style={inp} value={form.agent_id} onChange={set("agent_id")}>
              <option value="">— none —</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Status</label>
            <select style={inp} value={form.status} onChange={set("status")}>
              <option value="preparing">Preparing</option>
              <option value="delivery_only">Delivery Only</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label style={label}>Total ($)</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.brown, fontSize: 13 }}>$</span>
              <input style={{ ...inp, paddingLeft: 22 }} type="number" min="0" step="0.01" value={form.total_dollars} onChange={set("total_dollars")} placeholder="425.00" />
            </div>
          </div>
          <div>
            <label style={label}>Deposit ($)</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.brown, fontSize: 13 }}>$</span>
              <input style={{ ...inp, paddingLeft: 22 }} type="number" min="0" step="0.01" value={form.deposit_dollars} onChange={set("deposit_dollars")} placeholder="100.00" />
            </div>
          </div>
          <div style={{ gridColumn: "1/-1" }}><label style={label}>Virtual Tour URL</label><input style={inp} value={form.link_virtual_tour} onChange={set("link_virtual_tour")} placeholder="https://tour.giraffe360.com/…" /></div>
          <div style={{ gridColumn: "1/-1" }}><label style={label}>3D Floor Plan URL</label><input style={inp} value={form.link_floorplan_3d} onChange={set("link_floorplan_3d")} placeholder="https://my.giraffe360.com/…" /></div>
          <div style={{ gridColumn: "1/-1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
              <label style={{ ...label, marginBottom: 0 }}>Description</label>
              <span style={{ fontSize: 11, color: form.description.length > 500 ? "#c0392b" : C.brown }}>{form.description.length} chars</span>
            </div>
            <textarea style={{ ...inp, height: 140, resize: "vertical" }} value={form.description} onChange={set("description")} placeholder="Describe the property…" />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...btnOutline, padding: "10px 20px" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ ...btnSolid, padding: "10px 24px" }}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Agent modal form ──────────────────────────────────────────────────────────
function AgentModal({ agent, token, onSave, onDelete, onClose }) {
  const isNew = !agent?.id;
  const [form, setForm] = useState({
    name: agent?.name || "",
    email: agent?.email || "",
    phone: agent?.phone || "",
    brokerage: agent?.brokerage || "",
    brokerage_phone: agent?.brokerage_phone || "",
    facebook_url: agent?.facebook_url || "",
    instagram_url: agent?.instagram_url || "",
    youtube_url: agent?.youtube_url || "",
    linkedin_url: agent?.linkedin_url || "",
    tiktok_url: agent?.tiktok_url || "",
  });
  const [headshotPreview, setHeadshotPreview] = useState(agent?.headshot_url || null);
  const [headshotFile, setHeadshotFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const inp = { border: `1px solid ${C.line}`, borderRadius: 2, padding: "9px 12px", fontFamily: "Inter, sans-serif", fontSize: 13, width: "100%", boxSizing: "border-box" };
  const label = { fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: C.brown, display: "block", marginBottom: 5 };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setHeadshotFile(f);
    setHeadshotPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let headshot_url = agent?.headshot_url || null;

      if (headshotFile) {
        const fd = new FormData();
        fd.append("file", headshotFile);
        const res = await fetch("/api/admin/upload-headshot", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const result = await res.json();
        if (result.url) headshot_url = result.url;
        else console.error("Headshot upload failed:", result);
      }

      const body = isNew
        ? { ...form, headshot_url }
        : { id: agent.id, ...form, headshot_url };
      const data = await api("/api/admin/agents", isNew ? "POST" : "PATCH", body, token);
      if (data.agent) onSave(data.agent);
    } catch (e) {
      console.error("Agent save error:", e);
      alert("Something went wrong. Check the console for details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${form.name || "this agent"}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api("/api/admin/agents", "DELETE", { id: agent.id }, token);
      onDelete(agent.id);
    } catch (e) {
      console.error("Agent delete error:", e);
      alert("Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(23,23,23,.6)", display: "grid", placeItems: "center", padding: 20, zIndex: 50 }}>
      <div style={{ background: C.warmWhite, borderRadius: 4, maxWidth: 480, width: "100%", padding: "2rem", borderTop: `3px solid ${C.gold}` }}>
        <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 22, margin: "0 0 20px" }}>{isNew ? "New Agent" : "Edit Agent"}</h3>

        {/* Headshot picker */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", cursor: "pointer", flex: "0 0 auto", border: `2px dashed ${C.gold}`, background: C.line, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {headshotPreview
              ? <img src={headshotPreview} alt="headshot" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 26 }}>📷</span>}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Agent Headshot</div>
            <button type="button" onClick={() => fileRef.current?.click()} style={{ ...btnOutline, padding: "6px 14px", fontSize: 12 }}>
              {headshotPreview ? "Change photo" : "Upload photo"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
          </div>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div><label style={label}>Name</label><input style={inp} value={form.name} onChange={set("name")} placeholder="Evelyn Cole" /></div>
          <div><label style={label}>Email</label><input style={inp} type="email" value={form.email} onChange={set("email")} /></div>
          <div><label style={label}>Personal Phone</label><input style={inp} value={form.phone} onChange={set("phone")} placeholder="(423) 555-0100" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={label}>Brokerage</label><input style={inp} value={form.brokerage} onChange={set("brokerage")} /></div>
            <div><label style={label}>Brokerage Phone</label><input style={inp} value={form.brokerage_phone} onChange={set("brokerage_phone")} placeholder="(423) 555-0200" /></div>
          </div>
          <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
            <div style={{ ...label, marginBottom: 10 }}>Social Links</div>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 22, textAlign: "center" }}>📘</span><input style={{ ...inp, flex: 1 }} value={form.facebook_url} onChange={set("facebook_url")} placeholder="https://facebook.com/..." /></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 22, textAlign: "center" }}>📸</span><input style={{ ...inp, flex: 1 }} value={form.instagram_url} onChange={set("instagram_url")} placeholder="https://instagram.com/..." /></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 22, textAlign: "center" }}>▶️</span><input style={{ ...inp, flex: 1 }} value={form.youtube_url} onChange={set("youtube_url")} placeholder="https://youtube.com/..." /></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 22, textAlign: "center" }}>💼</span><input style={{ ...inp, flex: 1 }} value={form.linkedin_url} onChange={set("linkedin_url")} placeholder="https://linkedin.com/in/..." /></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 22, textAlign: "center" }}>🎵</span><input style={{ ...inp, flex: 1 }} value={form.tiktok_url} onChange={set("tiktok_url")} placeholder="https://tiktok.com/@..." /></div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "space-between", alignItems: "center" }}>
          {!isNew && (
            <button onClick={handleDelete} disabled={deleting} style={{ ...btnOutline, padding: "10px 16px", borderColor: "#c0392b", color: "#c0392b" }}>
              {deleting ? "Deleting…" : "Delete agent"}
            </button>
          )}
          <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
            <button onClick={onClose} style={{ ...btnOutline, padding: "10px 20px" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ ...btnSolid, padding: "10px 24px" }}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard analytics tab ───────────────────────────────────────────────────
function DashboardTab({ galleries, agents }) {
  const now = new Date();
  const msPerDay = 86400000;

  const revenueFor = (days) => {
    const cutoff = new Date(now - days * msPerDay);
    return galleries
      .filter((g) => g.paid && new Date(g.paid_at || g.created_at) >= cutoff)
      .reduce((s, g) => s + (g.total_cents || 0), 0);
  };
  const ytdRevenue = () => {
    const jan1 = new Date(now.getFullYear(), 0, 1);
    return galleries
      .filter((g) => g.paid && new Date(g.paid_at || g.created_at) >= jan1)
      .reduce((s, g) => s + (g.total_cents || 0), 0);
  };

  const statusCounts = ["preparing", "delivery_only", "active", "archived"].reduce((acc, s) => {
    acc[s] = galleries.filter((g) => g.status === s).length;
    return acc;
  }, {});

  const byAgent = agents.map((a) => ({
    ...a,
    count: galleries.filter((g) => g.agent_id === a.id).length,
    revenue: galleries.filter((g) => g.agent_id === a.id && g.paid).reduce((s, g) => s + (g.total_cents || 0), 0),
  })).filter((a) => a.count > 0).sort((a, b) => b.count - a.count);
  const unassigned = galleries.filter((g) => !g.agent_id).length;

  const card = { background: "#fff", border: `1px solid ${C.line}`, borderRadius: 3, padding: "20px 24px" };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* Status stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "Total Galleries", value: galleries.length, color: C.charcoal },
          { label: "Active", value: statusCounts.active, color: "#27ae60" },
          { label: "Preparing", value: statusCounts.preparing, color: C.gold },
          { label: "Archived", value: statusCounts.archived, color: C.taupe },
        ].map((s) => (
          <div key={s.label} style={{ ...card, textAlign: "center", padding: "18px 12px" }}>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 38, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: C.brown, marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue */}
      <div style={card}>
        <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 18, margin: "0 0 14px" }}>Revenue</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
          {[
            { label: "Last 30 Days", value: revenueFor(30) },
            { label: "Last 60 Days", value: revenueFor(60) },
            { label: "Last 90 Days", value: revenueFor(90) },
            { label: "Year to Date", value: ytdRevenue() },
          ].map((r) => (
            <div key={r.label} style={{ padding: "14px 12px", background: "#f9f7f4", borderRadius: 2, textAlign: "center" }}>
              <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 22, color: "#27ae60" }}>{usd(r.value)}</div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: C.brown, marginTop: 5 }}>{r.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* By agent */}
      <div style={card}>
        <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 18, margin: "0 0 14px" }}>Galleries by Agent</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {byAgent.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f9f7f4", borderRadius: 2, gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {a.headshot_url
                  ? <img src={a.headshot_url} alt={a.name} style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${C.taupe}, ${C.gold})`, flexShrink: 0 }} />}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                  {a.brokerage && <div style={{ fontSize: 12, color: C.brown }}>{a.brokerage}</div>}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 18 }}>
                  {a.count} <span style={{ fontSize: 12, fontWeight: 400, fontFamily: "Inter, sans-serif", color: C.brown }}>galleries</span>
                </div>
                <div style={{ fontSize: 12, color: "#27ae60" }}>{usd(a.revenue)} paid</div>
              </div>
            </div>
          ))}
          {unassigned > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f9f7f4", borderRadius: 2 }}>
              <div style={{ fontSize: 14, color: C.taupe, fontStyle: "italic" }}>Unassigned</div>
              <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 18 }}>
                {unassigned} <span style={{ fontSize: 12, fontWeight: 400, fontFamily: "Inter, sans-serif", color: C.brown }}>galleries</span>
              </div>
            </div>
          )}
          {byAgent.length === 0 && unassigned === 0 && (
            <p style={{ color: C.taupe, fontSize: 13 }}>No gallery data yet.</p>
          )}
        </div>
      </div>

      {/* Storage note */}
      <div style={{ ...card, background: "#f9f7f4", padding: "14px 20px" }}>
        <p style={{ fontSize: 13, color: C.brown, margin: 0 }}>
          💾 For exact storage and database size, check the{" "}
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: C.gold }}>
            Supabase dashboard
          </a>{" "}
          → Storage and Database tabs.
        </p>
      </div>
    </div>
  );
}

// ── Main admin dashboard ──────────────────────────────────────────────────────
function Dashboard({ session, onLogout }) {
  const token = session.access_token;
  const [tab, setTab] = useState("dashboard");
  const [galleries, setGalleries] = useState([]);
  const [agents, setAgents] = useState([]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [notifying, setNotifying] = useState(null);
  const [archiving, setArchiving] = useState(null);
  const [deletingGallery, setDeletingGallery] = useState(null);
  const [loading, setLoading] = useState(true);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2800); };

  const loadData = useCallback(async () => {
    setLoading(true);
    const [gRes, aRes] = await Promise.all([
      api("/api/admin/galleries", "GET", null, token),
      api("/api/admin/agents", "GET", null, token),
    ]);
    if (gRes.galleries) setGalleries(gRes.galleries);
    if (aRes.agents) setAgents(aRes.agents);
    setLoading(false);
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const sendAlert = async (galleryId) => {
    setNotifying(galleryId);
    const data = await api("/api/notify", "POST", { galleryId }, token);
    setNotifying(null);
    flash(data.ok ? "Media alert sent!" : (data.error || "Failed to send alert."));
  };

  const archiveGallery = async (g) => {
    const next = g.status === "archived" ? "active" : "archived";
    setArchiving(g.id);
    const data = await api("/api/admin/galleries", "PATCH", { id: g.id, status: next }, token);
    setArchiving(null);
    if (data.gallery) {
      setGalleries((prev) => prev.map((x) => x.id === g.id ? { ...x, status: next } : x));
      flash(next === "archived" ? "Listing archived." : "Listing restored.");
    }
  };

  const deleteGallery = async (g) => {
    if (!window.confirm(`Delete "${g.address}"? This removes the listing and all media records permanently.`)) return;
    setDeletingGallery(g.id);
    const data = await api("/api/admin/galleries", "DELETE", { id: g.id }, token);
    setDeletingGallery(null);
    if (data.ok) { setGalleries((prev) => prev.filter((x) => x.id !== g.id)); flash("Listing deleted."); }
  };

  const agentName = (id) => agents.find((a) => a.id === id)?.name || "—";

  const statusColor = { preparing: "#888", delivery_only: C.gold, active: "#27ae60", archived: C.taupe };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#f4f2ee", minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap'); * { box-sizing: border-box; }`}</style>

      {/* Header */}
      <header style={{ background: C.charcoal, color: C.warmWhite, padding: "0 clamp(1rem,4vw,2.5rem)", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58 }}>
        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 22 }}>
          KNOX <span style={{ fontWeight: 500, color: C.gold }}>Creative</span>
          <span style={{ fontWeight: 400, fontSize: 13, color: C.taupe, marginLeft: 12 }}>Admin</span>
        </div>
        <button onClick={onLogout} style={{ background: "none", border: `1px solid rgba(255,255,255,.2)`, color: C.taupe, padding: "6px 14px", borderRadius: 2, fontSize: 12, cursor: "pointer" }}>Sign out</button>
      </header>
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />

      {/* Tab nav */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${C.line}`, padding: "0 clamp(1rem,4vw,2.5rem)", display: "flex", gap: 0 }}>
        {["dashboard", "galleries", "agents"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "14px 20px", background: "none", border: "none", borderBottom: tab === t ? `2px solid ${C.gold}` : "2px solid transparent", color: tab === t ? C.charcoal : C.brown, fontSize: 13, fontWeight: tab === t ? 600 : 400, letterSpacing: ".04em", textTransform: "capitalize", cursor: "pointer", marginBottom: -1 }}>
            {t}
          </button>
        ))}
      </div>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(1.25rem,4vw,2rem) clamp(1rem,4vw,2.5rem)" }}>
        {loading ? (
          <p style={{ color: C.brown }}>Loading…</p>
        ) : tab === "galleries" ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 26, margin: 0 }}>Galleries</h2>
              <button onClick={() => setModal({ type: "gallery", data: null })} style={{ ...btnSolid, padding: "10px 20px" }}>+ New Gallery</button>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {galleries.map((g) => (
                <div key={g.id} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 3, padding: "18px 20px", display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ flex: "1 1 260px" }}>
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 3 }}>{g.address}</div>
                    <div style={{ fontSize: 13, color: C.brown }}>
                      {g.city}, {g.state} · {agentName(g.agent_id || g.agent?.id)} ·{" "}
                      <span style={{ color: statusColor[g.status] || C.taupe }}>{g.status}</span>
                    </div>
                  </div>
                  <div style={{ flex: "0 1 auto", textAlign: "right", fontSize: 13, color: C.brown }}>
                    <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: g.paid ? "#27ae60" : C.charcoal }}>
                      {g.paid ? "Paid ✓" : `${usd(g.total_cents - g.deposit_cents)} due`}
                    </div>
                    <div style={{ fontSize: 12, color: C.taupe }}>{usd(g.total_cents)} total · {usd(g.deposit_cents)} deposit</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <a href={`/g/${g.token}`} target="_blank" rel="noopener noreferrer" style={{ ...btnOutline, padding: "8px 14px", textDecoration: "none", display: "inline-block" }}>Gallery ↗</a>
                    <button onClick={() => setModal({ type: "photos", data: g })} style={{ ...btnOutline, padding: "8px 14px", borderColor: C.gold, color: C.gold }}>📷 Photos</button>
                    <button onClick={() => setModal({ type: "gallery", data: g })} style={{ ...btnOutline, padding: "8px 14px" }}>Edit</button>
                    <button
                      onClick={() => sendAlert(g.id)}
                      disabled={notifying === g.id}
                      style={{ ...btnSolid, padding: "8px 14px", background: C.gold, borderColor: C.gold, color: C.charcoal }}
                    >
                      {notifying === g.id ? "Sending…" : "Send Alert"}
                    </button>
                    <button
                      onClick={() => archiveGallery(g)}
                      disabled={archiving === g.id}
                      style={{ ...btnOutline, padding: "8px 14px" }}
                    >
                      {archiving === g.id ? "…" : g.status === "archived" ? "Unarchive" : "Archive"}
                    </button>
                    <button
                      onClick={() => deleteGallery(g)}
                      disabled={deletingGallery === g.id}
                      style={{ ...btnOutline, padding: "8px 14px", borderColor: "#c0392b", color: "#c0392b" }}
                    >
                      {deletingGallery === g.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
              {galleries.length === 0 && <p style={{ color: C.brown, fontSize: 14 }}>No galleries yet — create your first one.</p>}
            </div>
          </>
        ) : tab === "dashboard" ? (
          <>
            <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 26, margin: "0 0 20px" }}>Dashboard</h2>
            <DashboardTab galleries={galleries} agents={agents} />
          </>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 26, margin: 0 }}>Agents</h2>
              <button onClick={() => setModal({ type: "agent", data: null })} style={{ ...btnSolid, padding: "10px 20px" }}>+ New Agent</button>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {agents.map((a) => (
                <div key={a.id} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 3, padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{a.name}</div>
                    <div style={{ fontSize: 13, color: C.brown }}>{a.phone}{a.email ? ` · ${a.email}` : ""}{a.brokerage ? ` · ${a.brokerage}` : ""}</div>
                  </div>
                  <button onClick={() => setModal({ type: "agent", data: a })} style={{ ...btnOutline, padding: "8px 14px" }}>Edit</button>
                </div>
              ))}
              {agents.length === 0 && <p style={{ color: C.brown, fontSize: 14 }}>No agents yet.</p>}
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      {modal?.type === "photos" && (
        <PhotosModal
          gallery={modal.data}
          adminToken={token}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "gallery" && (
        <GalleryModal
          gallery={modal.data}
          agents={agents}
          token={token}
          onSave={(g) => { setGalleries((prev) => modal.data ? prev.map((x) => x.id === g.id ? g : x) : [g, ...prev]); setModal(null); flash("Saved."); }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "agent" && (
        <AgentModal
          agent={modal.data}
          token={token}
          onSave={(a) => { setAgents((prev) => modal.data ? prev.map((x) => x.id === a.id ? a : x) : [...prev, a]); setModal(null); flash("Saved."); }}
          onDelete={(id) => { setAgents((prev) => prev.filter((x) => x.id !== id)); setModal(null); flash("Agent deleted."); }}
          onClose={() => setModal(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: C.charcoal, color: C.warmWhite, padding: "12px 22px", borderRadius: 3, fontSize: 13, boxShadow: "0 8px 30px rgba(0,0,0,.3)", borderLeft: `3px solid ${C.gold}`, zIndex: 60, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Root: auth gate ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session || null);
      setChecking(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (checking) return <div style={{ minHeight: "100vh", background: C.charcoal }} />;
  if (!session) return <LoginScreen onLogin={setSession} />;
  return <Dashboard session={session} onLogout={handleLogout} />;
}

const btnSolid = { background: C.charcoal, color: C.warmWhite, border: `1.5px solid ${C.charcoal}`, borderRadius: 2, fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer" };
const btnOutline = { background: "transparent", color: C.charcoal, border: `1.5px solid ${C.charcoal}`, borderRadius: 2, fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer" };
