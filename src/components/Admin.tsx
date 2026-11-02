'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

const STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export default function Admin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    name: "", description: "", mrp: "", price: "", stock: "", images: ""
  });

  const [banner, setBanner] = useState({
    slot: "slider", image_url: "", target_url: "", sort_order: "1"
  });

  const [settings, setSettings] = useState({
    store_name: "My Store", about_text: "", phone: "", email: "", address: ""
  });

  async function load() {
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (!user) return;

    const { data: p } = await supabase.from("products")
      .select("*").order("created_at", { ascending: false });

    const { data: b } = await supabase.from("banners")
      .select("*").order("sort_order");

    const { data: st } = await supabase.from("store_settings")
      .select("*").eq("id", true).maybeSingle();

    const { data: o, error: orderError } = await supabase.from("orders")
      .select("*").order("created_at", { ascending: false });

    setProducts((p || []) as Product[]);
    setBanners(b || []);

    if (orderError) {
      setMsg("Orders loading error: " + orderError.message);
    } else {
      setOrders(o || []);
    }

    if (st) {
      setSettings({
        store_name: st.store_name || "My Store",
        about_text: st.about_text || "",
        phone: st.phone || "",
        email: st.email || "",
        address: st.address || ""
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (!supabase) {
    return <main className="wrap"><h1>Admin Panel</h1>
      <div className="panel">Set Supabase environment variables first.</div>
    </main>;
  }

  async function login(e: any) {
    e.preventDefault();
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    setMsg(error?.message || "");
    if (!error) await load();
  }

  async function saveProduct(e: any) {
    e.preventDefault();

    const images = form.images.split(/\n|,/)
      .map(s => s.trim()).filter(Boolean).slice(0, 4);

    const { error } = await supabase!.from("products").insert({
      name: form.name,
      description: form.description,
      mrp: Number(form.mrp),
      price: Number(form.price),
      stock: Number(form.stock),
      images,
      active: true
    });

    setMsg(error?.message || "Product added");

    if (!error) {
      setForm({ name: "", description: "", mrp: "", price: "", stock: "", images: "" });
      load();
    }
  }

  async function saveBanner(e: any) {
    e.preventDefault();

    const { error } = await supabase!.from("banners").insert({
      ...banner,
      sort_order: Number(banner.sort_order),
      active: true
    });

    setMsg(error?.message || "Banner added");
    if (!error) load();
  }

  async function saveSettings(e: any) {
    e.preventDefault();

    const { error } = await supabase!.from("store_settings").upsert({
      ...settings,
      id: true,
      updated_at: new Date().toISOString()
    });

    setMsg(error?.message || "Store settings saved");
  }

  async function delProduct(id: string) {
    const { error } = await supabase!.from("products").delete().eq("id", id);
    setMsg(error?.message || "Product deleted");
    load();
  }

  async function updateBanner(id: string, active: boolean) {
    const { error } = await supabase!.from("banners")
      .update({ active: !active }).eq("id", id);

    setMsg(error?.message || "Banner updated");
    load();
  }

  async function updateOrder(id: string, status: string) {
    const { error } = await supabase!.from("orders")
      .update({ status }).eq("id", id);

    if (error) {
      setMsg("Order update error: " + error.message);
    } else {
      setMsg("Order status updated");
      load();
    }
  }

  if (!user) {
    return (
      <main className="wrap">
        <Link href="/">← Store</Link>
        <div className="panel" style={{ maxWidth: 450, margin: "50px auto" }}>
          <h1>Admin Login</h1>
          <p className="muted">Use your admin account.</p>
          <form onSubmit={login}>
            <label className="field">Email
              <input type="email" required value={email}
                onChange={e => setEmail(e.target.value)} />
            </label>
            <label className="field">Password
              <input type="password" required value={password}
                onChange={e => setPassword(e.target.value)} />
            </label>
            <button>Login</button>
          </form>
          {msg && <p>{msg}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="wrap">
      <header className="top">
        <h1>Store Admin</h1>
        <div className="row">
          <Link href="/">View Store</Link>
          <button className="secondary" onClick={async () => {
            await supabase!.auth.signOut();
            setUser(null);
          }}>Logout</button>
        </div>
      </header>

      {msg && <div className="panel">{msg}</div>}

      <div className="adminlayout">
        <aside className="side">
          <b>Dashboard</b>
          <a href="#orders">Orders</a>
          <a href="#products">Products</a>
          <a href="#banners">Banners</a>
          <a href="#settings">Store Settings</a>
        </aside>

        <div>
          <section className="panel" id="orders">
            <h2>Customer Orders ({orders.length})</h2>
            <button className="secondary" onClick={load}>Refresh Orders</button>

            {orders.length === 0 && <p>No orders found.</p>}

            {orders.map(o => (
              <div className="panel" key={o.id} style={{ marginTop: 15 }}>
                <div className="between">
                  <b>Order #{o.id.slice(0, 8)}</b>
                  <b>₹{o.total}</b>
                </div>

                <p><b>Customer:</b> {o.customer_name}</p>
                <p><b>Phone:</b> <a href={`tel:${o.phone}`}>{o.phone}</a></p>
                <p style={{ whiteSpace: "pre-line" }}>
                  <b>Delivery Address:</b>{"\n"}{o.address}
                </p>

                <h4>Ordered Products</h4>
                {(Array.isArray(o.items) ? o.items : []).map((item: any, i: number) => (
                  <p key={i}>
                    {item.name} × {item.quantity} — ₹{item.price * item.quantity}
                  </p>
                ))}

                <p className="muted">
                  Date: {new Date(o.created_at).toLocaleString()}
                </p>

                <label className="field">
                  Order Status
                  <select value={o.status} onChange={e => updateOrder(o.id, e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
            ))}
          </section>

          <section className="panel" id="products">
            <h2>Add Product</h2>
            <form onSubmit={saveProduct}>
              <div className="field">
                <label>Product name</label>
                <input required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>

              <div className="field">
                <label>Description</label>
                <textarea value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="row">
                <label className="field">MRP ₹
                  <input type="number" min="0" required value={form.mrp}
                    onChange={e => setForm({ ...form, mrp: e.target.value })} />
                </label>

                <label className="field">Selling price ₹
                  <input type="number" min="0" required value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })} />
                </label>

                <label className="field">Stock
                  <input type="number" min="0" required value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })} />
                </label>
              </div>

              <div className="field">
                <label>Image URLs (one per line, up to 4)</label>
                <textarea required placeholder="https://..."
                  value={form.images}
                  onChange={e => setForm({ ...form, images: e.target.value })} />
              </div>

              <button>Add Product</button>
            </form>

            <h3>Existing Products</h3>
            <div className="tablewrap">
              <table>
                <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Action</th></tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>₹{p.price}</td>
                      <td>{p.stock}</td>
                      <td><button className="danger" onClick={() => delProduct(p.id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel" id="banners">
            <h2>Add Banner</h2>
            <form onSubmit={saveBanner}>
              <div className="row">
                <label className="field">Position
                  <select value={banner.slot}
                    onChange={e => setBanner({ ...banner, slot: e.target.value })}>
                    <option value="top">Top banner</option>
                    <option value="slider">Auto slider</option>
                  </select>
                </label>

                <label className="field">Order
                  <input type="number" min="1" value={banner.sort_order}
                    onChange={e => setBanner({ ...banner, sort_order: e.target.value })} />
                </label>
              </div>

              <label className="field">Image URL
                <input type="url" required value={banner.image_url}
                  onChange={e => setBanner({ ...banner, image_url: e.target.value })} />
              </label>

              <label className="field">Target URL (optional)
                <input type="url" value={banner.target_url}
                  onChange={e => setBanner({ ...banner, target_url: e.target.value })} />
              </label>

              <button>Add Banner</button>
            </form>

            <h3>Current banners</h3>
            {banners.map(b => (
              <div className="between panel" key={b.id}>
                <span>{b.slot} · order {b.sort_order} · {b.active ? "Active" : "Hidden"}</span>
                <button className="secondary" onClick={() => updateBanner(b.id, b.active)}>
                  {b.active ? "Hide" : "Show"}
                </button>
              </div>
            ))}
          </section>

          <section className="panel" id="settings">
            <h2>Store Settings</h2>
            <p className="muted">Update your shop information here.</p>

            <form onSubmit={saveSettings}>
              <label className="field">Store name
                <input required value={settings.store_name}
                  onChange={e => setSettings({ ...settings, store_name: e.target.value })} />
              </label>

              <label className="field">About text
                <textarea rows={5} value={settings.about_text}
                  onChange={e => setSettings({ ...settings, about_text: e.target.value })} />
              </label>

              <div className="row">
                <label className="field">Contact phone
                  <input value={settings.phone}
                    onChange={e => setSettings({ ...settings, phone: e.target.value })} />
                </label>

                <label className="field">Contact email
                  <input type="email" value={settings.email}
                    onChange={e => setSettings({ ...settings, email: e.target.value })} />
                </label>
              </div>

              <label className="field">Business address
                <textarea rows={3} value={settings.address}
                  onChange={e => setSettings({ ...settings, address: e.target.value })} />
              </label>

              <button type="submit">Save Store Settings</button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
