import { env } from "@/lib/env";

/**
 * Stripe client accessor. Returns a configured Stripe instance when
 * STRIPE_SECRET_KEY is set, otherwise null — callers treat null as "mock mode"
 * and return simulated checkout/billing results so the app runs without keys.
 */
let stripePromise: Promise<unknown> | null = null;

export async function getStripe() {
  if (!env.hasStripe) return null;
  if (!stripePromise) {
    stripePromise = import("stripe").then(
      (m) => new m.default(env.STRIPE_SECRET_KEY as string),
    );
  }
  return stripePromise;
}

export interface CheckoutResult {
  url: string;
  mock: boolean;
}

/**
 * Create a checkout session for a plan. In mock mode this returns a local
 * success URL so the UI flow is exercisable without Stripe.
 */
export async function createCheckout(
  planId: string,
  priceId: string | undefined,
): Promise<CheckoutResult> {
  const stripe = (await getStripe()) as any;
  if (!stripe || !priceId) {
    return {
      url: `${env.APP_URL}/dashboard/billing?mock_checkout=${planId}`,
      mock: true,
    };
  }
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.APP_URL}/dashboard/billing?status=success`,
    cancel_url: `${env.APP_URL}/dashboard/billing?status=cancelled`,
  });
  return { url: session.url as string, mock: false };
}
