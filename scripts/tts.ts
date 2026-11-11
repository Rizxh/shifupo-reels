// Generates one voice over file per scene with ElevenLabs, plus a JSON sidecar
// holding word timings for the captions.
//
//   npm run tts -- sp01              generate missing or changed scenes
//   npm run tts -- sp01 --force      regenerate every scene
//   npm run tts -- sp01 --scene 3    only scene 3 (1-based), combine with --force
//
// Reads ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID from .env. The key is only
// ever sent as a request header; it is never printed or written to disk.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";
import {
  alignmentToWords,
  characterAlignmentSchema,
  VO_SIDECAR_VERSION,
  voAlignmentPath,
  voAudioPath,
  voSidecarSchema,
  type VoSidecar,
} from "../src/lib/audio";
import { splitWords } from "../src/lib/text";
import {
  loadVoScript,
  PUBLIC_DIR,
  rel,
  ROOT,
  runMain,
  ScriptError,
  type VoScript,
} from "./lib/common";
import { measureLoudnessLufs } from "./lib/loudness";

const DEFAULT_API_BASE = "https://api.elevenlabs.io";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";
const OUTPUT_FORMAT = "mp3_44100_128";

const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_ERROR_DETAIL_CHARS = 300;
const MS_PER_SECOND = 1_000;

type Config = {
  apiKey: string;
  voiceId: string;
  modelId: string;
  apiBase: string;
};

const ttsResponseSchema = z.object({
  audio_base64: z.string().min(1),
  alignment: characterAlignmentSchema.nullable().optional(),
});

const loadConfig = (): Config => {
  try {
    process.loadEnvFile(path.join(ROOT, ".env"));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
  }

  const missing = ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID"].filter(
    (name) => !process.env[name]?.trim(),
  );
  if (missing.length > 0) {
    throw new ScriptError(
      `Missing ${missing.join(" and ")}. Copy .env.example to .env and fill it in.`,
    );
  }

  return {
    apiKey: process.env.ELEVENLABS_API_KEY!.trim(),
    voiceId: process.env.ELEVENLABS_VOICE_ID!.trim(),
    modelId: process.env.ELEVENLABS_MODEL_ID?.trim() || DEFAULT_MODEL_ID,
    apiBase: (
      process.env.ELEVENLABS_BASE_URL?.trim() || DEFAULT_API_BASE
    ).replace(/\/+$/, ""),
  };
};

const parseCli = () => {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      force: { type: "boolean", default: false },
      scene: { type: "string" },
    },
  });

  const episodeId = positionals[0];
  if (!episodeId) {
    throw new ScriptError(
      "Usage: npm run tts -- <episode-id> [--force] [--scene N]",
    );
  }

  let sceneNumber: number | undefined;
  if (values.scene !== undefined) {
    sceneNumber = Number(values.scene);
    if (!Number.isInteger(sceneNumber) || sceneNumber < 1) {
      throw new ScriptError(
        `--scene must be a positive integer, got "${values.scene}"`,
      );
    }
  }

  return { episodeId, force: values.force, sceneNumber };
};

const textHash = (config: Config, text: string): string =>
  createHash("sha256")
    .update([config.modelId, config.voiceId, OUTPUT_FORMAT, text].join("\n"))
    .digest("hex");

const readSidecar = (file: string): VoSidecar | null => {
  if (!existsSync(file)) {
    return null;
  }
  const parsed = voSidecarSchema.safeParse(
    JSON.parse(readFileSync(file, "utf8")),
  );
  return parsed.success ? parsed.data : null;
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

// Honors Retry-After when present, otherwise doubles the wait per attempt.
const backoffMs = (attempt: number, retryAfter: string | null): number => {
  const seconds = retryAfter === null ? NaN : Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * MS_PER_SECOND, MAX_BACKOFF_MS);
  }
  return Math.min(BASE_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS);
};

// ElevenLabs errors come as { detail: string | { message } | [{ msg }] }.
const readErrorDetail = async (res: Response): Promise<string> => {
  const raw = await res.text().catch(() => "");
  let detail: string = raw;
  try {
    const body = JSON.parse(raw) as { detail?: unknown };
    const d = body.detail;
    if (typeof d === "string") {
      detail = d;
    } else if (Array.isArray(d)) {
      detail = d
        .map((e: { msg?: string; loc?: unknown[] }) =>
          [e.loc?.join("."), e.msg].filter(Boolean).join(": "),
        )
        .join("; ");
    } else if (d && typeof d === "object" && "message" in d) {
      detail = String((d as { message: unknown }).message);
    }
  } catch {
    // Not JSON; keep the raw text.
  }
  return detail.slice(0, MAX_ERROR_DETAIL_CHARS);
};

const describeHttpError = (status: number, detail: string): string => {
  const hint: Record<number, string> = {
    401: "Unauthorized. Check ELEVENLABS_API_KEY in .env.",
    402: "Payment required. The ElevenLabs plan or credits may be exhausted.",
    404: "Not found. Check ELEVENLABS_VOICE_ID in .env.",
    422: "Request rejected by validation.",
    429: "Rate limited or quota exceeded, and retries ran out.",
  };
  const prefix = hint[status] ?? `ElevenLabs returned HTTP ${status}.`;
  return detail
    ? `${prefix} (HTTP ${status}: ${detail})`
    : `${prefix} (HTTP ${status})`;
};

const isRetryableStatus = (status: number) => status === 429 || status >= 500;

const requestTts = async (
  config: Config,
  text: string,
  context: { previousText?: string; nextText?: string },
) => {
  const url = `${config.apiBase}/v1/text-to-speech/${encodeURIComponent(
    config.voiceId,
  )}/with-timestamps?output_format=${OUTPUT_FORMAT}`;
  const body = JSON.stringify({
    text,
    model_id: config.modelId,
    // Neighbouring lines keep intonation consistent across per-scene files.
    previous_text: context.previousText,
    next_text: context.nextText,
  });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": config.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      if (attempt === MAX_ATTEMPTS) {
        throw new ScriptError(
          `Network error after ${MAX_ATTEMPTS} attempts: ${reason}`,
        );
      }
      const wait = backoffMs(attempt, null);
      console.warn(`  network error (${reason}), retrying in ${wait} ms`);
      await sleep(wait);
      continue;
    }

    if (res.ok) {
      const parsed = ttsResponseSchema.safeParse(await res.json());
      if (!parsed.success) {
        throw new ScriptError(
          `Unexpected response shape:\n${z.prettifyError(parsed.error)}`,
        );
      }
      return parsed.data;
    }

    const detail = await readErrorDetail(res);
    if (isRetryableStatus(res.status) && attempt < MAX_ATTEMPTS) {
      const wait = backoffMs(attempt, res.headers.get("retry-after"));
      console.warn(
        `  HTTP ${res.status}, retrying in ${wait} ms (attempt ${attempt}/${MAX_ATTEMPTS})`,
      );
      await sleep(wait);
      continue;
    }
    throw new ScriptError(describeHttpError(res.status, detail));
  }

  throw new ScriptError("Unreachable: retry loop exited without a result");
};

type Outcome = "generated" | "skipped";

const processScene = async (
  config: Config,
  episodeId: string,
  scenes: VoScript["scenes"],
  index: number,
  force: boolean,
): Promise<Outcome> => {
  const scene = scenes[index];
  const label = `s${index + 1} (${scene.type})`;
  const audioFile = path.join(PUBLIC_DIR, voAudioPath(episodeId, index));
  const sidecarFile = path.join(PUBLIC_DIR, voAlignmentPath(episodeId, index));
  const hash = textHash(config, scene.vo);

  if (!force && existsSync(audioFile)) {
    const sidecar = readSidecar(sidecarFile);
    if (sidecar === null) {
      console.log(
        `${label}: audio exists without sidecar (manual recording?), skipped`,
      );
      return "skipped";
    }
    if (sidecar.textHash === hash) {
      console.log(`${label}: up to date, skipped`);
      return "skipped";
    }
    console.log(`${label}: line, voice or model changed, regenerating`);
  } else {
    console.log(`${label}: generating`);
  }

  const response = await requestTts(config, scene.vo, {
    previousText: scenes[index - 1]?.vo,
    nextText: scenes[index + 1]?.vo,
  });

  const words = response.alignment ? alignmentToWords(response.alignment) : [];
  const expectedWords = splitWords(scene.vo).length;
  if (words.length === 0) {
    console.warn(`  no alignment returned; captions will use an even split`);
  } else if (words.length !== expectedWords) {
    console.warn(
      `  alignment has ${words.length} words but the line has ${expectedWords}; captions will use an even split`,
    );
  }

  const sidecar: VoSidecar = {
    version: VO_SIDECAR_VERSION,
    source: "elevenlabs",
    modelId: config.modelId,
    outputFormat: OUTPUT_FORMAT,
    textHash: hash,
    text: scene.vo,
    words,
  };

  mkdirSync(path.dirname(audioFile), { recursive: true });
  writeFileSync(audioFile, Buffer.from(response.audio_base64, "base64"));
  sidecar.loudnessLufs = await measureLoudnessLufs(audioFile);
  writeFileSync(sidecarFile, `${JSON.stringify(sidecar, null, 2)}\n`);
  console.log(`  wrote ${rel(audioFile)} (${words.length} aligned words)`);
  return "generated";
};

const main = async () => {
  const { episodeId, force, sceneNumber } = parseCli();
  const episode = loadVoScript(episodeId);
  const config = loadConfig();

  if (sceneNumber !== undefined && sceneNumber > episode.scenes.length) {
    throw new ScriptError(
      `--scene ${sceneNumber} is out of range (episode has ${episode.scenes.length} scenes)`,
    );
  }
  const indices =
    sceneNumber === undefined
      ? episode.scenes.map((_, i) => i)
      : [sceneNumber - 1];

  console.log(
    `TTS ${episode.id} "${episode.title}" with model ${config.modelId}`,
  );
  const counts: Record<Outcome, number> = { generated: 0, skipped: 0 };
  for (const index of indices) {
    counts[
      await processScene(config, episode.id, episode.scenes, index, force)
    ]++;
  }
  console.log(
    `Done: ${counts.generated} generated, ${counts.skipped} skipped.`,
  );
};

runMain(main);
