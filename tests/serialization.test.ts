import { decodeSetupState, encodeSetupState } from "../src/serialization";

describe("URL serialization", () => {
  it("round-trips serialized setup state", () => {
    const original = {
      seed: "abc123",
      preset: "storm-circuit" as const,
      reactionRate: 0.85,
      windBias: -0.4,
      speed: 1.75,
    };

    const encoded = encodeSetupState(original);
    const decoded = decodeSetupState(encoded);

    expect(decoded).toEqual(original);
  });
});
