
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  ShoppingBag, Search, LockKeyhole, LogOut, Plus, Pencil, Trash2,
  Package, Euro, TrendingUp, ClipboardList, ImagePlus, X, RefreshCw
} from "lucide-react";
import "./styles.css";
import Storefront from "./Storefront";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const euro = value => new Intl.NumberFormat("de-DE", {
  style: "currency", currency: "EUR"
}).format(Number(value || 0));

function App() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const blankProduct = {
    name: "", description: "", category: "Sonstiges",
    sale_price: "", cost_price: "", stock: 1, image_url: "", active: true
  };

  const [form, setForm] = useState(blankProduct);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) checkAdmin(data.session);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) checkAdmin(newSession);
      else { setIsAdmin(false); setLoading(false); }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function checkAdmin(currentSession) {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles").select("is_admin")
      .eq("id", currentSession.user.id).maybeSingle();

    setIsAdmin(!error && data?.is_admin === true);
    setLoading(false);
    if (!error && data?.is_admin) loadData();
  }

  async function loadData() {
    const [p, o] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false })
    ]);

    if (p.error) setMessage(p.error.message); else setProducts(p.data || []);
    if (o.error) setMessage(o.error.message); else setOrders(o.data || []);
  }

  async function signIn(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail, password: loginPassword
    });

    if (error) setMessage(error.message);
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  function openNewProduct() {
    setEditing(null);
    setForm(blankProduct);
    setTab("product-form");
  }

  function openEditProduct(product) {
    setEditing(product);
    setForm({
      name: product.name, description: product.description || "",
      category: product.category || "Sonstiges",
      sale_price: product.sale_price, cost_price: product.cost_price,
      stock: product.stock, image_url: product.image_url || "",
      active: product.active
    });
    setTab("product-form");
  }

  async function uploadImage(file) {
    if (!file) return;
    const extension = file.name.split(".").pop().toLowerCase();
    const path = `${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage.from("product-images").upload(path, file, {
      upsert: false, contentType: file.type
    });

    if (error) { setMessage(error.message); return; }

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm(old => ({ ...old, image_url: data.publicUrl }));
  }

  async function saveProduct(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      name: form.name.trim(), description: form.description.trim(),
      category: form.category, sale_price: Number(form.sale_price),
      cost_price: Number(form.cost_price), stock: Number(form.stock),
      image_url: form.image_url, active: form.active
    };

    if (!payload.name || payload.sale_price <= 0 || payload.cost_price < 0 || payload.stock < 0) {
      setMessage("Bitte Name, Verkaufspreis, Einkaufspreis und Bestand prüfen.");
      setSaving(false);
      return;
    }

    const request = editing
      ? supabase.from("products").update(payload).eq("id", editing.id)
      : supabase.from("products").insert(payload);

    const { error } = await request;

    if (error) setMessage(error.message);
    else {
      setMessage("Produkt gespeichert.");
      await loadData();
      setTab("products");
    }

    setSaving(false);
  }

  async function deleteProduct(product) {
    if (!confirm(`„${product.name}“ wirklich löschen?`)) return;

    const { error } = await supabase.from("products").delete().eq("id", product.id);

    if (error) setMessage(error.message);
    else {
      setMessage("Produkt gelöscht.");
      loadData();
    }
  }

  const paidOrders = orders.filter(o => o.payment_status === "paid");
  const grossRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const itemCost = paidOrders.reduce((sum, o) =>
    sum + (o.order_items || []).reduce((s, item) =>
      s + Number(item.cost_price_snapshot || 0) * Number(item.quantity || 0), 0), 0);

  const estimatedProfit = grossRevenue - itemCost;

  const visibleProducts = useMemo(() => products.filter(p =>
    `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase())
  ), [products, search]);

  if (!supabase) return <main className="setup"><div className="setup-card">
    <h1>CAVEROOM einrichten</h1>
    <p>Es fehlen noch die Supabase-Zugangsdaten. Lege im Projekt eine Datei <code>.env</code> an und trage dort die Werte aus Supabase ein.</p>
    <pre>VITE_SUPABASE_URL=…{"\n"}VITE_SUPABASE_ANON_KEY=…</pre>
    <p>Danach den Entwicklungsserver neu starten.</p>
  </div></main>;

  if (loading) return <main className="setup"><p>Lade CAVEROOM…</p></main>;

  if (!session) return <main className="login-page"><form className="login-card" onSubmit={signIn}>
    <div className="brand">CAVEROOM</div>
    <p className="eyebrow">GESCHÜTZTER BEREICH</p>
    <h1>Admin-Login</h1>
    <p className="muted">Melde dich mit deinem persönlichen Shop-Zugang an.</p>
    <label>E-Mail-Adresse<input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} /></label>
    <label>Passwort<input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} /></label>
    <button className="primary" disabled={loading}><LockKeyhole size={17}/> Anmelden</button>
    {message && <p className="message">{message}</p>}
    <small>Der Admin-Zugang muss vorher in Supabase angelegt und freigeschaltet werden.</small>
  </form></main>;

  if (!isAdmin) return <main className="setup"><div className="setup-card">
    <h1>Kein Admin-Zugriff</h1>
    <p>Dieses Konto ist noch nicht als Shop-Administrator freigeschaltet. Setze in Supabase bei deinem Profil <code>is_admin = true</code>.</p>
    <button className="secondary" onClick={signOut}>Abmelden</button>
    {message && <p className="message">{message}</p>}
  </div></main>;

  return <div className="admin-layout">
    <aside className="sidebar">
      <div className="brand">CAVEROOM</div>
      <p className="side-label">VERWALTUNG</p>
      <button className={tab==="dashboard"?"active":""} onClick={()=>setTab("dashboard")}><TrendingUp/> Dashboard</button>
      <button className={tab==="products"?"active":""} onClick={()=>setTab("products")}><Package/> Produkte</button>
      <button className={tab==="orders"?"active":""} onClick={()=>setTab("orders")}><ClipboardList/> Bestellungen</button>
      <div className="sidebar-bottom">
        <button onClick={loadData}><RefreshCw/> Aktualisieren</button>
        <button onClick={signOut}><LogOut/> Abmelden</button>
      </div>
    </aside>

    <main className="admin-main">
      <header className="admin-header">
        <div>
          <p className="eyebrow">DEIN ONLINESHOP</p>
          <h1>{tab==="dashboard"?"Dashboard":tab==="products"?"Produkte":tab==="orders"?"Bestellungen":editing?"Produkt bearbeiten":"Neues Produkt"}</h1>
        </div>
        <span className="admin-pill"><span/> Admin angemeldet</span>
      </header>

      {message && <div className="notice">{message}<button onClick={()=>setMessage("")}><X size={15}/></button></div>}

      {tab==="dashboard" && <>
        <section className="stats">
          <Stat icon={<Euro/>} label="Bruttoumsatz" value={euro(grossRevenue)} note="Nur bezahlte Bestellungen"/>
          <Stat icon={<TrendingUp/>} label="Geschätzter Rohertrag" value={euro(estimatedProfit)} note="Umsatz minus Einkaufskosten"/>
          <Stat icon={<ClipboardList/>} label="Bezahlte Bestellungen" value={paidOrders.length} note={`${orders.length} Bestellungen insgesamt`}/>
          <Stat icon={<Package/>} label="Aktive Produkte" value={products.filter(p=>p.active).length} note={`${products.reduce((s,p)=>s+Number(p.stock||0),0)} Stück auf Lager`}/>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Neueste Bestellungen</h2>
              <p>Die letzten Bestellungen deines Shops</p>
            </div>
            <button className="text-btn" onClick={()=>setTab("orders")}>Alle ansehen →</button>
          </div>
          <OrdersTable orders={orders.slice(0,6)}/>
        </section>

        <section className="panel">
          <h2>So wird dein Gewinn berechnet</h2>
          <p className="muted">Geschätzter Rohertrag = bezahlter Umsatz − Einkaufspreis der verkauften Artikel. Zahlungsgebühren, Versand, Verpackung, Retouren, Steuern und sonstige Kosten sind hier noch nicht abgezogen.</p>
        </section>
      </>}

      {tab==="products" && <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Deine Produkte</h2>
            <p>Nur du kannst Produkte hinzufügen und bearbeiten.</p>
          </div>
          <button className="primary compact" onClick={openNewProduct}><Plus size={16}/> Produkt hinzufügen</button>
        </div>

        <input className="search-input" placeholder="Produkt suchen…" value={search} onChange={e=>setSearch(e.target.value)}/>

        <div className="product-list">{visibleProducts.map(p=><div className="product-row" key={p.id}>
          <img src={p.image_url || "https://placehold.co/100x100?text=CAVEROOM"} alt=""/>
          <div className="product-name">
            <b>{p.name}</b>
            <small>{p.category} · Bestand: {p.stock} · {p.active?"Online":"Ausgeblendet"}</small>
          </div>
          <div className="price-pair">
            <b>{euro(p.sale_price)}</b>
            <small>Einkauf: {euro(p.cost_price)}</small>
          </div>
          <button className="icon-action" onClick={()=>openEditProduct(p)} title="Bearbeiten"><Pencil size={17}/></button>
          <button className="icon-action danger" onClick={()=>deleteProduct(p)} title="Löschen"><Trash2 size={17}/></button>
        </div>)}</div>
      </section>}

      {tab==="product-form" && <section className="panel form-panel">
        <div className="panel-heading">
          <div>
            <h2>{editing?"Produkt bearbeiten":"Neues Produkt hinzufügen"}</h2>
            <p>Die Einkaufskosten bleiben nur in deinem Admin-Bereich sichtbar.</p>
          </div>
          <button className="icon-action" onClick={()=>setTab("products")}><X/></button>
        </div>

        <form onSubmit={saveProduct} className="product-form">
          <label>Produktname<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="z. B. Nike Air Max"/></label>
          <label>Kategorie<input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="Schuhe, Kleidung …"/></label>

          <div className="two-cols">
            <label>Verkaufspreis (€)<input required type="number" min="0.01" step="0.01" value={form.sale_price} onChange={e=>setForm({...form,sale_price:e.target.value})}/></label>
            <label>Einkaufspreis (€)<input required type="number" min="0" step="0.01" value={form.cost_price} onChange={e=>setForm({...form,cost_price:e.target.value})}/></label>
          </div>

          <div className="two-cols">
            <label>Lagerbestand<input required type="number" min="0" step="1" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></label>
            <label>Produkt sichtbar<select value={String(form.active)} onChange={e=>setForm({...form,active:e.target.value==="true"})}><option value="true">Ja</option><option value="false">Nein</option></select></label>
          </div>

          <label>Beschreibung<textarea rows="4" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Details, Zustand, Größe …"/></label>
          <label>Produktbild<input type="file" accept="image/*" onChange={e=>uploadImage(e.target.files?.[0])}/></label>
          {form.image_url && <img className="image-preview" src={form.image_url} alt="Produktvorschau"/>}
          <button className="primary" disabled={saving}>{saving?"Speichere…":editing?"Änderungen speichern":"Produkt speichern"}</button>
          <button type="button" className="secondary" onClick={()=>setTab("products")}>Abbrechen</button>
        </form>
      </section>}

      {tab==="orders" && <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Alle Bestellungen</h2>
            <p>Zahlungsstatus und Bestellwerte</p>
          </div>
        </div>
        <OrdersTable orders={orders}/>
      </section>}
    </main>
  </div>;
}

function Stat({icon,label,value,note}) {
  return <article className="stat-card">
    <div className="stat-icon">{icon}</div>
    <p>{label}</p>
    <strong>{value}</strong>
    <small>{note}</small>
  </article>;
}

function OrdersTable({orders}) {
  if (!orders.length) return <div className="empty-state">Noch keine Bestellungen vorhanden. Sobald Bestellungen über den Shop eingehen, erscheinen sie hier.</div>;

  return <div className="table-wrap">
    <table>
      <thead>
        <tr><th>Bestellung</th><th>Datum</th><th>Status</th><th>Gesamt</th></tr>
      </thead>
      <tbody>
        {orders.map(o=><tr key={o.id}>
          <td>#{String(o.id).slice(0,8)}</td>
          <td>{new Date(o.created_at).toLocaleDateString("de-DE")}</td>
          <td><span className={`status ${o.payment_status}`}>{o.payment_status==="paid"?"Bezahlt":o.payment_status==="refunded"?"Erstattet":"Offen"}</span></td>
          <td>{euro(o.total_amount)}</td>
        </tr>)}
      </tbody>
    </table>
  </div>;
}

const isAdminRoute = window.location.pathname.startsWith("/admin");

createRoot(document.getElementById("root")).render(
  isAdminRoute ? <App /> : <Storefront />
);
