import React, { useState, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// KNOX CREATIVE — Branded Property Site (working prototype)
//
// The PUBLIC marketing page for a listing, served at 242fykedr.knoxhd.com.
// Unlike the client gallery, there is NO paywall and NO watermark here — by the
// time this is live the agent has paid, and this page exists to be shared widely
// (MLS, social, email). It's the on-your-domain version of Giraffe360's
// "single-listing website," branded Knox Creative + the agent.
//
// PRODUCTION: rendered by app/[slug]/page.jsx for the wildcard subdomain,
// pulling one gallery row + its media by site_slug. Tour/floorplan are
// lazy-loaded iframes (click-to-load) to protect page speed.
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  charcoal: "#171717",
  warmWhite: "#F7F4EF",
  taupe: "#C8B8A6",
  gold: "#B98A44",
  goldHover: "#A07736",
  brown: "#2A211B",
  line: "#E3DDD2",
};

// PRODUCTION: this is one gallery row joined to its agent + media.
const PROPERTY = {
  address: "242 Fyke Dr",
  city: "Athens",
  state: "TN",
  zip: "37303",
  beds: 4,
  baths: 2.5,
  sqft: 1798,
  lot: "0.18 acres",
  yearBuilt: 2015,
  price: "$324,900",
  description:
    "Move-in ready in the heart of Athens. This 4-bedroom home pairs an open main level with a bright, functional kitchen and a fenced backyard. Minutes from downtown, schools, and I-75 — comfortable, well-kept, and ready for its next owner.",
  highlights: ["Open-concept main level", "Updated kitchen", "Primary suite with walk-in", "Two-car garage", "Fenced backyard", "Built 2015"],
  links: {
    tour: "https://tour.giraffe360.com/ce299...",
    floorplan3d: "https://my.giraffe360.com/3dflp/...",
  },
  agent: {
    name: "Evelyn Cole",
    title: "REALTOR®",
    phone: "(423) 462-4093",
    email: "ekcole23@gmail.com",
  },
};

// gallery preview images (gradient stand-ins; production = real <img> srcs)
const PHOTOS = [
  { id: 1, hue: 207, span: 2 }, { id: 2, hue: 30 }, { id: 3, hue: 38 },
  { id: 4, hue: 28 }, { id: 5, hue: 200 }, { id: 6, hue: 95, span: 2 },
  { id: 7, hue: 110 }, { id: 8, hue: 25 }, { id: 9, hue: 280 },
];

export default function PropertySite() {
  const [tourOpen, setTourOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: C.warmWhite, color: C.charcoal }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform: translateY(12px);} to {opacity:1; transform:none;} }`}</style>

      {/* ── Top bar ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(23,23,23,.95)", backdropFilter: "blur(8px)", color: C.warmWhite, padding: "14px clamp(1.25rem,4vw,3rem)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 20 }}>
          KNOX <span style={{ fontWeight: 500, color: C.gold }}>Creative</span>
        </div>
        <a href={`tel:${PROPERTY.agent.phone.replace(/\D/g, "")}`} style={{ color: C.warmWhite, textDecoration: "none", fontSize: 13, border: `1px solid ${C.gold}`, padding: "8px 14px", borderRadius: 2 }}>
          Contact Agent
        </a>
      </header>

      {/* ── Hero ── */}
      <section style={{ position: "relative", height: "min(78vh, 680px)", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(150deg, hsl(207 35% 62%), hsl(207 30% 40%))` }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(23,23,23,.82) 0%, rgba(23,23,23,.15) 45%, rgba(23,23,23,.25) 100%)" }} />
        <div style={{ position: "relative", padding: "clamp(1.5rem,4vw,3rem)", color: C.warmWhite, maxWidth: 1400, margin: "0 auto", width: "100%", animation: "fadeUp .8s ease both" }}>
          <p style={{ margin: 0, fontSize: 12, letterSpacing: ".2em", textTransform: "uppercase", color: C.gold }}>For Sale · Athens, Tennessee</p>
          <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "clamp(2.4rem,7vw,5rem)", lineHeight: 1.02, margin: "8px 0 10px", letterSpacing: "-.01em" }}>
            {PROPERTY.address}
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 28px", fontSize: 16, alignItems: "center" }}>
            <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 26, color: C.gold }}>{PROPERTY.price}</span>
            <Spec n={PROPERTY.beds} l="Beds" light />
            <Spec n={PROPERTY.baths} l="Baths" light />
            <Spec n={PROPERTY.sqft.toLocaleString()} l="Sq Ft" light />
            <Spec n={PROPERTY.lot} l="Lot" light />
          </div>
        </div>
      </section>

      {/* ── Quick actions ── */}
      <section style={{ background: C.charcoal, color: C.warmWhite, padding: "0 clamp(1.25rem,4vw,3rem)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 0, borderLeft: `1px solid rgba(255,255,255,.08)` }}>
          {[
            { label: "Virtual Tour", onClick: () => setTourOpen(true) },
            { label: "3D Floor Plan & Sun Map", onClick: () => setPlanOpen(true) },
            { label: "Photo Gallery", href: "#gallery" },
            { label: "Request a Showing", href: "#agent" },
          ].map((a) => (
            <a key={a.label} href={a.href} onClick={a.onClick}
              style={{ flex: "1 1 200px", textAlign: "center", padding: "18px 12px", color: C.warmWhite, textDecoration: "none", fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", borderRight: `1px solid rgba(255,255,255,.08)`, cursor: "pointer", transition: "background .2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(185,138,68,.18)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              {a.label}
            </a>
          ))}
        </div>
      </section>

      {/* ── Overview ── */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "clamp(2.5rem,6vw,4.5rem) clamp(1.25rem,4vw,3rem)", display: "grid", gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)", gap: "clamp(1.5rem,5vw,4rem)" }}>
        <div>
          <p style={{ fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase", color: C.gold, margin: 0 }}>About This Home</p>
          <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "clamp(1.7rem,4vw,2.5rem)", margin: "8px 0 16px", lineHeight: 1.1 }}>
            Comfortable, well-kept, move-in ready
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: C.brown, margin: 0 }}>{PROPERTY.description}</p>
        </div>
        <div style={{ borderLeft: `2px solid ${C.gold}`, paddingLeft: "clamp(1rem,3vw,2rem)" }}>
          <p style={{ fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase", color: C.gold, margin: "0 0 14px" }}>Features</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
            {PROPERTY.highlights.map((h) => (
              <li key={h} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 15, color: C.charcoal }}>
                <span style={{ color: C.gold, marginTop: 2 }}>—</span>{h}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Gallery ── */}
      <section id="gallery" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 clamp(1.25rem,4vw,3rem) clamp(2.5rem,6vw,4rem)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "clamp(1.6rem,4vw,2.2rem)", margin: 0 }}>Gallery</h2>
          <span style={{ fontSize: 13, color: C.brown }}>{PHOTOS.length} of 60 photos</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gridAutoRows: "200px", gap: 10 }}>
          {PHOTOS.map((p) => (
            <button key={p.id} onClick={() => setLightbox(p)} style={{
              gridColumn: p.span ? `span ${p.span}` : "auto", border: "none", padding: 0, cursor: "pointer", borderRadius: 2, overflow: "hidden",
              background: `linear-gradient(150deg, hsl(${p.hue} 30% 72%), hsl(${p.hue} 26% 50%))`, transition: "transform .3s, box-shadow .3s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.01)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,.18)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
              aria-label={`Photo ${p.id}`} />
          ))}
        </div>
      </section>

      {/* ── Tour (lazy: iframe only mounts when opened) ── */}
      <section style={{ background: C.charcoal, padding: "clamp(2.5rem,6vw,4rem) clamp(1.25rem,4vw,3rem)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "clamp(1.6rem,4vw,2.2rem)", margin: "0 0 18px", color: C.warmWhite }}>Virtual Tour</h2>
          <div style={{ position: "relative", borderRadius: 3, overflow: "hidden", aspectRatio: "16 / 9", background: `linear-gradient(135deg, hsl(207 25% 30%), hsl(28 25% 25%))` }}>
            {tourOpen ? (
              // PRODUCTION: <iframe src={PROPERTY.links.tour} loading="lazy" allowFullScreen .../>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: C.taupe, fontSize: 14 }}>
                Giraffe360 tour iframe loads here →{" "}
                <span style={{ color: C.gold, marginLeft: 6 }}>{PROPERTY.links.tour}</span>
              </div>
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

      {/* ── 3D Floor Plan & Sun Map (lazy embed) ── */}
      <section style={{ background: C.brown, padding: "clamp(2.5rem,6vw,4rem) clamp(1.25rem,4vw,3rem)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "clamp(1.6rem,4vw,2.2rem)", margin: "0 0 6px", color: C.warmWhite }}>3D Floor Plan & Sun Map</h2>
          <p style={{ color: C.taupe, fontSize: 14, margin: "0 0 18px" }}>Walk the layout and see how natural light moves through the home across the day.</p>
          <div style={{ position: "relative", borderRadius: 3, overflow: "hidden", aspectRatio: "16 / 9", background: `linear-gradient(135deg, hsl(40 22% 32%), hsl(210 20% 26%))` }}>
            {planOpen ? (
              // PRODUCTION: <iframe src={PROPERTY.links.floorplan3d} loading="lazy" allowFullScreen
              //   style={{position:'absolute',inset:0,width:'100%',height:'100%',border:0}} />
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: C.taupe, fontSize: 14, textAlign: "center", padding: 20 }}>
                Giraffe360 3D floor plan & sun map iframe loads here →
                <span style={{ color: C.gold, marginLeft: 6, wordBreak: "break-all" }}>{PROPERTY.links.floorplan3d}</span>
              </div>
            ) : (
              <button onClick={() => setPlanOpen(true)} style={{ position: "absolute", inset: 0, border: "none", background: "transparent", cursor: "pointer", display: "grid", placeItems: "center" }}>
                <span style={{ display: "grid", placeItems: "center", width: 76, height: 76, borderRadius: "50%", background: "rgba(185,138,68,.92)" }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.charcoal} strokeWidth="1.8"><path d="M3 9l9-5 9 5-9 5-9-5z" /><path d="M3 9v6l9 5 9-5V9" /><path d="M12 14v6" /></svg>
                </span>
                <span style={{ position: "absolute", bottom: 20, color: C.warmWhite, fontSize: 13, letterSpacing: ".1em", textTransform: "uppercase" }}>Open 3D Floor Plan</span>
              </button>
            )}
          </div>
          <p style={{ color: C.taupe, fontSize: 12, marginTop: 10 }}>Tap to load — the interactive plan stays off the page until requested.</p>
        </div>
      </section>

      {/* ── Agent card ── */}
      <section id="agent" style={{ maxWidth: 1400, margin: "0 auto", padding: "clamp(2.5rem,6vw,4.5rem) clamp(1.25rem,4vw,3rem)" }}>
        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 4, padding: "clamp(1.5rem,4vw,2.5rem)", display: "flex", flexWrap: "wrap", gap: "clamp(1.25rem,4vw,2.5rem)", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div style={{ width: 84, height: 84, borderRadius: "50%", background: `linear-gradient(135deg, ${C.taupe}, ${C.gold})`, flex: "0 0 auto" }} />
            <div>
              <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: C.gold }}>{PROPERTY.agent.title}</div>
              <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 26 }}>{PROPERTY.agent.name}</div>
              <div style={{ fontSize: 14, color: C.brown }}>{PROPERTY.agent.phone} · {PROPERTY.agent.email}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <a href={`tel:${PROPERTY.agent.phone.replace(/\D/g, "")}`} style={btnSolid}>Call</a>
            <a href={`mailto:${PROPERTY.agent.email}`} style={btnOutline}>Email</a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
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

      {/* ── Lightbox ── */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(23,23,23,.92)", display: "grid", placeItems: "center", zIndex: 60, padding: 20 }}>
          <div style={{ width: "min(90vw, 1100px)", aspectRatio: "3/2", borderRadius: 3, background: `linear-gradient(150deg, hsl(${lightbox.hue} 30% 72%), hsl(${lightbox.hue} 26% 50%))`, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }} />
          <button onClick={() => setLightbox(null)} style={{ position: "fixed", top: 20, right: 24, background: "none", border: "none", color: C.warmWhite, fontSize: 30, cursor: "pointer" }}>×</button>
        </div>
      )}
    </div>
  );
}

function Spec({ n, l, light }) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.1 }}>
      <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 20 }}>{n}</span>
      <span style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: light ? C.taupe : C.brown }}>{l}</span>
    </span>
  );
}

const btnSolid = { background: C.charcoal, color: C.warmWhite, border: `1.5px solid ${C.charcoal}`, borderRadius: 2, padding: "12px 24px", fontSize: 12, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", textDecoration: "none" };
const btnOutline = { background: "transparent", color: C.charcoal, border: `1.5px solid ${C.charcoal}`, borderRadius: 2, padding: "12px 24px", fontSize: 12, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", textDecoration: "none" };
