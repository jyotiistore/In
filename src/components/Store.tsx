'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Product={id:string;name:string;description:string|null;mrp:number;price:number;stock:number;images:string[];active:boolean};
type Banner={id:string;slot:string;image_url:string;target_url:string|null;active:boolean;sort_order:number};
export default function Store(){
 const [products,setProducts]=useState<Product[]>([]),[banners,setBanners]=useState<Banner[]>([]),[idx,setIdx]=useState(0),[cart,setCart]=useState<Record<string,number>>({});
 const [notice,setNotice]=useState("");
 useEffect(()=>{ if(!supabase){setNotice("Set Supabase environment variables to connect the live store.");return}
  Promise.all([supabase.from("products").select("*").eq("active",true).order("created_at",{ascending:false}),supabase.from("banners").select("*").eq("active",true).order("sort_order")]).then(([p,b])=>{if(p.data)setProducts(p.data as Product[]);if(b.data)setBanners(b.data as Banner[])});
 },[]);
 const top=banners.find(b=>b.slot==="top"), slides=banners.filter(b=>b.slot==="slider");
 useEffect(()=>{if(slides.length<2)return;const t=setInterval(()=>setIdx(i=>(i+1)%slides.length),3500);return()=>clearInterval(t)},[slides.length]);
 const count=Object.values(cart).reduce((a,b)=>a+b,0);
 function add(p:Product){setCart(c=>({...c,[p.id]:Math.min((c[p.id]||0)+1,Math.max(1,p.stock))}));setNotice(`${p.name} added to cart`);setTimeout(()=>setNotice(""),1800)}
 return <main className="wrap">
  <header className="top"><Link className="brand" href="/">My Store</Link><div className="row"><Link href="/profile">Profile</Link><Link href="/orders">Your Order</Link><Link href="/cart">Cart ({count})</Link><Link href="/about">About Us</Link></div></header>
  {top&&<a className="banner" href={top.target_url||"#"}><img src={top.image_url} alt="Store banner"/></a>}
  <nav className="navgrid"><Link className="navtile" href="/profile">👤<br/>Profile</Link><Link className="navtile" href="/orders">📦<br/>Your Order</Link><Link className="navtile" href="/cart">🛒<br/>Cart ({count})</Link><Link className="navtile" href="/about">ℹ️<br/>About Us</Link></nav>
  {slides.length>0&&<div className="slider"><a href={slides[idx%slides.length]?.target_url||"#"}><img src={slides[idx%slides.length]?.image_url} alt="Offers"/></a></div>}
  {notice&&<div className="panel">{notice}</div>}
  <div className="sectionhead"><h2>Popular Products</h2><span className="muted">{products.length} products</span></div>
  {!products.length?<div className="empty">{notice||"Products will appear here when added from the admin panel."}</div>:<section className="products">{products.map(p=>{const discount=p.mrp>0?Math.round((1-p.price/p.mrp)*100):0;return <article className="card" key={p.id}><Link href={`/product/${p.id}`}><img src={p.images?.[0]||"https://placehold.co/600x400?text=Product"} alt={p.name}/></Link><div className="pad"><Link href={`/product/${p.id}`}><b>{p.name}</b></Link><p className="row"><span className="price">₹{p.price}</span><span className="mrp">₹{p.mrp}</span><span className="discount">{discount}% OFF</span></p><div className="between"><span className="muted">{p.stock>0?`${p.stock} in stock`:"Out of stock"}</span><button disabled={p.stock<1} onClick={()=>add(p)}>＋ Add</button></div></div></article>})}</section>}
  <footer className="footer">© {new Date().getFullYear()} My Store</footer>
 </main>
}