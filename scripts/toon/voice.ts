// Records a toon episode's narration with ElevenLabs (v3 by default): one mp3 per scene in public/audio/<id>/,
// word timings for cues and subtitles, scene lengths from the voice. v3 has no speed control, so the take is
// sped up afterwards with ffmpeg atempo (pitch kept) and the word times are scaled to match.
//   npx tsx scripts/toon/voice.ts ep11 [--all] [--only 3,5]
// Episode narration: { model, voice?, stability, similarity, exaggeration, tempo }. A scene's vo.tts (with v3 audio
// tags such as [confident]) is what gets spoken; vo.text stays the clean subtitle text.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { synth } from "../soft/tts";

const ROOT = process.cwd();
try { process.loadEnvFile(path.join(ROOT, ".env")); } catch { /* synth() explains a missing key */ }
const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith("--"));
if (!id) { console.error("usage: npx tsx scripts/toon/voice.ts <id> [--all] [--only 3,5]"); process.exit(1); }
const all = args.includes("--all");
const onlyArg = args[args.indexOf("--only") + 1];
const only = args.includes("--only") && onlyArg ? new Set(onlyArg.split(",").map(Number)) : null;

type Scene = { shot: string; seconds: number; outro?: boolean; vo: { text: string; tts?: string; src?: string; words?: { w: string; t: number }[]; seconds?: number } };
const file = path.join(ROOT, "data", "episodes", `${id}.json`);
const ep = JSON.parse(fs.readFileSync(file, "utf8")) as {
  narration?: { model?: string; voice?: string; stability?: number; similarity?: number; exaggeration?: number; tempo?: number; pad?: number };
  scenes: Scene[];
};
const n = ep.narration ?? {};
const voice = n.voice || process.env.ELEVENLABS_VOICE_ID?.trim();
if (!voice) { console.error("No voice: set narration.voice or ELEVENLABS_VOICE_ID in .env."); process.exit(1); }
const tempo = n.tempo ?? 1;
const settings = { provider: "elevenlabs" as const, voice, model: n.model ?? "eleven_v3", stability: n.stability ?? 0.5, similarity: n.similarity ?? 0.85, exaggeration: n.exaggeration ?? 0.35 };
const outDir = path.join(ROOT, "public", "audio", id);
fs.mkdirSync(outDir, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "toonvo-"));

const probe = (f: string) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

const main = async () => {
  for (const [i, s] of ep.scenes.entries()) {
    if (only ? !only.has(i + 1) : s.vo.src && !all) continue;
    const r = await synth(s.vo.tts ?? s.vo.text, settings);
    const name = `s${String(i + 1).padStart(2, "0")}.mp3`, out = path.join(outDir, name), raw = path.join(tmp, name);
    fs.writeFileSync(raw, r.audio);
    // cut the lead-in silence before the first word and the tail silence, then speed up (pitch kept)
    const lead = Math.max(0, (r.words[0]?.t ?? 0) - 0.06);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", raw, "-af",
      `atrim=start=${lead.toFixed(3)},asetpts=PTS-STARTPTS,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,areverse,atempo=${tempo}`,
      "-ar", "44100", "-b:a", "160k", out]);
    const secs = probe(out);
    s.vo = { text: s.vo.text, ...(s.vo.tts ? { tts: s.vo.tts } : {}), src: `audio/${id}/${name}`, words: r.words.map((w) => ({ w: w.w, t: Math.round((Math.max(0, w.t - lead) / tempo) * 1000) / 1000 })), seconds: Math.round(secs * 100) / 100 };
    console.log(`  ${name}  ${secs.toFixed(2)} s  ${s.shot}  (${r.words.length} words)`);
  }
  for (const s of ep.scenes) if (s.vo.seconds) s.seconds = Math.round((s.vo.seconds + (n.pad ?? 0.25)) * 100) / 100;
  fs.writeFileSync(file, JSON.stringify(ep, null, 2) + "\n");
  console.log(`total ${ep.scenes.reduce((a, s) => a + s.seconds, 0).toFixed(2)} s`);
};
main().catch((e: unknown) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
