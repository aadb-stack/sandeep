import { env } from "@/lib/env";
import { PLAN_LIST } from "@/lib/billing/plans";
import { CheckoutButton } from "@/components/CheckoutButton";

export default function BillingPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold">Billing</h1>
      <p className="mt-1 mb-8 text-sm text-slate-400">
        {env.hasStripe
          ? "Stripe is configured. Checkout creates a live subscription session."
          : "Mock mode — set STRIPE_SECRET_KEY to enable real checkout."}
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        {PLAN_LIST.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 p-6"
          >
            <h2 className="text-lg font-semibold">{plan.name}</h2>
            <p className="mt-2 text-3xl font-bold">
              {plan.priceMonthly === null ? "Custom" : `$${plan.priceMonthly}`}
              {plan.priceMonthly !== null && (
                <span className="text-base font-normal text-slate-400">/mo</span>
              )}
            </p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-400">
              {plan.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <div className="mt-6">
              <CheckoutButton
                plan={plan.id}
                label={
                  plan.priceMonthly === null
                    ? "Contact sales"
                    : `Choose ${plan.name}`
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
