import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FORMATS, formatOf } from "../src/schema";

// Every image an episode points at (photos, logo) must exist in public/, so
// a typo never reaches a render as a broken image.
const ROOT = path.resolve(import.meta.dirname, "..");
const EPISODES = path.join(ROOT, "data", "episodes");

const assetPaths = (value: unknown): string[] => {
  if (typeof value === "string") {
    return value.startsWith("assets/") ? [value] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap(assetPaths);
  }
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(assetPaths);
  }
  return [];
};

describe("episode assets", () => {
  for (const file of readdirSync(EPISODES).filter((f) => f.endsWith(".json"))) {
    const raw: unknown = JSON.parse(
      readFileSync(path.join(EPISODES, file), "utf8"),
    );

    it(`${file} passes its format's schema`, () => {
      const parsed = FORMATS[formatOf(raw)].schema.safeParse(raw);
      expect(parsed.success, parsed.error?.message).toBe(true);
    });

    it(`${file} points only at files that exist`, () => {
      for (const asset of assetPaths(raw)) {
        expect(existsSync(path.join(ROOT, "public", asset)), asset).toBe(true);
      }
    });
  }
});
