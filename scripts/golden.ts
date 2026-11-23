// Golden-frame safety net for refactors: record reference frames of existing
// episodes, then check that later code still renders them the same.
//
//   npm run golden -- record [sp01 sp02 ...]   render references into tests/golden/<id>/
//   npm run golden -- check  [sp01 sp02 ...]   render again and compare (PSNR per frame)
//
// With no ids, every episode in data/episodes is used. References are local
// (tests/golden is gitignored): record them before a refactor, check after.

import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  compositionFor,
  EPISODES_DIR,
  loadEpisode,
  rel,
  ROOT,
  run,
  runMain,
  ScriptError,
} from "./lib/common";
import { OUT } from "./lib/paths";

const REMOTION_CLI = path.join(ROOT, "node_modules", "@remotion", "cli", "remotion-cli.js");
const GOLDEN_DIR = path.join(ROOT, "tests", "golden");
const EVERY_NTH = 12;
const SCALE = "0.25";
// Identical renders give infinite PSNR; anti-aliasing noise stays far above this.
const MIN_PSNR_DB = 40;

const allIds = (): string[] =>
  readdirSync(EPISODES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();

const renderFrames = async (id: string, dir: string): Promise<void> => {
  const episode = loadEpisode(id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const propsFile = path.join(OUT.props, `${id}-golden.json`);
  mkdirSync(path.dirname(propsFile), { recursive: true });
  writeFileSync(propsFile, JSON.stringify({ ...episode, debug: false }));
  // `--every-nth-frame` crashes Remotion's inline audio mixing (EINVAL) even
  // with --muted, so render the full sequence small and keep every nth frame.
  const tmp = `${dir}-tmp`;
  rmSync(tmp, { recursive: true, force: true });
  const { code } = await run(process.execPath, [
    REMOTION_CLI,
    "render",
    compositionFor(episode),
    tmp,
    `--props=${propsFile}`,
    "--sequence",
    "--muted",
    "--image-format=png",
    `--scale=${SCALE}`,
    "--log=error",
  ]);
  if (code !== 0) {
    throw new ScriptError(`Golden render failed for ${id}`);
  }
  const files = readdirSync(tmp).filter((f) => f.endsWith(".png")).sort();
  files.forEach((f, i) => {
    if (i % EVERY_NTH === 0) {
      renameSync(path.join(tmp, f), path.join(dir, f));
    }
  });
  rmSync(tmp, { recursive: true, force: true });
};

const psnr = async (a: string, b: string): Promise<number> => {
  const { code, stderr } = await run(
    "ffmpeg",
    ["-hide_banner", "-i", a, "-i", b, "-lavfi", "psnr", "-f", "null", "-"],
    { capture: true },
  );
  if (code !== 0) {
    throw new ScriptError(`ffmpeg psnr failed for ${rel(a)}`);
  }
  const m = /average:(inf|[\d.]+)/.exec(stderr ?? "");
  if (!m) {
    throw new ScriptError(`No PSNR in ffmpeg output for ${rel(a)}`);
  }
  return m[1] === "inf" ? Infinity : Number(m[1]);
};

const main = async () => {
  const [mode, ...rest] = process.argv.slice(2);
  if (mode !== "record" && mode !== "check") {
    throw new ScriptError("Usage: npm run golden -- record|check [ids...]");
  }
  const ids = rest.length > 0 ? rest : allIds();
  const failures: string[] = [];
  for (const id of ids) {
    const refDir = path.join(GOLDEN_DIR, id);
    if (mode === "record") {
      await renderFrames(id, refDir);
      console.log(`${id}: ${readdirSync(refDir).length} reference frames in ${rel(refDir)}`);
      continue;
    }
    if (!existsSync(refDir)) {
      throw new ScriptError(`No references for ${id}. Run: npm run golden -- record ${id}`);
    }
    const outDir = path.join(OUT.golden, id);
    await renderFrames(id, outDir);
    const refs = readdirSync(refDir).filter((f) => f.endsWith(".png")).sort();
    const got = new Set(readdirSync(outDir));
    let worst = Infinity;
    for (const f of refs) {
      if (!got.has(f)) {
        failures.push(`${id}/${f}: missing (episode length changed?)`);
        continue;
      }
      const v = await psnr(path.join(refDir, f), path.join(outDir, f));
      worst = Math.min(worst, v);
      if (v < MIN_PSNR_DB) {
        failures.push(`${id}/${f}: PSNR ${v.toFixed(1)} dB < ${MIN_PSNR_DB}`);
      }
    }
    if (got.size !== refs.length) {
      failures.push(`${id}: ${got.size} frames rendered, ${refs.length} expected`);
    }
    console.log(`${id}: ${refs.length} frames, worst PSNR ${worst === Infinity ? "identical" : `${worst.toFixed(1)} dB`}`);
  }
  if (failures.length > 0) {
    console.error(`\nGolden check failed:\n- ${failures.join("\n- ")}`);
    process.exit(1);
  }
  console.log(mode === "record" ? "\nReferences recorded." : "\nGolden check passed.");
};

runMain(main);
