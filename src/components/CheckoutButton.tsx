"use client";

import { useState } from "react";

export function CheckoutButton({
  plan,
  label,
}: {
  plan: "starter" | "team" | "enterprise";
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (json.mock) {
        setNote("Mock checkout — set STRIPE_SECRET_KEY for real billing.");
      } else if (json.url) {
        window.location.href = json.url;
      }
    } catch {
      setNote("Checkout failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={start}
        disabled={busy}
        className="w-full rounded-md border border-slate-700 px-4 py-2 text-sm font-medium hover:border-slate-500 disabled:opacity-50"
      >
        {busy ? "…" : label}
      </button>
      {note && <p className="mt-2 text-xs text-slate-500">{note}</p>}
    </div>
  );
}
