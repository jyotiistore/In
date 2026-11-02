'use client';

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("id");

  return (
    <main className="wrap">
      <div className="panel" style={{ maxWidth: 600, margin: "60px auto", textAlign: "center" }}>
        <div style={{ fontSize: 64 }}>✅</div>
        <h1>Order Placed Successfully!</h1>
        <p>Thank you for shopping with us.</p>

        {orderId && (
          <p>
            <b>Order ID:</b><br />
            <span style={{ overflowWrap: "anywhere" }}>{orderId}</span>
          </p>
        )}

        <p>আপনার অর্ডারটি আমরা পেয়েছি। অর্ডারের আপডেট জানতে আমাদের সঙ্গে যোগাযোগ করুন।</p>

        <div className="row" style={{ justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="button">Continue Shopping</Link>
          <Link href="/orders">My Orders</Link>
        </div>
      </div>
    </main>
  );
}

export default function OrderSuccess() {
  return (
    <Suspense fallback={<main className="wrap">Loading...</main>}>
      <SuccessContent />
    </Suspense>
  );
}
