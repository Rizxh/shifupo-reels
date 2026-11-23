import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { directedText, stripTagWords } from "../src/core/audio/voiceDirection";
import { directorProblems, productionSchema } from "../src/core/director/schema";

const sample = () =>
  productionSchema.parse(JSON.parse(readFileSync(path.join(__dirname, "..", "docs", "sp04", "production.json"), "utf8")));

describe("voice direction (ElevenLabs v3)", () => {
  it("adds the tone tag only for v3 models", () => {
    expect(directedText("Halo.", "warm", "eleven_v3")).toBe("[warm] Halo.");
    expect(directedText("Halo.", "warm", "eleven_multilingual_v2")).toBe("Halo.");
  });
  it("removes tags from word timings, including multi-word tags", () => {
    const words = ["[speaking", "softly]", "Baru", "[sighs]", "gajian"].map((text) => ({ text }));
    expect(stripTagWords(words).map((w) => w.text)).toEqual(["Baru", "gajian"]);
  });
});

describe("director engine", () => {
  it("accepts the sample production script", () => {
    expect(directorProblems(sample())).toEqual([]);
  });
  it("rejects a plain script: same camera twice, flat voice, no handoff", () => {
    const p = sample();
    p.beats[1].shot.camera = p.beats[0].shot.camera;
    delete p.beats[2].handoff;
    for (const b of p.beats) {
      b.vo.tone = "calm";
    }
    const problems = directorProblems(p).join("\n");
    expect(problems).toMatch(/kamera yang sama/);
    expect(problems).toMatch(/penghubung/);
    expect(problems).toMatch(/datar/);
  });
  it("rejects a beat without enough atmosphere at parse time", () => {
    const raw = JSON.parse(readFileSync(path.join(__dirname, "..", "docs", "sp04", "production.json"), "utf8"));
    raw.beats[0].environment.atmosphere = ["clouds"];
    expect(productionSchema.safeParse(raw).success).toBe(false);
  });
});
