/**
 * Billing plans. The ladder from self-serve Starter to sales-led Enterprise is
 * the core of the path to $5M ARR (see docs/PRD.md). Price IDs come from env so
 * the same code works across Stripe test/live modes.
 */

export interface Plan {
  id: "starter" | "team" | "enterprise";
  name: string;
  /** Monthly price in USD; null = "contact sales". */
  priceMonthly: number | null;
  /** Stripe Price ID env var name, if self-serve checkout applies. */
  stripePriceEnv?: string;
  features: string[];
  limits: {
    knowledgeSources: number;
    monthlyConversations: number;
    seats: number;
  };
}

export const PLANS: Record<Plan["id"], Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthly: 99,
    stripePriceEnv: "NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID",
    features: [
      "1 knowledge base",
      "Up to 500 prospect conversations / mo",
      "AI answers over your docs",
      "In-browser demo code generation",
    ],
    limits: { knowledgeSources: 5, monthlyConversations: 500, seats: 3 },
  },
  team: {
    id: "team",
    name: "Team",
    priceMonthly: 499,
    stripePriceEnv: "NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID",
    features: [
      "Unlimited knowledge bases",
      "Up to 5,000 prospect conversations / mo",
      "Custom demo code sandboxes",
      "Analytics & CRM export",
    ],
    limits: { knowledgeSources: 100, monthlyConversations: 5000, seats: 15 },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: null,
    features: [
      "Unlimited everything",
      "SSO / SAML & SCIM",
      "On-prem / VPC deployment",
      "Dedicated support & SLAs",
    ],
    limits: {
      knowledgeSources: Number.POSITIVE_INFINITY,
      monthlyConversations: Number.POSITIVE_INFINITY,
      seats: Number.POSITIVE_INFINITY,
    },
  },
};

export const PLAN_LIST: Plan[] = [PLANS.starter, PLANS.team, PLANS.enterprise];

export function getPlan(id: string): Plan {
  return PLANS[(id as Plan["id"]) in PLANS ? (id as Plan["id"]) : "starter"];
}
