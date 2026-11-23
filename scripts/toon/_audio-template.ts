// EP13 soundtrack: voice lines at their scene offsets, the original soft-drive music bed (ducked under the voice),
// and license-free synthesized SFX (public/audio/sfx) on the story beats. Output: out/produce/ep13_mix.wav
// usage: npx tsx scripts/toon/ep13-audio.ts
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { cue, FPS, TOTAL, VOICE, sceneFrame } from "../../src/toon/shifu/cues";

const OUT = path.resolve("out/produce/ep13_mix.wav");
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const sec = (f: number) => (f / FPS).toFixed(3);

// [file, frame, gain dB]
const SFX: [string, number, number][] = [
  ["whoosh", cue(1, "turun") - 4, -12], ["pop", cue(1, "kambing"), -8],
  ["hiss", cue(2, "nyala"), -16], ["pop", cue(2, "kambing"), -12],
  ["tick", cue(3, "pengharum"), -10], ["tick", cue(3, "ganti"), -10], ["tick", cue(3, "tiga"), -10], ["hiss", cue(3, "disemprot"), -14], ["pop", cue(3, "balik"), -10],
  ["whoosh", sceneFrame(3) - 4, -10], ["marker", cue(4, "evaporator"), -14],
  ["crackle", cue(5, "jamur"), -16], ["paper", cue(5, "filter"), -12], ["pop", cue(5, "mampet"), -12],
  ["marker", cue(6, "kamera"), -14],
  ["hiss", cue(7, "evaporator"), -12], ["whoosh", cue(7, "diganti") - 6, -12], ["tick", cue(7, "dilancarkan"), -10],
  ["bell", cue(8, "wangi"), -14], ["hum", sceneFrame(7), -18],
  ["marker", cue(9, "langsung"), -8], ["bell", cue(9, "beres"), -12],
];

const args: string[] = ["-v", "error", "-y"];
const parts: string[] = [];
let n = 0;
for (const v of VOICE) {
  if (!v.src) continue;
  args.push("-i", path.resolve("public", v.src));
  parts.push(`[${n}:a]aresample=48000,adelay=${Math.round((v.from / FPS) * 1000)}:all=1[v${n}]`);
  n++;
}
const nv = n;
parts.push(`${Array.from({ length: nv }, (_, i) => `[v${i}]`).join("")}amix=inputs=${nv}:normalize=0,apad=whole_dur=${sec(TOTAL)}[voice]`);
args.push("-stream_loop", "-1", "-i", path.resolve("public/audio/bgm/soft-drive.wav"));
const mi = n++;
parts.push(`[${mi}:a]aresample=48000,atrim=0:${sec(TOTAL)},volume=-17dB,afade=t=in:d=0.6,afade=t=out:st=${(TOTAL / FPS - 1.6).toFixed(2)}:d=1.6[bed]`);
const sl: string[] = [];
for (const [f, fr, db] of SFX) {
  args.push("-i", path.resolve(`public/audio/sfx/${f}.wav`));
  parts.push(`[${n}:a]aresample=48000,volume=${db}dB,adelay=${Math.round((Math.max(0, fr) / FPS) * 1000)}:all=1[s${n}]`);
  sl.push(`[s${n}]`);
  n++;
}
parts.push(`${sl.join("")}amix=inputs=${sl.length}:normalize=0[sfx]`);
parts.push(`[voice]asplit=2[vo][key]`);
parts.push(`[bed][key]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[duck]`);
parts.push(`[vo][duck][sfx]amix=inputs=3:normalize=0,atrim=0:${sec(TOTAL)},loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[out]`);
args.push("-filter_complex", parts.join(";"), "-map", "[out]", "-ac", "2", "-ar", "48000", OUT);
execFileSync("ffmpeg", args, { stdio: "inherit" });
console.log("wrote", OUT, "frames", TOTAL);
