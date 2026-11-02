'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AddressFields = {
  name: string;
  phone: string;
  flat: string;
  area: string;
  landmark: string;
  pincode: string;
  city: string;
  state: string;
};

export default function Checkout() {
  const router = useRouter();

  const [form, setForm] = useState<AddressFields>({
    name: "", phone: "", flat: "", area: "",
    landmark: "", pincode: "", city: "", state: ""
  });

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (key: keyof AddressFields, value: string) =>
    setForm(old => ({ ...old, [key]: value }));

  async function place(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      setMsg("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!/^\d{6}$/.test(form.pincode)) {
      setMsg("Please enter a valid 6-digit Pincode.");
      return;
    }

    if (!supabase) {
      setMsg("Database is not configured.");
      return;
    }

    setBusy(true);

    try {
      const cart = JSON.parse(localStorage.getItem("store_cart") || "{}");

      if (!Object.keys(cart).length) {
        setMsg("Your cart is empty.");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      const ids = Object.keys(cart);

      const { data: products, error } = await supabase
        .from("products")
        .select("id,name,price,stock")
        .in("id", ids);

      if (error || !products) {
        setMsg(error?.message || "Could not load products.");
        return;
      }

      const items = products.map(p => ({
        product_id: p.id,
        name: p.name,
        price: p.price,
        quantity: Number(cart[p.id] || 0)
      }));

      if (items.some(i =>
        i.quantity < 1 ||
        i.quantity > (products.find(p => p.id === i.product_id)?.stock || 0)
      )) {
        setMsg("One or more products are out of stock.");
        return;
      }

      const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity, 0
      );

      const address = [
        `Flat/House/Building: ${form.flat}`,
        `Area/Street/Sector/Village: ${form.area}`,
        form.landmark ? `Landmark: ${form.landmark}` : "",
        `Pincode: ${form.pincode}`,
        `Town/City: ${form.city}`,
        `State: ${form.state}`
      ].filter(Boolean).join("\n");

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id || null,
          customer_name: form.name,
          phone: form.phone,
          address,
          items,
          total,
          status: "Pending"
        })
        .select("id")
        .single();

      if (orderError || !order) {
        setMsg(orderError?.message || "Order could not be placed.");
        return;
      }

      localStorage.removeItem("store_cart");

      router.push(`/order-success?id=${encodeURIComponent(order.id)}`);

    } catch (error: any) {
      setMsg(error?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="wrap">
      <Link href="/cart">← Cart</Link>

      <div className="panel" style={{ maxWidth: 650, margin: "20px auto" }}>
        <h1>Checkout</h1>

        <form onSubmit={place}>
          <label className="field">
            Full Name *
            <input required value={form.name}
              onChange={e => update("name", e.target.value)} />
          </label>

          <label className="field">
            10 digit Phone number *
            <input required type="tel" inputMode="numeric"
              maxLength={10} pattern="[6-9][0-9]{9}"
              value={form.phone}
              onChange={e => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
          </label>

          <label className="field">
            Flat, House no., Building, Company, Apartment *
            <input required value={form.flat}
              onChange={e => update("flat", e.target.value)} />
          </label>

          <label className="field">
            Area, Street, Sector, Village *
            <input required value={form.area}
              onChange={e => update("area", e.target.value)} />
          </label>

          <label className="field">
            Landmark (optional)
            <input value={form.landmark}
              onChange={e => update("landmark", e.target.value)} />
          </label>

          <label className="field">
            Pincode *
            <input required inputMode="numeric" maxLength={6}
              pattern="[0-9]{6}" value={form.pincode}
              onChange={e => update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} />
          </label>

          <label className="field">
            Town/City *
            <input required value={form.city}
              onChange={e => update("city", e.target.value)} />
          </label>

          <label className="field">
            State *
            <input required value={form.state}
              onChange={e => update("state", e.target.value)} />
          </label>

          <button disabled={busy}>
            {busy ? "Placing Order..." : "Place Order"}
          </button>
        </form>

        {msg && <p role="status">{msg}</p>}
      </div>
    </main>
  );
}
