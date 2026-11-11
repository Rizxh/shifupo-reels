import { describe, expect, it } from "vitest";
import { VO_LEVEL, voGainFor } from "../src/lib/mix";

const db = (gain: number) => 20 * Math.log10(gain);

describe("voGainFor", () => {
  it("leaves unmeasured lines alone", () => {
    expect(voGainFor(undefined)).toBe(1);
  });

  it("brings a line to the target level", () => {
    expect(db(voGainFor(VO_LEVEL.targetLufs - 2.7))).toBeCloseTo(2.7, 6);
    expect(db(voGainFor(VO_LEVEL.targetLufs + 0.4))).toBeCloseTo(-0.4, 6);
  });

  it("limits the correction", () => {
    expect(db(voGainFor(VO_LEVEL.targetLufs - 30))).toBeCloseTo(
      VO_LEVEL.maxGainDb,
      6,
    );
    expect(db(voGainFor(VO_LEVEL.targetLufs + 30))).toBeCloseTo(
      -VO_LEVEL.maxGainDb,
      6,
    );
  });
});
