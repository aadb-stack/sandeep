import { env } from "@/lib/env";
import { getStripe } from "@/lib/billing/stripe";

/**
 * Stripe webhook receiver. In mock mode (no STRIPE_SECRET_KEY /
 * STRIPE_WEBHOOK_SECRET) it acknowledges without verifying so local flows
 * don't error. In real mode it verifies the signature and would update the
 * org's plan/subscription state.
 */
export async function POST(req: Request) {
  if (!env.hasStripe || !env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ received: true, mock: true });
  }

  const stripe = (await getStripe()) as any;
  const signature = req.headers.get("stripe-signature");
  const payload = await req.text();

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Invalid signature" },
      { status: 400 },
    );
  }

  // TODO: map subscription lifecycle events to organizations.plan /
  // stripeSubscriptionId. Left as a documented integration point.
  switch (event.type) {
    case "checkout.session.completed":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    default:
      break;
  }

  return Response.json({ received: true });
}
