import { describe, expect, it } from "vitest";
import { env, EMBEDDING_DIMENSIONS } from "./env";

/**
 * In the test environment no provider credentials are set, so every feature
 * flag must be false — this is exactly the keyless path the mock adapters rely
 * on. (If CI ever injects real keys, these would flip; that's intentional.)
 */
describe("env feature flags", () => {
  it("defaults to mock mode with no credentials", () => {
    expect(env.hasDatabase).toBe(false);
    expect(env.hasClerk).toBe(false);
    expect(env.hasAnthropic).toBe(false);
    expect(env.hasVoyage).toBe(false);
    expect(env.hasRedis).toBe(false);
    expect(env.hasStripe).toBe(false);
  });

  it("provides sensible model defaults", () => {
    expect(env.ANTHROPIC_MODEL).toBe("claude-opus-4-8");
    expect(env.VOYAGE_MODEL).toBe("voyage-3");
  });

  it("uses a 1024-dim embedding space (voyage-3)", () => {
    expect(EMBEDDING_DIMENSIONS).toBe(1024);
  });
});
