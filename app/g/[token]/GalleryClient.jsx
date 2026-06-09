"use client";
import React, { useState, useMemo } from "react";
import { PaymentForm, CreditCard } from "react-square-web-payments-sdk";

const C = {
  charcoal: "#171717",
  warmWhite: "#F7F4EF",
  taupe: "#C8B8A6",
  gold: "#B98A44",
  goldHover: "#A07736",
  brown: "#2A211B",
};

const CATS = ["All", "Interior", "Exterior", "Drone", "Twilight", "2D Floor Plans", "Virtual Staging", "Marketing"];

function LinkIcon({ kind }) {
  const s = { stroke: C.warmWhite, strokeWidth: 1.6, fill: "none" };
  if (kind === "play")
    return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9" /><path d="M10 9l5 3-5 3z" fill={C.warmWhite} stroke="none" /></svg>;
  if (kind === "cube")
    return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 3v18M4 7.5l8 4.5 8-4.5" /></svg>;
  return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></svg>;
}

function Thumb({ photo, paid, selected, onToggle }) {
  return (
    <div
      onClick={() => paid && onToggle(photo.id)}
      style={{
        position: "relative", aspectRatio: "3 / 2", borderRadius: 2, overflow: "hidden",
        cursor: paid ? "pointer" : "default",
        border: selected ? `2px solid ${C.gold}` : "2px solid transparent",
        transition: "transform .25s ease, box-shadow .25s ease",
        boxShadow: "0 1px 2px rgba(0,0,0,.12)",
        background: "#ddd",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.18)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.12)"; }}
    >
      {/* Real preview image from Supabase public bucket */}
      <img
        src={photo.previewUrl}
        alt={photo.label || photo.category}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: paid ? "none" : "brightness(.92)" }}
      />

      {/* Watermark overlay (visual only — real watermark is burned into the JPEG server-side) */}
      {!paid && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <div style={{ opacity: 0.28, fontFamily: "Georgia, serif", fontWeight: 700, color: C.warmWhite, textAlign: "center", lineHeight: 1, transform: "rotate(-4deg)", textShadow: "0 1px 4px rgba(0,0,0,.5)", userSelect: "none" }}>
            <div style={{ fontSize: "clamp(18px, 4vw, 26px)", letterSpacing: ".04em" }}>KNOX CREATIVE</div>
          </div>
        </div>
      )}

      <span style={{ position: "absolute", top: 8, left: 8, fontFamily: "Inter, sans-serif", fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: C.warmWhite, background: "rgba(23,23,23,.55)", padding: "3px 7px", borderRadius: 2 }}>
        {photo.category}
      </span>

      {!paid && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.warmWhite} strokeWidth="1.6"><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
        </div>
      )}

      {paid && (
        <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", display: "grid", placeItems: "center", background: selected ? C.gold : "rgba(247,244,239,.85)", transition: "background .2s" }}>
          {selected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.charcoal} strokeWidth="3"><path d="M5 12l5 5L20 7" /></svg>}
        </div>
      )}

      {photo.label && (
        <span style={{ position: "absolute", bottom: 6, left: 8, fontFamily: "Inter, sans-serif", fontSize: 10, color: C.warmWhite, textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>
          {photo.label}
        </span>
      )}
    </div>
  );
}

export default function GalleryClient({ gallery, media, squareAppId, squareLocationId, baseDomain }) {
  const [paid, setPaid] = useState(gallery.paid);
  const [showPayForm, setShowPayForm] = useState(false);
  const [paying, setPaying] = useState(false);
  const [cat, setCat] = useState("All");
  const [selected, setSelected] = useState(new Set());
  const [toast, setToast] = useState("");
  const [dl, setDl] = useState(null);

  const isPhone = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "");
  const balance = gallery.total_cents - gallery.deposit_cents;

  const shown = useMemo(
    () => (cat === "All" ? media : media.filter((m) => m.category === cat)),
    [cat, media]
  );

  const toggle = (id) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const links = [
    gallery.link_virtual_tour && { id: "tour", label: "Virtual Tour", desc: "Branded walkthrough tour", url: gallery.link_virtual_tour, icon: "play" },
    gallery.link_floorplan_3d && { id: "floorplan3d", label: "3D Floor Plan & Sun Map", desc: "Interactive 3D plan with sun mapping", url: gallery.link_floorplan_3d, icon: "cube" },
    (gallery.link_property_site || gallery.site_slug) && {
      id: "propsite", label: "Property Website", desc: gallery.site_slug ? `${gallery.site_slug}.${baseDomain}` : gallery.link_property_site,
      url: gallery.link_property_site || `https://${gallery.site_slug}.${baseDomain}`, icon: "globe",
    },
  ].filter(Boolean);

  const handlePayment = async (tokenResult) => {
    if (tokenResult.status !== "OK") {
      flash("Card error — please try again.");
      setPaying(false);
      return;
    }
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: gallery.token, sourceId: tokenResult.token }),
      });
      const data = await res.json();
      if (data.ok) {
        setPaid(true);
        setShowPayForm(false);
        flash("Payment received — downloads unlocked.");
      } else {
        flash(data.error || "Payment failed. Please try again.");
      }
    } catch {
      flash("Network error — please try again.");
    }
    setPaying(false);
  };

  const openDownload = (scope) => {
    if (scope === "selected" && selected.size === 0) return flash("Select photos first.");
    setDl({ scope, stage: "prep" });
    const ids = scope === "selected" ? [...selected] : [];
    fetch("/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: gallery.token, scope, ids }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.zipUrl) setDl({ scope, stage: "ready", zipUrl: data.zipUrl, files: data.files || [] });
        else { setDl(null); flash(data.error || "Download failed."); }
      })
      .catch(() => { setDl(null); flash("Network error."); });
  };

  const finishDownload = (mode) => {
    if (mode === "zip" && dl?.zipUrl) window.location = dl.zipUrl;
    else if (mode === "files" && dl?.zipUrl) window.location = dl.zipUrl;
    else if (mode === "camera" && dl?.files?.length) {
      dl.files.forEach((f, i) => setTimeout(() => window.open(f.url, "_blank"), i * 300));
    }
    setDl(null);
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: C.warmWhite, color: C.charcoal, minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');`}</style>

      {/* Header */}
      <header style={{ background: C.charcoal, color: C.warmWhite, padding: "18px clamp(1.25rem,4vw,3rem)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 26, letterSpacing: ".01em" }}>
          KNOX <span style={{ fontWeight: 500, color: C.gold }}>Creative</span>
        </div>
        <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: C.taupe }}>Client Gallery</div>
      </header>
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />

      {/* Property banner */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "clamp(2rem,5vw,3.5rem) clamp(1.25rem,4vw,3rem) 1.5rem" }}>
        <p style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: C.gold, margin: 0 }}>Real Estate Delivery</p>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: "clamp(2.2rem,6vw,3.6rem)", fontWeight: 600, margin: "6px 0 4px", letterSpacing: "-0.01em" }}>
          {gallery.address}
        </h1>
        <p style={{ margin: 0, color: C.brown, fontSize: 15 }}>
          {gallery.city}, {gallery.state} {gallery.zip}
          {gallery.sqft ? ` · ${gallery.sqft.toLocaleString()} sq ft` : ""}
          {gallery.agent?.name ? ` · Prepared for ${gallery.agent.name}` : ""}
        </p>
      </section>

      {/* Paywall banner */}
      {!paid && (
        <section style={{ maxWidth: 1400, margin: "0 auto", padding: "0 clamp(1.25rem,4vw,3rem)" }}>
          <div style={{ background: C.brown, color: C.warmWhite, borderRadius: 3, padding: "clamp(1.5rem,4vw,2.25rem)", display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ flex: "1 1 320px" }}>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 600, margin: "0 0 6px" }}>Balance due before download</h2>
              <p style={{ margin: 0, color: C.taupe, fontSize: 14, lineHeight: 1.5 }}>
                Deposit of ${(gallery.deposit_cents / 100).toFixed(2)} paid at booking. Pay the remaining balance to unlock full-resolution downloads.
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: C.taupe, letterSpacing: ".08em" }}>BALANCE DUE</div>
              <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 42, color: C.gold, lineHeight: 1 }}>
                ${(balance / 100).toFixed(2)}
              </div>
              <button
                onClick={() => setShowPayForm(true)}
                style={{ marginTop: 12, background: C.gold, color: C.charcoal, border: `1.5px solid ${C.gold}`, borderRadius: 2, padding: "12px 22px", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}
              >
                Pay with Square →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Download action bar */}
      {paid && (
        <section style={{ maxWidth: 1400, margin: "0 auto", padding: "0 clamp(1.25rem,4vw,3rem)" }}>
          <div style={{ border: `1px solid ${C.taupe}`, borderRadius: 3, padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
            <span style={{ fontSize: 13, color: C.brown }}>{selected.size > 0 ? `${selected.size} selected` : "Paid in full — all photos unlocked"}</span>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => openDownload("selected")} style={btnOutline}>Download Selected ↓</button>
              <button onClick={() => openDownload("all")} style={btnSolid}>Download All ↓</button>
            </div>
          </div>
        </section>
      )}

      {/* Marketing links */}
      {links.length > 0 && (
        <section style={{ maxWidth: 1400, margin: "0 auto", padding: "2.25rem clamp(1.25rem,4vw,3rem) .5rem" }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 24, margin: "0 0 4px" }}>Marketing Assets</h2>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: C.brown }}>Ready to share — link directly from your listing, MLS, or social.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            {links.map((lnk) => (
              <a key={lnk.id} href={lnk.url} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none", color: C.charcoal, background: "#fff", border: `1px solid ${C.taupe}`, borderRadius: 3, padding: "16px 18px", transition: "transform .2s, box-shadow .2s, border-color .2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.1)"; e.currentTarget.style.borderColor = C.gold; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = C.taupe; }}
              >
                <span style={{ flex: "0 0 auto", width: 42, height: 42, borderRadius: 3, background: C.charcoal, display: "grid", placeItems: "center" }}>
                  <LinkIcon kind={lnk.icon} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 600, fontSize: 14 }}>{lnk.label}</span>
                  <span style={{ display: "block", fontSize: 12, color: C.brown, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lnk.desc}</span>
                </span>
                <span style={{ flex: "0 0 auto", color: C.gold, fontSize: 18 }}>↗</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Category filter */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "1.75rem clamp(1.25rem,4vw,3rem) .5rem", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {CATS.filter((c) => c === "All" || media.some((m) => m.category === c)).map((cName) => (
          <button key={cName} onClick={() => setCat(cName)}
            style={{ flex: "1 1 0", minWidth: "fit-content", whiteSpace: "nowrap", background: cat === cName ? C.charcoal : "transparent", color: cat === cName ? C.warmWhite : C.brown, border: `1px solid ${cat === cName ? C.charcoal : C.taupe}`, borderRadius: 2, padding: "7px 14px", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer", transition: "all .2s" }}>
            {cName}
          </button>
        ))}
      </section>

      {/* Grid */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "1rem clamp(1.25rem,4vw,3rem) 4rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 14 }}>
        {shown.map((m) => (
          <Thumb key={m.id} photo={m} paid={paid} selected={selected.has(m.id)} onToggle={toggle} />
        ))}
        {shown.length === 0 && (
          <p style={{ color: C.brown, fontSize: 14, gridColumn: "1/-1" }}>No photos in this category yet.</p>
        )}
      </section>

      {/* Footer */}
      <footer style={{ background: C.brown, color: C.taupe, padding: "2rem clamp(1.25rem,4vw,3rem)", fontSize: 13 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: C.warmWhite }}>Knox Creative</div>
            <div style={{ marginTop: 4 }}>James Knox Photography · Athens, TN</div>
          </div>
          {gallery.agent && (
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {gallery.agent.headshot_url && (
                <img src={gallery.agent.headshot_url} alt={gallery.agent.name} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.gold}`, flex: "0 0 auto" }} />
              )}
              <div style={{ textAlign: "right" }}>
                {gallery.agent.name && <div style={{ color: C.warmWhite, fontWeight: 600, fontSize: 14 }}>{gallery.agent.name}</div>}
                {gallery.agent.brokerage && <div style={{ fontSize: 12, marginBottom: 2 }}>{gallery.agent.brokerage}</div>}
                <div style={{ fontSize: 12 }}>Questions about this delivery?</div>
                {gallery.agent.phone && (
                  <a href={`tel:${(gallery.agent.phone || "").replace(/\D/g, "")}`} style={{ color: C.gold, textDecoration: "none" }}>{gallery.agent.phone}</a>
                )}
              </div>
            </div>
          )}
        </div>
      </footer>

      {/* Square payment modal */}
      {showPayForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(23,23,23,.65)", display: "grid", placeItems: "center", padding: 20, zIndex: 50 }}>
          <div style={{ background: C.warmWhite, borderRadius: 4, maxWidth: 460, width: "100%", padding: "clamp(1.75rem,5vw,2.5rem)", borderTop: `3px solid ${C.gold}` }}>
            <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 24, margin: "0 0 4px" }}>Pay balance</h3>
            <p style={{ fontSize: 14, color: C.brown, margin: "0 0 22px" }}>
              ${(balance / 100).toFixed(2)} due · {gallery.address}
            </p>
            <PaymentForm
              applicationId={squareAppId}
              locationId={squareLocationId}
              cardTokenizeResponseReceived={(tokenResult) => {
                setPaying(true);
                handlePayment(tokenResult);
              }}
            >
              <CreditCard
                buttonProps={{
                  css: { backgroundColor: C.gold, color: C.charcoal, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" },
                }}
              >
                {paying ? "Processing…" : `Pay $${(balance / 100).toFixed(2)}`}
              </CreditCard>
            </PaymentForm>
            <button onClick={() => setShowPayForm(false)} style={{ marginTop: 16, background: "none", border: "none", color: C.brown, fontSize: 12, cursor: "pointer", textDecoration: "underline", display: "block" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Download modal */}
      {dl && (
        <div onClick={() => dl.stage === "ready" && setDl(null)} style={{ position: "fixed", inset: 0, background: "rgba(23,23,23,.6)", display: "grid", placeItems: "center", padding: 20, zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.warmWhite, borderRadius: 4, maxWidth: 440, width: "100%", padding: "clamp(1.75rem,5vw,2.5rem)", borderTop: `3px solid ${C.gold}`, textAlign: "center" }}>
            {dl.stage === "prep" ? (
              <>
                <div style={{ margin: "0 auto 18px", width: 46, height: 46, border: `3px solid ${C.taupe}`, borderTopColor: C.gold, borderRadius: "50%", animation: "kcspin 0.8s linear infinite" }} />
                <style>{`@keyframes kcspin{to{transform:rotate(360deg)}}`}</style>
                <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 22, margin: "0 0 6px" }}>Preparing your files</h3>
                <p style={{ margin: 0, fontSize: 13, color: C.brown }}>Packaging files at full resolution — no watermark.</p>
              </>
            ) : (
              <>
                <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 24, margin: "0 0 6px" }}>Ready to download</h3>
                <p style={{ margin: "0 0 22px", fontSize: 13, color: C.brown }}>Full-resolution files · MLS-ready · unbranded</p>
                {isPhone ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    <button onClick={() => finishDownload("camera")} style={{ ...btnSolid, padding: "14px 18px", width: "100%" }}>Save to Camera Roll ↓</button>
                    <button onClick={() => finishDownload("files")} style={{ ...btnOutline, padding: "14px 18px", width: "100%" }}>Save ZIP to Files</button>
                  </div>
                ) : (
                  <button onClick={() => finishDownload("zip")} style={{ ...btnSolid, padding: "14px 18px", width: "100%" }}>Download ZIP ↓</button>
                )}
                <button onClick={() => setDl(null)} style={{ marginTop: 16, background: "none", border: "none", color: C.brown, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Cancel</button>
              </>
            )}
          </div>
        </div>
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

const btnSolid = { background: C.charcoal, color: C.warmWhite, border: `1.5px solid ${C.charcoal}`, borderRadius: 2, padding: "10px 18px", fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" };
const btnOutline = { background: "transparent", color: C.charcoal, border: `1.5px solid ${C.charcoal}`, borderRadius: 2, padding: "10px 18px", fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" };
