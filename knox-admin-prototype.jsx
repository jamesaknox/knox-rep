import React, { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// KNOX CREATIVE — Admin (working prototype)
// Three areas: Galleries, Products, Agents. This is the screen James logs into
// to run the business — create a gallery, set its price + deposit, send the
// "media ready" alert, and edit the product catalog without touching code.
//
// PROTOTYPE: state is in-memory. Each action maps to a real route already built:
//   create/edit gallery  -> /api/admin/galleries   (POST/PATCH)
//   edit product         -> /api/admin/products     (POST/PATCH/DELETE)
//   manage agent         -> /api/admin/agents       (POST/PATCH)
//   send "media ready"   -> /api/notify             (POST)
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

const usd = (cents) => `$${(cents / 100).toFixed(2)}`;

// ── Seed data mirroring the real seed.sql ──
const SEED_AGENTS = [
  { id: "a1", name: "Evelyn Cole", email: "ekcole23@gmail.com", phone: "(423) 462-4093", brokerage: "" },
  { id: "a2", name: "Corrina Ashe", email: "", phone: "(423) 261-5480", brokerage: "" },
  { id: "a3", name: "Loretta Edgemon", email: "", phone: "(423) 506-8171", brokerage: "" },
];

const SEED_GALLERIES = [
  { id: "g1", address: "242 Fyke Dr", city: "Athens", zip: "37303", sqft: 1798, agentId: "a1", total_cents: 42500, deposit_cents: 10000, paid: true, status: "delivery_only", mediaCount: 60, notified: true },
  { id: "g2", address: "858 Main St", city: "Decatur", zip: "37322", sqft: 2100, agentId: null, total_cents: 32500, deposit_cents: 10000, paid: false, status: "preparing", mediaCount: 0, notified: false },
];

const SEED_PRODUCTS = [
  { id: "p1", kind: "package", name: "Listing Photos", size_label: "Under 2,000 sq ft", price_cents: 17500, active: true },
  { id: "p2", kind: "package", name: "Enhanced Listing", size_label: "Under 2,000 sq ft", price_cents: 27500, active: true },
  { id: "p3", kind: "package", name: "Complete Listing", size_label: "Under 2,000 sq ft", price_cents: 42500, active: true },
  { id: "p4", kind: "package", name: "Signature Listing", size_label: "Under 2,000 sq ft", price_cents: 52500, active: true },
  { id: "p5", kind: "addon", name: "Drone Aerial Photos", size_label: null, price_cents: 5000, active: true },
  { id: "p6", kind: "addon", name: "Virtual Twilight", size_label: null, price_cents: 2000, active: true },
  { id: "p7", kind: "addon", name: "Virtual Staging", size_label: null, price_cents: 2000, active: true },
];

export default function KnoxAdmin() {
  const [tab, setTab] = useState("galleries");
  const [agents, setAgents] = useState(SEED_AGENTS);
  const [galleries, setGalleries] = useState(SEED_GALLERIES);
  const [products, setProducts] = useState(SEED_PRODUCTS);
  const [modal, setModal] = useState(null); // {type, data}
  const [toast, setToast] = useState("");

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2600); };
  const agentName = (id) => agents.find((a) => a.id === id)?.name || "—";

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: C.warmWhite, color: C.charcoal, minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        input, select, textarea { font-family: Inter, sans-serif; }`}</style>

      {/* Header */}
      <header style={{ background: C.charcoal, color: C.warmWhite, padding: "16px clamp(1.25rem,4vw,3rem)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 24 }}>
          KNOX <span style={{ fontWeight: 500, color: C.gold }}>Creative</span>
          <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: C.taupe, marginLeft: 12 }}>Admin</span>
        </div>
        <div style={{ fontSize: 13, color: C.taupe }}>James Knox</div>
      </header>
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />

      {/* Tabs */}
      <nav style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(1.25rem,4vw,3rem)", display: "flex", gap: 4, borderBottom: `1px solid ${C.line}` }}>
        {[["galleries", "Galleries"], ["products", "Products"], ["agents", "Agents"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "18px 18px 14px",
            fontSize: 13, fontWeight: 600, letterSpacing: ".04em", color: tab === k ? C.charcoal : "#9A9186",
            borderBottom: tab === k ? `2px solid ${C.gold}` : "2px solid transparent", marginBottom: -1,
          }}>{label}</button>
        ))}
      </nav>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(1.5rem,4vw,2.5rem) clamp(1.25rem,4vw,3rem) 4rem" }}>
        {tab === "galleries" && (
          <Galleries
            galleries={galleries} agentName={agentName}
            onNew={() => setModal({ type: "gallery", data: null })}
            onEdit={(g) => setModal({ type: "gallery", data: g })}
            onNotify={(g) => {
              setGalleries((gs) => gs.map((x) => x.id === g.id ? { ...x, notified: true } : x));
              flash(`Media-ready alert sent to ${agentName(g.agentId)} (email + text).`);
            }}
          />
        )}
        {tab === "products" && (
          <Products
            products={products}
            onEdit={(p) => setModal({ type: "product", data: p })}
            onNew={() => setModal({ type: "product", data: null })}
            onToggle={(p) => setProducts((ps) => ps.map((x) => x.id === p.id ? { ...x, active: !x.active } : x))}
          />
        )}
        {tab === "agents" && (
          <Agents
            agents={agents}
            onEdit={(a) => setModal({ type: "agent", data: a })}
            onNew={() => setModal({ type: "agent", data: null })}
          />
        )}
      </main>

      {modal?.type === "gallery" && (
        <GalleryModal
          init={modal.data} agents={agents} products={products}
          onClose={() => setModal(null)}
          onSave={(form) => {
            if (modal.data) {
              setGalleries((gs) => gs.map((x) => x.id === modal.data.id ? { ...x, ...form } : x));
              flash("Gallery updated.");
            } else {
              setGalleries((gs) => [{ id: "g" + Date.now(), paid: false, mediaCount: 0, notified: false, status: "preparing", ...form }, ...gs]);
              flash("Gallery created — link ready to share.");
            }
            setModal(null);
          }}
        />
      )}
      {modal?.type === "product" && (
        <ProductModal init={modal.data} onClose={() => setModal(null)}
          onSave={(form) => {
            if (modal.data) setProducts((ps) => ps.map((x) => x.id === modal.data.id ? { ...x, ...form } : x));
            else setProducts((ps) => [...ps, { id: "p" + Date.now(), active: true, ...form }]);
            flash("Product saved."); setModal(null);
          }} />
      )}
      {modal?.type === "agent" && (
        <AgentModal init={modal.data} onClose={() => setModal(null)}
          onSave={(form) => {
            if (modal.data) setAgents((as) => as.map((x) => x.id === modal.data.id ? { ...x, ...form } : x));
            else setAgents((as) => [...as, { id: "a" + Date.now(), ...form }]);
            flash("Agent saved."); setModal(null);
          }} />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: C.charcoal, color: C.warmWhite, padding: "12px 22px", borderRadius: 3, fontSize: 13, boxShadow: "0 8px 30px rgba(0,0,0,.3)", borderLeft: `3px solid ${C.gold}`, zIndex: 100 }}>{toast}</div>
      )}
    </div>
  );
}

// ── Galleries tab ──
function Galleries({ galleries, agentName, onNew, onEdit, onNotify }) {
  return (
    <>
      <SectionHead title="Galleries" sub="Each property shoot. Set price + deposit, then send the media-ready alert.">
        <button onClick={onNew} style={btnSolid}>+ New Gallery</button>
      </SectionHead>
      <div style={{ display: "grid", gap: 12 }}>
        {galleries.map((g) => {
          const balance = g.total_cents - g.deposit_cents;
          return (
            <div key={g.id} style={card}>
              <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 19 }}>{g.address}</div>
                <div style={{ fontSize: 13, color: C.brown }}>{g.city}, TN {g.zip} · {g.sqft ? g.sqft.toLocaleString() + " sq ft" : "—"} · {agentName(g.agentId)}</div>
              </div>
              <div style={{ flex: "0 0 auto", display: "flex", gap: 18, alignItems: "center" }}>
                <Stat label="Photos" value={g.mediaCount} />
                <Stat label="Total" value={usd(g.total_cents)} />
                <Stat label="Balance" value={usd(balance)} gold={!g.paid && balance > 0} />
                <StatusPill paid={g.paid} status={g.status} />
              </div>
              <div style={{ flex: "0 0 auto", display: "flex", gap: 8 }}>
                <button onClick={() => onNotify(g)} disabled={g.notified} title={g.notified ? "Already sent" : "Send email + text"}
                  style={{ ...btnOutline, opacity: g.notified ? 0.5 : 1, cursor: g.notified ? "default" : "pointer" }}>
                  {g.notified ? "Notified ✓" : "Send Media Alert"}
                </button>
                <button onClick={() => onEdit(g)} style={btnGhost}>Edit</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Products tab ──
function Products({ products, onEdit, onNew, onToggle }) {
  const packages = products.filter((p) => p.kind === "package");
  const addons = products.filter((p) => p.kind === "addon");
  return (
    <>
      <SectionHead title="Products" sub="Your packages and add-ons. Editing here changes pricing everywhere — no code.">
        <button onClick={onNew} style={btnSolid}>+ New Product</button>
      </SectionHead>
      <SubHead>Packages</SubHead>
      <ProductTable rows={packages} onEdit={onEdit} onToggle={onToggle} />
      <div style={{ height: 24 }} />
      <SubHead>Add-ons</SubHead>
      <ProductTable rows={addons} onEdit={onEdit} onToggle={onToggle} />
    </>
  );
}

function ProductTable({ rows, onEdit, onToggle }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {rows.map((p) => (
        <div key={p.id} style={{ ...card, padding: "12px 16px", opacity: p.active ? 1 : 0.5 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</span>
            {p.size_label && <span style={{ fontSize: 13, color: C.brown }}> · {p.size_label}</span>}
          </div>
          <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 17, color: C.gold, flex: "0 0 auto", marginRight: 8 }}>{usd(p.price_cents)}</div>
          <button onClick={() => onToggle(p)} style={btnGhost}>{p.active ? "Hide" : "Show"}</button>
          <button onClick={() => onEdit(p)} style={btnGhost}>Edit</button>
        </div>
      ))}
    </div>
  );
}

// ── Agents tab ──
function Agents({ agents, onEdit, onNew }) {
  return (
    <>
      <SectionHead title="Agents" sub="Your realtor clients. Email + phone are used for the media-ready alerts.">
        <button onClick={onNew} style={btnSolid}>+ New Agent</button>
      </SectionHead>
      <div style={{ display: "grid", gap: 8 }}>
        {agents.map((a) => (
          <div key={a.id} style={card}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</div>
              <div style={{ fontSize: 13, color: C.brown }}>
                {a.email || "no email"} · {a.phone || "no phone"}{a.brokerage ? ` · ${a.brokerage}` : ""}
              </div>
            </div>
            <button onClick={() => onEdit(a)} style={btnGhost}>Edit</button>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Modals ──
function GalleryModal({ init, agents, products, onClose, onSave }) {
  const [f, setF] = useState({
    address: init?.address || "", city: init?.city || "Athens", zip: init?.zip || "",
    sqft: init?.sqft || "", agentId: init?.agentId || "",
    total_cents: init?.total_cents || 0, deposit_cents: init?.deposit_cents || 10000,
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const balance = (f.total_cents || 0) - (f.deposit_cents || 0);

  return (
    <Modal title={init ? "Edit Gallery" : "New Gallery"} onClose={onClose}>
      <Field label="Property Address"><input style={inp} value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="242 Fyke Dr" /></Field>
      <Row>
        <Field label="City"><input style={inp} value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
        <Field label="Zip"><input style={inp} value={f.zip} onChange={(e) => set("zip", e.target.value)} /></Field>
        <Field label="Sq Ft"><input style={inp} type="number" value={f.sqft} onChange={(e) => set("sqft", +e.target.value)} /></Field>
      </Row>
      <Field label="Agent">
        <select style={inp} value={f.agentId} onChange={(e) => set("agentId", e.target.value)}>
          <option value="">— none —</option>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Field>
      <Field label="Package (sets total)">
        <select style={inp} value="" onChange={(e) => e.target.value && set("total_cents", +e.target.value)}>
          <option value="">— choose to autofill total —</option>
          {products.filter((p) => p.kind === "package").map((p) => (
            <option key={p.id} value={p.price_cents}>{p.name} · {p.size_label} · {usd(p.price_cents)}</option>
          ))}
        </select>
      </Field>
      <Row>
        <Field label="Total ($)"><input style={inp} type="number" step="0.01" value={(f.total_cents / 100) || ""} onChange={(e) => set("total_cents", Math.round(+e.target.value * 100))} /></Field>
        <Field label="Deposit paid ($)"><input style={inp} type="number" step="0.01" value={(f.deposit_cents / 100) || ""} onChange={(e) => set("deposit_cents", Math.round(+e.target.value * 100))} /></Field>
        <Field label="Balance due"><div style={{ ...inp, background: C.warmWhite, display: "flex", alignItems: "center", fontFamily: "Fraunces, serif", fontWeight: 600, color: C.gold }}>{usd(balance)}</div></Field>
      </Row>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
        <button onClick={onClose} style={btnGhost}>Cancel</button>
        <button onClick={() => onSave(f)} style={btnSolid}>{init ? "Save Changes" : "Create Gallery"}</button>
      </div>
    </Modal>
  );
}

function ProductModal({ init, onClose, onSave }) {
  const [f, setF] = useState({
    kind: init?.kind || "package", name: init?.name || "", size_label: init?.size_label || "",
    price_cents: init?.price_cents || 0,
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal title={init ? "Edit Product" : "New Product"} onClose={onClose}>
      <Field label="Type">
        <select style={inp} value={f.kind} onChange={(e) => set("kind", e.target.value)}>
          <option value="package">Package</option>
          <option value="addon">Add-on</option>
        </select>
      </Field>
      <Field label="Name"><input style={inp} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Complete Listing" /></Field>
      {f.kind === "package" && (
        <Field label="Size"><input style={inp} value={f.size_label || ""} onChange={(e) => set("size_label", e.target.value)} placeholder="Under 2,000 sq ft" /></Field>
      )}
      <Field label="Price ($)"><input style={inp} type="number" step="0.01" value={(f.price_cents / 100) || ""} onChange={(e) => set("price_cents", Math.round(+e.target.value * 100))} /></Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
        <button onClick={onClose} style={btnGhost}>Cancel</button>
        <button onClick={() => onSave(f)} style={btnSolid}>Save</button>
      </div>
    </Modal>
  );
}

function AgentModal({ init, onClose, onSave }) {
  const [f, setF] = useState({ name: init?.name || "", email: init?.email || "", phone: init?.phone || "", brokerage: init?.brokerage || "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal title={init ? "Edit Agent" : "New Agent"} onClose={onClose}>
      <Field label="Name"><input style={inp} value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="Email"><input style={inp} value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="for media-ready alerts" /></Field>
      <Field label="Phone"><input style={inp} value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="for text alerts" /></Field>
      <Field label="Brokerage"><input style={inp} value={f.brokerage} onChange={(e) => set("brokerage", e.target.value)} /></Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
        <button onClick={onClose} style={btnGhost}>Cancel</button>
        <button onClick={() => onSave(f)} style={btnSolid}>Save</button>
      </div>
    </Modal>
  );
}

// ── Small components ──
function SectionHead({ title, sub, children }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
      <div>
        <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 30, margin: "0 0 2px" }}>{title}</h1>
        <p style={{ margin: 0, fontSize: 13, color: C.brown }}>{sub}</p>
      </div>
      {children}
    </div>
  );
}
const SubHead = ({ children }) => <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "#9A9186", margin: "0 0 10px" }}>{children}</div>;
const Stat = ({ label, value, gold }) => (
  <div style={{ textAlign: "right" }}>
    <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "#9A9186" }}>{label}</div>
    <div style={{ fontSize: 15, fontWeight: 600, color: gold ? C.gold : C.charcoal }}>{value}</div>
  </div>
);
function StatusPill({ paid, status }) {
  const txt = paid ? "Paid" : status === "preparing" ? "Preparing" : "Balance Due";
  const bg = paid ? "#2f6b3f" : status === "preparing" ? "#8a8378" : C.gold;
  return <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#fff", background: bg, padding: "5px 10px", borderRadius: 2 }}>{txt}</span>;
}
function Modal({ title, children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(23,23,23,.6)", display: "grid", placeItems: "center", padding: 20, zIndex: 90 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 4, maxWidth: 540, width: "100%", padding: "clamp(1.5rem,4vw,2rem)", borderTop: `3px solid ${C.gold}`, maxHeight: "90vh", overflowY: "auto" }}>
        <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 24, margin: "0 0 18px" }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
const Field = ({ label, children }) => (
  <label style={{ display: "block", marginBottom: 14 }}>
    <span style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: C.brown, marginBottom: 5 }}>{label}</span>
    {children}
  </label>
);
const Row = ({ children }) => <div style={{ display: "flex", gap: 10 }}>{children}</div>;

// ── Styles ──
const card = { background: "#fff", border: `1px solid ${C.line}`, borderRadius: 3, padding: "16px 18px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" };
const inp = { width: "100%", padding: "10px 12px", border: `1px solid ${C.taupe}`, borderRadius: 2, fontSize: 14, background: "#fff", color: C.charcoal, outline: "none" };
const btnSolid = { background: C.charcoal, color: C.warmWhite, border: `1.5px solid ${C.charcoal}`, borderRadius: 2, padding: "10px 18px", fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" };
const btnOutline = { background: "transparent", color: C.charcoal, border: `1.5px solid ${C.charcoal}`, borderRadius: 2, padding: "9px 14px", fontSize: 11, fontWeight: 600, letterSpacing: ".06em", cursor: "pointer" };
const btnGhost = { background: "transparent", color: C.brown, border: `1px solid ${C.line}`, borderRadius: 2, padding: "9px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" };
