// Render a toon short in muted chunks (resumable), concat, and mux the prepared mix.
// usage: node scripts/toon/render.mjs <id> "<Title>" [chunk=240] [concurrency=2] [quality=1080|hd|uhd]
//   hd = 1440x2560, uhd = 2160x3840 (the 3D scene renders at that resolution, not an upscale; lower CRF)
//   needs out/produce/<id>_mix.wav (npx tsx scripts/toon/<id>-audio.ts); writes out/video/<id> - <Title>.mp4
import fs from "node:fs";
if (process.env.REMOTION_TMP) { fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP; }
import { execFileSync } from "node:child_process";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const [id, title, chunkS = "240", concS = "2", quality = process.env.TOON_QUALITY || "1080"] = process.argv.slice(2);
const SCALE = quality === "uhd" ? 2 : quality === "hd" ? 4 / 3 : 1, CRF = SCALE > 1 ? 14 : 16;
if (!id || !title) throw new Error("usage: render.mjs <id> <title>");
const CHUNK = Number(chunkS);
const dir = path.resolve(`out/produce/${id}_chunks${SCALE > 1 ? "_" + quality : ""}`);
fs.mkdirSync(dir, { recursive: true });
const mix = path.resolve(`out/produce/${id}_mix.wav`);
if (!fs.existsSync(mix)) throw new Error(`missing ${mix}`);
const browserExecutable = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const chromiumOptions = { gl: "angle" };
const inputProps = { post: { audio: false } };
const serveUrl = await bundle({ entryPoint: path.resolve(process.env.TOON_ENTRY || "src/toon/entry.tsx"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: process.env.TOON_COMP || "BenzShort", browserExecutable, chromiumOptions, inputProps });
const N = composition.durationInFrames;
const files = [];
for (let a = 0; a < N; a += CHUNK) {
  const b = Math.min(N - 1, a + CHUNK - 1);
  const out = path.join(dir, `c${String(a).padStart(5, "0")}.mp4`);
  files.push(out);
  if (fs.existsSync(out)) { console.log("skip", a, b); continue; }
  const t0 = Date.now();
  await renderMedia({ composition, serveUrl, inputProps, codec: "h264", crf: CRF, scale: SCALE, muted: true, frameRange: [a, b], outputLocation: out + ".part.mp4",
    browserExecutable, chromiumOptions, concurrency: Number(concS), timeoutInMilliseconds: 240000 });
  fs.renameSync(out + ".part.mp4", out);
  console.log("chunk", a, b, ((Date.now() - t0) / 1000).toFixed(0) + "s");
}
const list = path.join(dir, "list.txt");
fs.writeFileSync(list, files.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n"));
const silent = path.join(dir, "video.mp4");
execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", silent], { stdio: "inherit" });
fs.mkdirSync(path.resolve("out/video"), { recursive: true });
const final = path.resolve(`out/video/${id} - ${title}${SCALE > 1 ? " (" + quality.toUpperCase() + ")" : ""}.mp4`);
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", silent, "-i", mix, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", final], { stdio: "inherit" });
console.log("wrote", final);
