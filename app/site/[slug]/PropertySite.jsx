"use client";
import React, { useState } from "react";

const C = {
  charcoal: "#171717",
  warmWhite: "#F7F4EF",
  taupe: "#C8B8A6",
  gold: "#B98A44",
  brown: "#2A211B",
  line: "#E3DDD2",
};

function Spec({ n, l, light }) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.1 }}>
      <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 20 }}>{n}</span>
      <span style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: light ? C.taupe : C.brown }}>{l}</span>
    </span>
  );
}

// Smooth-scroll to a section by id, with an optional callback before scrolling
// (used to open the embed so the iframe is present when we arrive).
function scrollTo(id, before) {
  if (before) before();
  setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 60);
}

// ── Request a Showing modal ───────────────────────────────────────────────────
function ShowingModal({ galleryId, agentName, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/request-showing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ galleryId, visitorName: form.name, visitorEmail: form.email, visitorPhone: form.phone, message: form.message }),
    });
    setStatus(res.ok ? "done" : "error");
  };

  const inp = { display: "block", width: "100%", padding: "11px 14px", border: `1px solid ${C.line}`, borderRadius: 2, fontFamily: "Inter, sans-serif", fontSize: 14, boxSizing: "border-box", background: "#fff" };
  const lbl = { display: "block", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: C.brown, marginBottom: 5 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(23,23,23,.6)", display: "grid", placeItems: "center", padding: 20, zIndex: 60 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.warmWhite, borderRadius: 4, width: "min(100%, 460px)", padding: "2rem", borderTop: `3px solid ${C.gold}`, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 18, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.taupe }}>×</button>

        {status === "done" ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 22, margin: "0 0 8px" }}>Request Sent</h3>
            <p style={{ color: C.brown, fontSize: 14, margin: "0 0 20px" }}>
              {agentName ? `${agentName.split(" ")[0]} will` : "The agent will"} be in touch with you shortly.
            </p>
            <button onClick={onClose} style={{ ...btnSolid, padding: "12px 28px" }}>Close</button>
          </div>
        ) : (
          <>
            <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 22, margin: "0 0 4px" }}>Request a Showing</h3>
            <p style={{ fontSize: 13, color: C.brown, margin: "0 0 20px" }}>
              {agentName ? `Send a message directly to ${agentName}.` : "Send a message to the listing agent."}
            </p>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Your Name *</label>
                <input style={inp} value={form.name} onChange={set("name")} required placeholder="Jane Smith" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Email *</label>
                <input style={inp} type="email" value={form.email} onChange={set("email")} required placeholder="jane@email.com" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Phone</label>
                <input style={inp} type="tel" value={form.phone} onChange={set("phone")} placeholder="(423) 555-0100" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Message</label>
                <textarea style={{ ...inp, height: 90, resize: "vertical" }} value={form.message} onChange={set("message")} placeholder="I'd love to schedule a showing this week…" />
              </div>
              {status === "error" && (
                <p style={{ color: "#c0392b", fontSize: 13, margin: "-8px 0 12px" }}>Something went wrong — please try again.</p>
              )}
              <button type="submit" disabled={status === "sending"} style={{ ...btnSolid, width: "100%", padding: "13px" }}>
                {status === "sending" ? "Sending…" : "Send Request"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function PropertySite({ property: p }) {
  const [tourOpen, setTourOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [showingOpen, setShowingOpen] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState("Exterior");

  // Sort all media by sort_order then created_at
  const photos = [...(p.media || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // Unique categories present in this gallery, in the order they first appear
  const categories = ["All", ...Array.from(new Set(photos.map((ph) => ph.category).filter(Boolean)))];

  // The subset shown in the grid (and used for lightbox indexing)
  const visiblePhotos = galleryFilter === "All" ? photos : photos.filter((ph) => ph.category === galleryFilter);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: C.warmWhite, color: C.charcoal }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform: translateY(12px);} to {opacity:1; transform:none;} }
        .overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(2rem,5vw,4rem); align-items: start; }
        @media (max-width: 680px) { .overview-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Top bar */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(23,23,23,.95)", backdropFilter: "blur(8px)", color: C.warmWhite, padding: "14px clamp(1.25rem,4vw,3rem)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 20 }}>
          KNOX <span style={{ fontWeight: 500, color: C.gold }}>Creative</span>
        </div>
        {p.agent?.phone && (
          <a href={`tel:${p.agent.phone.replace(/\D/g, "")}`} style={{ color: C.warmWhite, textDecoration: "none", fontSize: 13, border: `1px solid ${C.gold}`, padding: "8px 14px", borderRadius: 2 }}>
            Contact Agent
          </a>
        )}
      </header>

      {/* Hero */}
      <section style={{ position: "relative", height: "min(78vh, 680px)", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
        {photos[0]?.preview_path ? (
          <img
            src={`${supabaseUrl}/storage/v1/object/public/kc-previews/${photos[0].preview_path}`}
            alt={p.address}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(150deg, hsl(207 35% 62%), hsl(207 30% 40%))` }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(23,23,23,.82) 0%, rgba(23,23,23,.15) 45%, rgba(23,23,23,.25) 100%)" }} />
        <div style={{ position: "relative", padding: "clamp(1.5rem,4vw,3rem)", color: C.warmWhite, maxWidth: 1400, margin: "0 auto", width: "100%", animation: "fadeUp .8s ease both" }}>
          <p style={{ margin: 0, fontSize: 12, letterSpacing: ".2em", textTransform: "uppercase", color: C.gold }}>For Sale · {p.city}, {p.state}</p>
          <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "clamp(2.4rem,7vw,5rem)", lineHeight: 1.02, margin: "8px 0 10px", letterSpacing: "-.01em" }}>
            {p.address}
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 28px", fontSize: 16, alignItems: "center" }}>
            {p.beds && <Spec n={p.beds} l="Beds" light />}
            {p.baths && <Spec n={p.baths} l="Baths" light />}
            {p.sqft && <Spec n={p.sqft.toLocaleString()} l="Sq Ft" light />}
          </div>
        </div>
      </section>

      {/* Quick-action bar */}
      <section style={{ background: C.charcoal, color: C.warmWhite, padding: "0 clamp(1.25rem,4vw,3rem)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 0, borderLeft: `1px solid rgba(255,255,255,.08)` }}>
          {[
            photos.length > 0 && {
              label: "Photo Gallery",
              onClick: () => scrollTo("gallery"),
            },
            p.link_virtual_tour && {
              label: "Virtual Tour",
              onClick: () => scrollTo("virtual-tour", () => setTourOpen(true)),
            },
            p.link_floorplan_3d && {
              label: "3D Floor Plan & Sun Map",
              onClick: () => scrollTo("floorplan", () => setPlanOpen(true)),
            },
            p.agent && {
              label: "Request a Showing",
              onClick: () => setShowingOpen(true),
            },
          ].filter(Boolean).map((a) => (
            <button key={a.label}
              onClick={a.onClick}
              style={{ flex: "1 1 180px", textAlign: "center", padding: "18px 12px", color: C.warmWhite, background: "none", border: "none", borderRight: `1px solid rgba(255,255,255,.08)`, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer", transition: "background .2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(185,138,68,.18)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              {a.label}
            </button>
          ))}
        </div>
      </section>

      {/* Overview + Map */}
      {(p.description || p.address) && (
        <section style={{ maxWidth: 1400, margin: "0 auto", padding: "clamp(2.5rem,6vw,4.5rem) clamp(1.25rem,4vw,3rem)" }}>
          <div className="overview-grid">
            {/* Description */}
            <div>
              <p style={{ fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase", color: C.gold, margin: 0 }}>About This Home</p>
              <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "clamp(1.7rem,4vw,2.5rem)", margin: "8px 0 16px", lineHeight: 1.1 }}>
                {p.city}, {p.state} {p.zip}
              </h2>
              {p.description && (
                <p style={{ fontSize: 16, lineHeight: 1.7, color: C.brown, margin: 0 }}>{p.description}</p>
              )}
            </div>

            {/* Google Map */}
            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
              <div style={{ borderRadius: 3, overflow: "hidden", aspectRatio: "4/3", boxShadow: "0 4px 24px rgba(0,0,0,.10)", border: `1px solid ${C.line}` }}>
                <iframe
                  title="Property location"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(`${p.address}, ${p.city}, ${p.state} ${p.zip || ""}`)}&zoom=15`}
                  style={{ width: "100%", height: "100%", border: 0, display: "block" }}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Photo gallery — filterable by category */}
      {photos.length > 0 && (
        <section id="gallery" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 clamp(1.25rem,4vw,3rem) clamp(2.5rem,6vw,4rem)" }}>
          {/* Header + count */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "clamp(1.6rem,4vw,2.2rem)", margin: 0 }}>Gallery</h2>
            <span style={{ fontSize: 13, color: C.brown }}>
              {visiblePhotos.length}{galleryFilter !== "All" ? ` of ${photos.length}` : ""} photo{photos.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Category filter tabs — only render if more than one category exists */}
          {categories.length > 2 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {categories.map((cat) => {
                const active = galleryFilter === cat;
                return (
                  <button key={cat} onClick={() => { setGalleryFilter(cat); setLightbox(null); }}
                    style={{
                      padding: "7px 16px",
                      borderRadius: 2,
                      border: `1.5px solid ${active ? C.gold : C.line}`,
                      background: active ? C.gold : "#fff",
                      color: active ? C.charcoal : C.brown,
                      fontSize: 12,
                      fontWeight: active ? 600 : 400,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      transition: "border-color .15s, background .15s",
                    }}>
                    {cat}
                  </button>
                );
              })}
            </div>
          )}

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gridAutoRows: "200px", gap: 10 }}>
            {visiblePhotos.map((photo, i) => (
              <button key={photo.id || i} onClick={() => setLightbox(i)}
                style={{ gridColumn: i === 0 ? "span 2" : "auto", border: "none", padding: 0, cursor: "pointer", borderRadius: 2, overflow: "hidden", transition: "transform .3s, box-shadow .3s", background: C.taupe }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.01)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,.18)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
                aria-label={photo.label || `Photo ${i + 1}`}>
                <img
                  src={`${supabaseUrl}/storage/v1/object/public/kc-previews/${photo.preview_path}`}
                  alt={photo.label || ""}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  loading={i < 6 ? "eager" : "lazy"}
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Virtual Tour */}
      {p.link_virtual_tour && (
        <section id="virtual-tour" style={{ background: C.charcoal, padding: "clamp(2.5rem,6vw,4rem) clamp(1.25rem,4vw,3rem)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "clamp(1.6rem,4vw,2.2rem)", margin: "0 0 18px", color: C.warmWhite }}>Virtual Tour</h2>
            <div style={{ position: "relative", borderRadius: 3, overflow: "hidden", aspectRatio: "16 / 9", background: "#111" }}>
              {tourOpen ? (
                <iframe src={p.link_virtual_tour} loading="lazy" allowFullScreen title="Virtual Tour"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
              ) : (
                <button onClick={() => setTourOpen(true)} style={{ position: "absolute", inset: 0, border: "none", background: "transparent", cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <span style={{ display: "grid", placeItems: "center", width: 76, height: 76, borderRadius: "50%", background: "rgba(185,138,68,.92)" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill={C.charcoal}><path d="M8 5v14l11-7z" /></svg>
                  </span>
                  <span style={{ position: "absolute", bottom: 20, color: C.warmWhite, fontSize: 13, letterSpacing: ".1em", textTransform: "uppercase" }}>Play Walkthrough</span>
                </button>
              )}
            </div>
            <p style={{ color: C.taupe, fontSize: 12, marginTop: 10 }}>Tap to load — keeps the page fast until you want the tour.</p>
          </div>
        </section>
      )}

      {/* 3D Floor Plan */}
      {p.link_floorplan_3d && (
        <section id="floorplan" style={{ background: C.brown, padding: "clamp(2.5rem,6vw,4rem) clamp(1.25rem,4vw,3rem)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "clamp(1.6rem,4vw,2.2rem)", margin: "0 0 6px", color: C.warmWhite }}>3D Floor Plan & Sun Map</h2>
            <p style={{ color: C.taupe, fontSize: 14, margin: "0 0 18px" }}>Walk the layout and see how natural light moves through the home across the day.</p>
            <div style={{ position: "relative", borderRadius: 3, overflow: "hidden", aspectRatio: "16 / 9", background: "#111" }}>
              {planOpen ? (
                <iframe src={p.link_floorplan_3d} loading="lazy" allowFullScreen title="3D Floor Plan"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
              ) : (
                <button onClick={() => setPlanOpen(true)} style={{ position: "absolute", inset: 0, border: "none", background: "transparent", cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <span style={{ display: "grid", placeItems: "center", width: 76, height: 76, borderRadius: "50%", background: "rgba(185,138,68,.92)" }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.charcoal} strokeWidth="1.8"><path d="M3 9l9-5 9 5-9 5-9-5z" /><path d="M3 9v6l9 5 9-5V9" /><path d="M12 14v6" /></svg>
                  </span>
                  <span style={{ position: "absolute", bottom: 20, color: C.warmWhite, fontSize: 13, letterSpacing: ".1em", textTransform: "uppercase" }}>Open 3D Floor Plan</span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Agent card */}
      {p.agent && (
        <section id="agent" style={{ maxWidth: 1400, margin: "0 auto", padding: "clamp(2.5rem,6vw,4.5rem) clamp(1.25rem,4vw,3rem)" }}>
          <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 4, padding: "clamp(1.5rem,4vw,2.5rem)", display: "flex", flexWrap: "wrap", gap: "clamp(1.25rem,4vw,2.5rem)", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              {p.agent.headshot_url ? (
                <img src={p.agent.headshot_url} alt={p.agent.name} style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover", flex: "0 0 auto" }} />
              ) : (
                <div style={{ width: 84, height: 84, borderRadius: "50%", background: `linear-gradient(135deg, ${C.taupe}, ${C.gold})`, flex: "0 0 auto" }} />
              )}
              <div>
                <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: C.gold }}>REALTOR®</div>
                <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 26 }}>{p.agent.name}</div>
                <div style={{ fontSize: 14, color: C.brown }}>{p.agent.phone}{p.agent.email ? ` · ${p.agent.email}` : ""}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {p.agent.phone && <a href={`tel:${p.agent.phone.replace(/\D/g, "")}`} style={btnSolid}>Call</a>}
              {p.agent.email && <a href={`mailto:${p.agent.email}`} style={btnOutline}>Email</a>}
              <button onClick={() => setShowingOpen(true)} style={{ ...btnSolid, background: C.gold, borderColor: C.gold, color: C.charcoal }}>Request a Showing</button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ background: C.brown, color: C.taupe, padding: "2.5rem clamp(1.25rem,4vw,3rem)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 22, color: C.warmWhite }}>Knox Creative</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Real estate photography & marketing · Athens, TN</div>
          </div>
          <div style={{ fontSize: 12, textAlign: "right" }}>
            <div>Photography by James Knox</div>
            <a href="https://knoxhd.com" style={{ color: C.gold, textDecoration: "none" }}>knoxhd.com</a>
          </div>
        </div>
      </footer>

      {/* Lightbox — navigates within the current filter set */}
      {lightbox !== null && visiblePhotos[lightbox] && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(23,23,23,.94)", display: "grid", placeItems: "center", zIndex: 60, padding: 20 }}>
          <img
            src={`${supabaseUrl}/storage/v1/object/public/kc-previews/${visiblePhotos[lightbox].preview_path}`}
            alt={visiblePhotos[lightbox].label || ""}
            style={{ maxWidth: "88vw", maxHeight: "86vh", objectFit: "contain", borderRadius: 2, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}
          />
          {/* Close */}
          <button onClick={() => setLightbox(null)} style={{ position: "fixed", top: 20, right: 24, background: "none", border: "none", color: C.warmWhite, fontSize: 30, cursor: "pointer", zIndex: 61 }}>×</button>
          {/* Prev */}
          {lightbox > 0 && (
            <button onClick={() => setLightbox(lightbox - 1)}
              style={{ position: "fixed", left: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.45)", border: "none", color: "#fff", fontSize: 28, cursor: "pointer", borderRadius: 2, padding: "12px 16px", zIndex: 61 }}>
              ‹
            </button>
          )}
          {/* Next */}
          {lightbox < visiblePhotos.length - 1 && (
            <button onClick={() => setLightbox(lightbox + 1)}
              style={{ position: "fixed", right: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.45)", border: "none", color: "#fff", fontSize: 28, cursor: "pointer", borderRadius: 2, padding: "12px 16px", zIndex: 61 }}>
              ›
            </button>
          )}
          {/* Counter */}
          <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", color: C.taupe, fontSize: 12, letterSpacing: ".1em" }}>
            {lightbox + 1} / {visiblePhotos.length}
          </div>
        </div>
      )}

      {/* Request a Showing modal */}
      {showingOpen && (
        <ShowingModal
          galleryId={p.id}
          agentName={p.agent?.name}
          onClose={() => setShowingOpen(false)}
        />
      )}
    </div>
  );
}

const btnSolid = { background: C.charcoal, color: C.warmWhite, border: `1.5px solid ${C.charcoal}`, borderRadius: 2, padding: "12px 24px", fontSize: 12, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", textDecoration: "none" };
const btnOutline = { background: "transparent", color: C.charcoal, border: `1.5px solid ${C.charcoal}`, borderRadius: 2, padding: "12px 24px", fontSize: 12, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", textDecoration: "none" };
