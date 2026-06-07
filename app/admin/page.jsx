"use client";
import React, { useState, useEffect, useCallback } from "react";
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

const usd = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;

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
    total_cents: gallery ? gallery.total_cents : "",
    deposit_cents: gallery ? gallery.deposit_cents : "",
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
    const body = {
      ...form,
      sqft: form.sqft ? Number(form.sqft) : null,
      beds: form.beds ? Number(form.beds) : null,
      baths: form.baths ? Number(form.baths) : null,
      total_cents: Number(form.total_cents) || 0,
      deposit_cents: Number(form.deposit_cents) || 0,
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
          <div><label style={label}>Total (cents)</label><input style={inp} type="number" value={form.total_cents} onChange={set("total_cents")} placeholder="42500" /></div>
          <div><label style={label}>Deposit (cents)</label><input style={inp} type="number" value={form.deposit_cents} onChange={set("deposit_cents")} placeholder="10000" /></div>
          <div style={{ gridColumn: "1/-1" }}><label style={label}>Virtual Tour URL</label><input style={inp} value={form.link_virtual_tour} onChange={set("link_virtual_tour")} placeholder="https://tour.giraffe360.com/…" /></div>
          <div style={{ gridColumn: "1/-1" }}><label style={label}>3D Floor Plan URL</label><input style={inp} value={form.link_floorplan_3d} onChange={set("link_floorplan_3d")} placeholder="https://my.giraffe360.com/…" /></div>
          <div style={{ gridColumn: "1/-1" }}><label style={label}>Description</label><textarea style={{ ...inp, height: 80, resize: "vertical" }} value={form.description} onChange={set("description")} /></div>
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
function AgentModal({ agent, token, onSave, onClose }) {
  const isNew = !agent?.id;
  const [form, setForm] = useState({ name: agent?.name || "", email: agent?.email || "", phone: agent?.phone || "", brokerage: agent?.brokerage || "" });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const inp = { border: `1px solid ${C.line}`, borderRadius: 2, padding: "9px 12px", fontFamily: "Inter, sans-serif", fontSize: 13, width: "100%", boxSizing: "border-box" };
  const label = { fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: C.brown, display: "block", marginBottom: 5 };

  const handleSave = async () => {
    setSaving(true);
    const body = isNew ? form : { id: agent.id, ...form };
    const data = await api("/api/admin/agents", isNew ? "POST" : "PATCH", body, token);
    setSaving(false);
    if (data.agent) onSave(data.agent);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(23,23,23,.6)", display: "grid", placeItems: "center", padding: 20, zIndex: 50 }}>
      <div style={{ background: C.warmWhite, borderRadius: 4, maxWidth: 480, width: "100%", padding: "2rem", borderTop: `3px solid ${C.gold}` }}>
        <h3 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 22, margin: "0 0 20px" }}>{isNew ? "New Agent" : "Edit Agent"}</h3>
        <div style={{ display: "grid", gap: 14 }}>
          <div><label style={label}>Name</label><input style={inp} value={form.name} onChange={set("name")} placeholder="Evelyn Cole" /></div>
          <div><label style={label}>Email</label><input style={inp} type="email" value={form.email} onChange={set("email")} /></div>
          <div><label style={label}>Phone</label><input style={inp} value={form.phone} onChange={set("phone")} placeholder="(423) 555-0100" /></div>
          <div><label style={label}>Brokerage</label><input style={inp} value={form.brokerage} onChange={set("brokerage")} /></div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...btnOutline, padding: "10px 20px" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ ...btnSolid, padding: "10px 24px" }}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main admin dashboard ──────────────────────────────────────────────────────
function Dashboard({ session, onLogout }) {
  const token = session.access_token;
  const [tab, setTab] = useState("galleries");
  const [galleries, setGalleries] = useState([]);
  const [agents, setAgents] = useState([]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [notifying, setNotifying] = useState(null);
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
        {["galleries", "agents"].map((t) => (
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
                    <button onClick={() => setModal({ type: "gallery", data: g })} style={{ ...btnOutline, padding: "8px 14px" }}>Edit</button>
                    <button
                      onClick={() => sendAlert(g.id)}
                      disabled={notifying === g.id}
                      style={{ ...btnSolid, padding: "8px 14px", background: C.gold, borderColor: C.gold, color: C.charcoal }}
                    >
                      {notifying === g.id ? "Sending…" : "Send Alert"}
                    </button>
                  </div>
                </div>
              ))}
              {galleries.length === 0 && <p style={{ color: C.brown, fontSize: 14 }}>No galleries yet — create your first one.</p>}
            </div>
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
