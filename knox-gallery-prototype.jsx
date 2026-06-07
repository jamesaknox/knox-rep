import React, { useState, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// KNOX CREATIVE — Client Gallery + Square Paywall (working prototype)
//
// This is the realtor-facing delivery experience: a branded gallery that locks
// downloads behind a balance-due Square payment, mirroring HDPhotoHub's
// "Require payment to access photos" flow.
//
// PROTOTYPE NOTE: Payment + data are simulated in-memory so you can click the
// full flow. Every spot that must become a real backend call is marked with a
// // BACKEND: comment showing exactly what the production wiring is.
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  charcoal: "#171717",
  warmWhite: "#F7F4EF",
  taupe: "#C8B8A6",
  gold: "#B98A44",
  goldHover: "#A07736",
  brown: "#2A211B",
};

// BACKEND: this object would be one row from your `galleries` table in Supabase,
// joined to `media` rows. Pricing/order info comes from the Square order.
const ORDER = {
  siteId: "3122183",
  address: "242 Fyke Dr",
  city: "Athens",
  state: "TN",
  zip: "37303",
  sqft: 1798,
  agent: { name: "Evelyn Cole", phone: "(423) 462-4093", email: "ekcole23@gmail.com" },
  package: "Complete Listing — Under 2,000 sq ft",
  total: 425.0,
  deposit: 100.0, // paid at booking via Square Appointments
  get balance() {
    return this.total - this.deposit;
  },
};

// BACKEND: each item is a Supabase Storage object; `full` is a signed URL minted
// server-side ONLY after payment is confirmed. Until then the client gets `thumb` only.
const PHOTOS = [
  { id: 1, label: "Front Exterior", cat: "Exterior", hue: 207 },
  { id: 2, label: "Front Angle", cat: "Exterior", hue: 205 },
  { id: 3, label: "Driveway", cat: "Exterior", hue: 35 },
  { id: 4, label: "Entry", cat: "Interior", hue: 25 },
  { id: 5, label: "Foyer Stairs", cat: "Interior", hue: 30 },
  { id: 6, label: "Living Room", cat: "Interior", hue: 28 },
  { id: 7, label: "Living Wide", cat: "Interior", hue: 32 },
  { id: 8, label: "Kitchen", cat: "Interior", hue: 38 },
  { id: 9, label: "Kitchen Island", cat: "Interior", hue: 40 },
  { id: 10, label: "Primary Bed", cat: "Interior", hue: 30 },
  { id: 11, label: "Primary Bath", cat: "Interior", hue: 200 },
  { id: 12, label: "Backyard", cat: "Exterior", hue: 110 },
  { id: 13, label: "Aerial Front", cat: "Drone", hue: 95 },
  { id: 14, label: "Aerial Boundaries", cat: "Drone", hue: 90 },
  { id: 15, label: "Twilight Front", cat: "Twilight", hue: 280 },
  { id: 16, label: "Neighborhood", cat: "Drone", hue: 100 },
  { id: 17, label: "Main Floor Plan", cat: "2D Floor Plans", hue: 210 },
  { id: 18, label: "Upper Floor Plan", cat: "2D Floor Plans", hue: 212 },
  { id: 19, label: "Living — Staged", cat: "Virtual Staging", hue: 20 },
  { id: 20, label: "Primary Bed — Staged", cat: "Virtual Staging", hue: 18 },
  { id: 21, label: "Social Post — Square", cat: "Marketing", hue: 340 },
  { id: 22, label: "Social Post — Story", cat: "Marketing", hue: 265 },
  { id: 23, label: "Just Listed Graphic", cat: "Marketing", hue: 45 },
  { id: 24, label: "Feature Flyer", cat: "Marketing", hue: 160 },
];

const CATS = ["All", "Interior", "Exterior", "Drone", "Twilight", "2D Floor Plans", "Virtual Staging", "Marketing"];

// BACKEND: these are the link-out deliverables (HDPhotoHub "Embedded Media").
// Stored as URL fields on the gallery row. NOT paywalled — the virtual tour and
// property website are meant to be shared publicly by the agent, so locking them
// would defeat their purpose. Only downloadable image files sit behind payment.
const LINKS = [
  {
    id: "tour",
    label: "Virtual Tour",
    desc: "Branded walkthrough tour",
    url: "https://tour.giraffe360.com/ce299...",
    icon: "play",
  },
  {
    id: "floorplan3d",
    label: "3D Floor Plan & Sun Map",
    desc: "Interactive 3D plan with sun mapping",
    url: "https://my.giraffe360.com/3dflp/t...",
    icon: "cube",
  },
  {
    id: "propsite",
    label: "Property Website",
    desc: "242FykeDr.jamesknoxphotos.com",
    url: "https://242FykeDr.jamesknoxphotos.com",
    icon: "globe",
  },
];

function LinkIcon({ kind }) {
  const s = { stroke: C.warmWhite, strokeWidth: 1.6, fill: "none" };
  if (kind === "play")
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
        <circle cx="12" cy="12" r="9" />
        <path d="M10 9l5 3-5 3z" fill={C.warmWhite} stroke="none" />
      </svg>
    );
  if (kind === "cube")
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
        <path d="M12 3v18M4 7.5l8 4.5 8-4.5" />
      </svg>
    );
  // globe
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </svg>
  );
}

function Thumb({ photo, paid, selected, onToggle }) {
  // The thumbnail "image" is a generated gradient stand-in so the prototype has
  // no external dependencies. In production this is an <img> with the thumb URL.
  const bg = `linear-gradient(150deg, hsl(${photo.hue} 30% 78%), hsl(${photo.hue} 25% 55%))`;
  return (
    <div
      onClick={() => paid && onToggle(photo.id)}
      style={{
        position: "relative",
        aspectRatio: "3 / 2",
        borderRadius: 2,
        overflow: "hidden",
        cursor: paid ? "pointer" : "default",
        border: selected ? `2px solid ${C.gold}` : "2px solid transparent",
        transition: "transform .25s ease, box-shadow .25s ease",
        boxShadow: "0 1px 2px rgba(0,0,0,.12)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.18)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.12)";
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: bg, filter: paid ? "none" : "brightness(.96)" }} />

      {/* ── Centered watermark on locked previews ──
          PROTOTYPE: rendered as a CSS overlay so you can see placement/opacity.
          PRODUCTION: this watermark must be BURNED INTO the preview JPEG
          server-side (e.g. sharp/ImageMagick compositing your logo PNG at the
          same center + ~20% opacity). The clean, unwatermarked full-res file is
          a SEPARATE object delivered only via a signed URL after payment — never
          expose the clean file to the browser pre-payment, or it's pullable from
          the network tab. */}
      {!paid && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              opacity: 0.2,
              fontFamily: "Fraunces, serif",
              fontWeight: 700,
              color: C.warmWhite,
              textAlign: "center",
              lineHeight: 1,
              transform: "rotate(-4deg)",
              textShadow: "0 1px 4px rgba(0,0,0,.4)",
              userSelect: "none",
            }}
          >
            <div style={{ fontSize: "clamp(20px, 5vw, 30px)", letterSpacing: ".02em" }}>
              KN<span>O</span>X
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 9, letterSpacing: ".3em", marginTop: 2 }}>
              CREATIVE
            </div>
          </div>
        </div>
      )}
      {/* category tag */}
      <span
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          fontFamily: "Inter, sans-serif",
          fontSize: 9,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: C.warmWhite,
          background: "rgba(23,23,23,.55)",
          padding: "3px 7px",
          borderRadius: 2,
        }}
      >
        {photo.cat}
      </span>

      {!paid && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.warmWhite} strokeWidth="1.6">
            <rect x="5" y="11" width="14" height="9" rx="1.5" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </div>
      )}

      {paid && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 20,
            height: 20,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: selected ? C.gold : "rgba(247,244,239,.85)",
            transition: "background .2s",
          }}
        >
          {selected && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.charcoal} strokeWidth="3">
              <path d="M5 12l5 5L20 7" />
            </svg>
          )}
        </div>
      )}

      <span
        style={{
          position: "absolute",
          bottom: 6,
          left: 8,
          fontFamily: "Inter, sans-serif",
          fontSize: 10,
          color: C.warmWhite,
          textShadow: "0 1px 3px rgba(0,0,0,.6)",
        }}
      >
        {photo.label}
      </span>
    </div>
  );
}

export default function KnoxGallery() {
  const [paid, setPaid] = useState(false);
  const [paying, setPaying] = useState(false);
  const [cat, setCat] = useState("All");
  const [selected, setSelected] = useState(new Set());
  const [toast, setToast] = useState("");
  const [dl, setDl] = useState(null); // { scope: 'all'|'selected', stage: 'prep'|'ready' }

  // Detect phone vs desktop so we can offer the right download action.
  const isPhone =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "");

  const shown = useMemo(
    () => (cat === "All" ? PHOTOS : PHOTOS.filter((p) => p.cat === cat)),
    [cat]
  );

  const toggle = (id) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const pay = () => {
    setPaying(true);
    // BACKEND: this is where the real Square Web Payments SDK tokenizes the card
    // and your server route (/api/pay) charges ORDER.balance, then flips the
    // gallery row to `paid=true` in Supabase and mints signed download URLs.
    setTimeout(() => {
      setPaying(false);
      setPaid(true);
      flash("Payment received — downloads unlocked.");
    }, 1600);
  };

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  // Opens the download modal and simulates the server zipping the files.
  const openDownload = (scope) => {
    if (scope === "selected" && selected.size === 0) return flash("Select photos first.");
    setDl({ scope, stage: "prep" });
    // BACKEND: POST /api/download { galleryId, scope, ids } → server verifies the
    // gallery is paid, builds (or reuses) a ZIP of the CLEAN full-res files in
    // Supabase Storage, and returns a short-lived signed URL. Phone and desktop
    // get the same signed URL — the difference is only what we DO with it below.
    setTimeout(() => setDl({ scope, stage: "ready" }), 1500);
  };

  const finishDownload = (mode) => {
    // mode: 'zip' (desktop) | 'camera' (phone save-to-roll) | 'files' (phone Files app)
    // BACKEND/desktop: window.location = signedZipUrl  → browser downloads the zip.
    // BACKEND/phone 'camera': there is no web API to write directly to the iOS/Android
    //   camera roll. The real, reliable pattern is: open each full-res image and the
    //   user taps Share → "Save Image" (iOS) / long-press → "Download image" (Android).
    //   For a true one-tap "Save to camera roll," this has to be a small PWA/installed
    //   app using the native share/save APIs — worth noting as a phase-2 option.
    const label =
      mode === "camera"
        ? "Saving full-resolution images to your photos…"
        : mode === "files"
        ? "Saving ZIP to Files…"
        : "Downloading full-resolution ZIP…";
    flash(label);
    setDl(null);
  };

  return (
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        background: C.warmWhite,
        color: C.charcoal,
        minHeight: "100vh",
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');`}</style>

      {/* ── Header ── */}
      <header
        style={{
          background: C.charcoal,
          color: C.warmWhite,
          padding: "18px clamp(1.25rem, 4vw, 3rem)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 26, letterSpacing: ".01em" }}>
          KNOX <span style={{ fontWeight: 500, color: C.gold }}>Creative</span>
        </div>
        <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: C.taupe }}>
          Client Gallery
        </div>
      </header>

      {/* gold hairline */}
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />

      {/* ── Property banner ── */}
      <section
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "clamp(2rem,5vw,3.5rem) clamp(1.25rem,4vw,3rem) 1.5rem",
        }}
      >
        <p style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: C.gold, margin: 0 }}>
          Real Estate Delivery
        </p>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: "clamp(2.2rem,6vw,3.6rem)", fontWeight: 600, margin: "6px 0 4px", letterSpacing: "-0.01em" }}>
          {ORDER.address}
        </h1>
        <p style={{ margin: 0, color: C.brown, fontSize: 15 }}>
          {ORDER.city}, {ORDER.state} {ORDER.zip} · {ORDER.sqft.toLocaleString()} sq ft · Prepared for {ORDER.agent.name}
        </p>
      </section>

      {/* ── Paywall banner (only while locked) ── */}
      {!paid && (
        <section style={{ maxWidth: 1400, margin: "0 auto", padding: "0 clamp(1.25rem,4vw,3rem)" }}>
          <div
            style={{
              background: C.brown,
              color: C.warmWhite,
              borderRadius: 3,
              padding: "clamp(1.5rem,4vw,2.25rem)",
              display: "flex",
              flexWrap: "wrap",
              gap: 24,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ flex: "1 1 320px" }}>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 600, margin: "0 0 6px" }}>
                Balance due before download
              </h2>
              <p style={{ margin: 0, color: C.taupe, fontSize: 14, lineHeight: 1.5 }}>
                {ORDER.package}. Deposit of ${ORDER.deposit.toFixed(2)} paid at booking.
                Pay the remaining balance to unlock full-resolution downloads.
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: C.taupe, letterSpacing: ".08em" }}>BALANCE DUE</div>
              <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 42, color: C.gold, lineHeight: 1 }}>
                ${ORDER.balance.toFixed(2)}
              </div>
              <button
                onClick={pay}
                disabled={paying}
                style={{
                  marginTop: 12,
                  background: C.gold,
                  color: C.charcoal,
                  border: `1.5px solid ${C.gold}`,
                  borderRadius: 2,
                  padding: "12px 22px",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  cursor: paying ? "wait" : "pointer",
                  transition: "transform .2s, background .2s",
                }}
                onMouseEnter={(e) => !paying && (e.currentTarget.style.background = C.goldHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = C.gold)}
              >
                {paying ? "Processing…" : "Pay with Square →"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Unlocked action bar ── */}
      {paid && (
        <section style={{ maxWidth: 1400, margin: "0 auto", padding: "0 clamp(1.25rem,4vw,3rem)" }}>
          <div
            style={{
              border: `1px solid ${C.taupe}`,
              borderRadius: 3,
              padding: "16px 20px",
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
              background: "#fff",
            }}
          >
            <span style={{ fontSize: 13, color: C.brown }}>
              {selected.size > 0 ? `${selected.size} selected` : "Paid in full — all photos unlocked"}
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => openDownload("selected")} style={btnOutline}>
                Download Selected ↓
              </button>
              <button onClick={() => openDownload("all")} style={btnSolid}>
                Download All ↓
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Embedded media links (always available, not paywalled) ── */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "2.25rem clamp(1.25rem,4vw,3rem) .5rem" }}>
        <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 24, margin: "0 0 4px" }}>
          Marketing Assets
        </h2>
        <p style={{ margin: "0 0 18px", fontSize: 13, color: C.brown }}>
          Ready to share — link directly from your listing, MLS, or social.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {LINKS.map((lnk) => (
            <a
              key={lnk.id}
              href={lnk.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                textDecoration: "none",
                color: C.charcoal,
                background: "#fff",
                border: `1px solid ${C.taupe}`,
                borderRadius: 3,
                padding: "16px 18px",
                transition: "transform .2s, box-shadow .2s, border-color .2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.1)";
                e.currentTarget.style.borderColor = C.gold;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = C.taupe;
              }}
            >
              <span
                style={{
                  flex: "0 0 auto",
                  width: 42,
                  height: 42,
                  borderRadius: 3,
                  background: C.charcoal,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <LinkIcon kind={lnk.icon} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 600, fontSize: 14 }}>{lnk.label}</span>
                <span style={{ display: "block", fontSize: 12, color: C.brown, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {lnk.desc}
                </span>
              </span>
              <span style={{ flex: "0 0 auto", color: C.gold, fontSize: 18 }}>↗</span>
            </a>
          ))}
        </div>
      </section>

      {/* ── Category filter ── */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "1.75rem clamp(1.25rem,4vw,3rem) .5rem", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {CATS.map((cName) => (
          <button
            key={cName}
            onClick={() => setCat(cName)}
            style={{
              flex: "1 1 0",
              minWidth: "fit-content",
              whiteSpace: "nowrap",
              background: cat === cName ? C.charcoal : "transparent",
              color: cat === cName ? C.warmWhite : C.brown,
              border: `1px solid ${cat === cName ? C.charcoal : C.taupe}`,
              borderRadius: 2,
              padding: "7px 14px",
              fontSize: 11,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all .2s",
            }}
          >
            {cName}
          </button>
        ))}
      </section>

      {/* ── Grid ── */}
      <section
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "1rem clamp(1.25rem,4vw,3rem) 4rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
          gap: 14,
        }}
      >
        {shown.map((p) => (
          <Thumb key={p.id} photo={p} paid={paid} selected={selected.has(p.id)} onToggle={toggle} />
        ))}
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: C.brown, color: C.taupe, padding: "2rem clamp(1.25rem,4vw,3rem)", fontSize: 13 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: C.warmWhite }}>Knox Creative</div>
            <div style={{ marginTop: 4 }}>James Knox Photography · Athens, TN</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div>Questions about this delivery?</div>
            <a href="tel:+14234054150" style={{ color: C.gold, textDecoration: "none" }}>(423) 405-4150</a>
          </div>
        </div>
      </footer>

      {/* ── Download modal ── */}
      {dl && (
        <div
          onClick={() => dl.stage === "ready" && setDl(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(23,23,23,.6)",
            display: "grid",
            placeItems: "center",
            padding: 20,
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.warmWhite,
              borderRadius: 4,
              maxWidth: 440,
              width: "100%",
              padding: "clamp(1.75rem,5vw,2.5rem)",
              borderTop: `3px solid ${C.gold}`,
              textAlign: "center",
            }}
          >
            {dl.stage === "prep" ? (
              <>
                <div style={{ margin: "0 auto 18px", width: 46, height: 46, border: `3px solid ${C.taupe}`, borderTopColor: C.gold, borderRadius: "50%", animation: "kcspin 0.8s linear infinite" }} />
                <style>{`@keyframes kcspin{to{transform:rotate(360deg)}}`}</style>
                <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 22, margin: "0 0 6px" }}>
                  Preparing your files
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: C.brown }}>
                  Packaging {dl.scope === "all" ? "all photos" : `${selected.size} selected photo${selected.size > 1 ? "s" : ""}`} at full resolution — no watermark.
                </p>
              </>
            ) : (
              <>
                <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 24, margin: "0 0 6px" }}>
                  Ready to download
                </h3>
                <p style={{ margin: "0 0 22px", fontSize: 13, color: C.brown }}>
                  {dl.scope === "all" ? `${PHOTOS.length} full-resolution files` : `${selected.size} full-resolution file${selected.size > 1 ? "s" : ""}`} · MLS-ready · unbranded
                </p>

                {isPhone ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    <button onClick={() => finishDownload("camera")} style={{ ...btnSolid, padding: "14px 18px", width: "100%" }}>
                      Save to Camera Roll ↓
                    </button>
                    <button onClick={() => finishDownload("files")} style={{ ...btnOutline, padding: "14px 18px", width: "100%" }}>
                      Save ZIP to Files
                    </button>
                    <p style={{ margin: "6px 0 0", fontSize: 11, color: C.brown, lineHeight: 1.5 }}>
                      Saving to your photos drops every image straight into your camera roll — ready to post or text.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    <button onClick={() => finishDownload("zip")} style={{ ...btnSolid, padding: "14px 18px", width: "100%" }}>
                      Download ZIP ↓
                    </button>
                    <p style={{ margin: "6px 0 0", fontSize: 11, color: C.brown, lineHeight: 1.5 }}>
                      One ZIP with every image at full resolution. Unzips automatically on most computers.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setDl(null)}
                  style={{ marginTop: 16, background: "none", border: "none", color: C.brown, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: C.charcoal,
            color: C.warmWhite,
            padding: "12px 22px",
            borderRadius: 3,
            fontSize: 13,
            boxShadow: "0 8px 30px rgba(0,0,0,.3)",
            borderLeft: `3px solid ${C.gold}`,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

const btnSolid = {
  background: C.charcoal,
  color: C.warmWhite,
  border: `1.5px solid ${C.charcoal}`,
  borderRadius: 2,
  padding: "10px 18px",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const btnOutline = {
  background: "transparent",
  color: C.charcoal,
  border: `1.5px solid ${C.charcoal}`,
  borderRadius: 2,
  padding: "10px 18px",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  cursor: "pointer",
};
