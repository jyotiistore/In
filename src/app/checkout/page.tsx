'use client';
import {useState} from "react";
import Link from "next/link";
import {supabase} from "@/lib/supabase";

type AddressFields = {
  name: string; phone: string; flat: string; area: string;
  landmark: string; pincode: string; city: string; state: string;
};

export default function Checkout(){
  const [form,setForm]=useState<AddressFields>({name:"",phone:"",flat:"",area:"",landmark:"",pincode:"",city:"",state:""});
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);
  const update=(key:keyof AddressFields,value:string)=>setForm(old=>({...old,[key]:value}));

  async function place(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault(); setMsg("");
    if(!/^[6-9]\d{9}$/.test(form.phone)){setMsg("Please enter a valid 10-digit Indian mobile number.");return;}
    if(!/^\d{6}$/.test(form.pincode)){setMsg("Please enter a valid 6-digit Pincode.");return;}
    if(!supabase){setMsg("Store database is not configured.");return;}
    setBusy(true);
    try {
      const cart=JSON.parse(localStorage.getItem("store_cart")||"{}");
      if(!Object.keys(cart).length){setMsg("Your cart is empty.");return;}
      const {data:{user}}=await supabase.auth.getUser();
      const ids=Object.keys(cart);
      const {data:products,error}=await supabase.from("products").select("id,name,price,stock").in("id",ids);
      if(error||!products){setMsg(error?.message||"Could not load products");return;}
      const items=products.map(p=>({product_id:p.id,name:p.name,price:p.price,quantity:Number(cart[p.id]||0)}));
      if(items.some(i=>i.quantity<1||i.quantity>(products.find(p=>p.id===i.product_id)?.stock||0))){setMsg("One or more products are out of stock. Please update your cart.");return;}
      const total=items.reduce((s,i)=>s+i.price*i.quantity,0);
      const address=[
        `Flat/House/Building: ${form.flat}`,
        `Area/Street/Sector/Village: ${form.area}`,
        form.landmark ? `Landmark: ${form.landmark}` : "",
        `Pincode: ${form.pincode}`,
        `Town/City: ${form.city}`,
        `State: ${form.state}`
      ].filter(Boolean).join("\n");
      const {error:oe}=await supabase.from("orders").insert({user_id:user?.id||null,customer_name:form.name,phone:form.phone,address,items,total,status:"Pending"});
      if(oe){setMsg(oe.message);return;}
      localStorage.removeItem("store_cart");
      setMsg("Order placed successfully! Save this page or contact the store to track your order.");
    } finally {setBusy(false);}
  }

  return <main className="wrap"><Link href="/cart">← Cart</Link><div className="panel" style={{maxWidth:650,margin:"20px auto"}}>
    <h1>Checkout</h1>
    <form onSubmit={place}>
      <label className="field">Full Name *<input required autoComplete="name" value={form.name} onChange={e=>update("name",e.target.value)} /></label>
      <label className="field">10 digit Phone number *<input required type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} pattern="[6-9][0-9]{9}" placeholder="10 digit mobile number" value={form.phone} onChange={e=>update("phone",e.target.value.replace(/\D/g,"").slice(0,10))} /></label>
      <label className="field">Flat, House no., Building, Company, Apartment *<input required autoComplete="address-line1" value={form.flat} onChange={e=>update("flat",e.target.value)} /></label>
      <label className="field">Area, Street, Sector, Village *<input required autoComplete="address-line2" value={form.area} onChange={e=>update("area",e.target.value)} /></label>
      <label className="field">Landmark<input value={form.landmark} onChange={e=>update("landmark",e.target.value)} /></label>
      <label className="field">Pincode *<input required inputMode="numeric" maxLength={6} pattern="[0-9]{6}" autoComplete="postal-code" value={form.pincode} onChange={e=>update("pincode",e.target.value.replace(/\D/g,"").slice(0,6))} /></label>
      <label className="field">Town/City *<input required autoComplete="address-level2" value={form.city} onChange={e=>update("city",e.target.value)} /></label>
      <label className="field">State *<input required autoComplete="address-level1" value={form.state} onChange={e=>update("state",e.target.value)} /></label>
      <button disabled={busy}>{busy?"Placing Order...":"Place Order"}</button>
    </form>{msg&&<p role="status" style={{whiteSpace:"pre-line"}}>{msg}</p>}
  </div></main>;
}
