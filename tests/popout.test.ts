import { describe, expect, it } from "vitest";
import sp01 from "../data/episodes/sp01.json";
import sp02 from "../data/episodes/sp02.json";
import { cueMatches } from "../src/lib/cues";
import { cameraAt, project, WINDOW } from "../src/lib/space";
import { evenWordTimings, layoutBeats } from "../src/lib/timeline";
import { POP_PACING, REEL } from "../src/lib/timing";
import {
  FORMATS,
  formatOf,
  popEpisodeSchema,
  popSceneCues,
} from "../src/schema";

describe("sp02 pop-out episode", () => {
  const episode = popEpisodeSchema.parse(sp02);

  it("passes the pop-out schema in scene order", () => {
    expect(episode.scenes.map((s) => s.type)).toEqual([
      "leap",
      "turn",
      "count",
      "cta",
    ]);
  });

  it("has every cue spoken exactly once in its own line", () => {
    for (const scene of episode.scenes) {
      for (const cue of popSceneCues(scene)) {
        expect(cueMatches(scene.vo, cue), `${scene.type}: ${cue}`).toHaveLength(
          1,
        );
      }
    }
  });

  it("rejects a count that does not match the voice over", () => {
    const broken = JSON.parse(JSON.stringify(sp02));
    broken.scenes[2].count = { ...broken.scenes[2].count, value: 2000 };
    expect(popEpisodeSchema.safeParse(broken).success).toBe(false);
  });
});

describe("episode formats", () => {
  it("routes each episode to its composition", () => {
    expect(formatOf(sp01)).toBe("story");
    expect(formatOf(sp02)).toBe("popout");
    expect(FORMATS[formatOf(sp02)].composition).toBe("PopReel");
  });
});

describe("pop-out timing", () => {
  it("stretches a short VO to the minimum reel length", () => {
    const fps = 30;
    const { beats, durationInFrames } = layoutBeats(
      [{ voDurationInFrames: 90, words: evenWordTimings(["a"], 90) }],
      fps,
      {
        outroHoldSeconds: POP_PACING.outroHoldSeconds,
        minFrames: POP_PACING.minSeconds * fps,
      },
    );
    expect(durationInFrames / fps).toBeGreaterThanOrEqual(REEL.minSeconds);
    expect(beats[0].endFrame).toBe(durationInFrames);
  });
});

describe("pop-out camera", () => {
  it("leaves the window centre fixed and scales by depth", () => {
    const cam = { ...cameraAt(0, []), yaw: 0, pitch: 0, dolly: 0 };
    const centre = project(cam, WINDOW.cx, WINDOW.cy, 0);
    expect(centre.x).toBeCloseTo(WINDOW.cx);
    expect(centre.k).toBeCloseTo(1);
    expect(project(cam, WINDOW.cx, WINDOW.cy, 300).k).toBeGreaterThan(1);
    expect(project(cam, WINDOW.cx, WINDOW.cy, -300).k).toBeLessThan(1);
  });

  it("is deterministic for a frame", () => {
    expect(cameraAt(120, [100])).toEqual(cameraAt(120, [100]));
  });
});
