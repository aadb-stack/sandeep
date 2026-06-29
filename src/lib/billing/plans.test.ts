import { describe, expect, it } from "vitest";
import { PLAN_LIST, PLANS, getPlan } from "./plans";

describe("billing plans", () => {
  it("exposes the starter -> team -> enterprise ladder", () => {
    expect(PLAN_LIST.map((p) => p.id)).toEqual([
      "starter",
      "team",
      "enterprise",
    ]);
  });

  it("prices ascend then go custom for enterprise", () => {
    expect(PLANS.starter.priceMonthly).toBe(99);
    expect(PLANS.team.priceMonthly).toBe(499);
    expect(PLANS.enterprise.priceMonthly).toBeNull();
  });

  it("self-serve plans carry a Stripe price env reference", () => {
    expect(PLANS.starter.stripePriceEnv).toBeTruthy();
    expect(PLANS.team.stripePriceEnv).toBeTruthy();
    expect(PLANS.enterprise.stripePriceEnv).toBeUndefined();
  });

  it("getPlan falls back to starter for unknown ids", () => {
    expect(getPlan("nonsense").id).toBe("starter");
    expect(getPlan("team").id).toBe("team");
  });

  it("limits increase up the ladder", () => {
    expect(PLANS.team.limits.monthlyConversations).toBeGreaterThan(
      PLANS.starter.limits.monthlyConversations,
    );
    expect(PLANS.enterprise.limits.seats).toBe(Number.POSITIVE_INFINITY);
  });
});
