import { describe, expect, it } from "vitest";
import { squashOnImpact, stretchFromSpeed, volumeScale, motionBlur } from "../src/core/motion/acting";
import { bounce, dampedSpring, pendulum, projectile } from "../src/core/motion/physics";
import { backOut, powInOut, track } from "../src/core/motion/tracks";
import { layerTransform } from "../src/core/camera/follow";

describe("tracks", () => {
  it("holds outside the keys and hits every key exactly", () => {
    const keys = [[10, 0], [20, 100, powInOut(3)], [30, 50]] as const;
    expect(track(0, keys)).toBe(0);
    expect(track(20, keys)).toBe(100);
    expect(track(40, keys)).toBe(50);
  });
  it("backOut overshoots and settles at 1", () => {
    const e = backOut(2.5);
    const peak = Math.max(...Array.from({ length: 101 }, (_, i) => e(i / 100)));
    expect(peak).toBeGreaterThan(1.05);
    expect(e(1)).toBeCloseTo(1, 6);
  });
});

describe("physics", () => {
  it("falls under gravity: h(t) = h0 - g t²/2 before impact", () => {
    const s = bounce(10, 0, { height: 300, gravity: 1.2 });
    expect(s.y).toBeCloseTo(300 - 0.5 * 1.2 * 100, 6);
  });
  it("each bounce is lower (energy is lost) and it comes to rest", () => {
    const peaks: number[] = [];
    let prev = 0;
    let rising = false;
    for (let f = 0; f < 400; f++) {
      const y = bounce(f, 0, { height: 300, restitution: 0.5 }).y;
      if (rising && y < prev) {
        peaks.push(prev);
      }
      rising = y > prev;
      prev = y;
    }
    expect(peaks.length).toBeGreaterThan(1);
    for (let i = 1; i < peaks.length; i++) {
      expect(peaks[i]).toBeLessThan(peaks[i - 1]);
    }
    expect(bounce(400, 0, { height: 300, restitution: 0.5 }).resting).toBe(true);
  });
  it("projectile without drag is a parabola", () => {
    const p = projectile(10, { x0: 0, y0: 0, vx: 5, vy: -20, gravity: 1 });
    expect(p.x).toBe(50);
    expect(p.y).toBe(-200 + 50);
  });
  it("damped spring settles to 1 and overshoots once", () => {
    expect(dampedSpring(400, 0)).toBeCloseTo(1, 3);
    const peak = Math.max(...Array.from({ length: 60 }, (_, i) => dampedSpring(i, 0)));
    expect(peak).toBeGreaterThan(1);
  });
  it("pendulum decays", () => {
    const early = Math.abs(pendulum(12, 0, 10));
    const late = Math.abs(pendulum(12 + 48 * 4, 0, 10));
    expect(late).toBeLessThan(early);
  });
});

describe("acting", () => {
  it("squash and stretch keep volume", () => {
    for (const s of [-0.3, 0, 0.4]) {
      const [x, y] = volumeScale(s);
      expect(x * y).toBeCloseTo(1, 6);
    }
    const [x, y] = squashOnImpact(0, 1);
    expect(y).toBeLessThan(1);
    expect(x * y).toBeCloseTo(1, 6);
    expect(stretchFromSpeed(0)).toEqual([1, 1]);
  });
  it("no motion blur below the threshold", () => {
    expect(motionBlur(2, 1).amount).toBe(0);
    expect(motionBlur(30, 0).amount).toBeGreaterThan(0);
  });
});

describe("follow camera", () => {
  it("keeps the focus point at the framing point on the subject plane", () => {
    const t = layerTransform({ fx: 300, fy: 900, z: 2 }, 1, { width: 1080, height: 1920 });
    // translate = 540 - 300*2 = -60, 960 - 900*2 = -840
    expect(t).toContain("translate(-60.00px, -840.00px)");
  });
  it("an infinitely far layer never moves", () => {
    expect(layerTransform({ fx: 100, fy: 100, z: 3 }, 0, { width: 1080, height: 1920 })).toContain("translate(0.00px, 0.00px) scale(1.0000)");
  });
});
