import { z } from "zod";
import { getCurrentOrg } from "@/lib/auth";
import { createCheckout } from "@/lib/billing/stripe";
import { getPlan } from "@/lib/billing/plans";

const schema = z.object({
  plan: z.enum(["starter", "team", "enterprise"]),
});

export async function POST(req: Request) {
  await getCurrentOrg();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid plan" }, { status: 400 });
  }

  const plan = getPlan(parsed.data.plan);
  if (plan.id === "enterprise") {
    return Response.json({ url: "mailto:sales@example.com", mock: true });
  }

  const priceId = plan.stripePriceEnv
    ? process.env[plan.stripePriceEnv]
    : undefined;
  const checkout = await createCheckout(plan.id, priceId);
  return Response.json(checkout);
}
