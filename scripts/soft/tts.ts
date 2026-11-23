// AI narrator voices. Plain fetch, no SDK:
//   elevenlabs -> /v1/text-to-speech/{voice}/with-timestamps (mp3 + character
//                 timing, turned into word times for the subtitles)
//   openai     -> /v1/audio/speech (wav, so the exact length is in the header;
//                 word times are spread over it)
// Dev/test mode (MVA_FAKE_TTS=1 or MVA_FAKE_AI=1): a soft tone per word, so
// the whole pipeline runs without keys.

export class AiError extends Error {
  constructor(
    message: string,
    readonly kind: string,
  ) {
    super(message);
  }
}

export type TtsProvider = "elevenlabs" | "openai";
export type VoiceSettings = {
  provider: TtsProvider | "none";
  voice: string;
  model?: string;
  speed?: number; // 0.7..1.2
  style?: string; // delivery notes (OpenAI instructions; ElevenLabs v3 ignores)
  stability?: number; // ElevenLabs 0..1 (lower = livelier intonation)
  exaggeration?: number; // ElevenLabs style exaggeration 0..1 (higher = more expressive)
  similarity?: number; // ElevenLabs similarity boost 0..1 (higher = closer to the source voice)
};
export type Voice = { id: string; label: string; desc?: string };
export type TtsResult = { audio: Buffer; ext: "mp3" | "wav"; words: { w: string; t: number }[]; seconds: number };

export const TTS_ENV: Record<TtsProvider, string> = { elevenlabs: "ELEVENLABS_API_KEY", openai: "OPENAI_API_KEY" };
export const TTS_MODELS: Record<TtsProvider, { id: string; label: string }[]> = {
  elevenlabs: [
    { id: "eleven_multilingual_v2", label: "Multilingual v2 (stabil, bagus untuk Bahasa Indonesia)" },
    { id: "eleven_v3", label: "Eleven v3 (paling ekspresif)" },
    { id: "eleven_flash_v2_5", label: "Flash v2.5 (cepat, murah)" },
  ],
  // OpenAI marks these deprecated (shutdown 6 Jan 2027); still the only
  // models of the speech endpoint.
  openai: [
    { id: "gpt-4o-mini-tts-2025-12-15", label: "gpt-4o-mini-tts (bisa diarahkan gayanya)" },
    { id: "tts-1-hd", label: "tts-1-hd (kualitas tinggi, tanpa arahan gaya)" },
  ],
};
const OPENAI_VOICES: Voice[] = [
  ["alloy", "Netral, seimbang"],
  ["ash", "Pria, tegas"],
  ["ballad", "Pria, lembut"],
  ["cedar", "Pria, hangat"],
  ["coral", "Wanita, ceria"],
  ["echo", "Pria, tenang"],
  ["fable", "Bercerita, ekspresif"],
  ["marin", "Wanita, natural"],
  ["nova", "Wanita, energik"],
  ["onyx", "Pria, berat"],
  ["sage", "Wanita, kalem"],
  ["shimmer", "Wanita, cerah"],
  ["verse", "Serbaguna"],
].map(([id, desc]) => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1), desc }));

const fake = () => process.env.MVA_FAKE_TTS === "1" || process.env.MVA_FAKE_AI === "1";
const keyOf = (p: TtsProvider) => {
  const k = process.env[TTS_ENV[p]]?.trim();
  if (!k) throw new AiError(`Kunci API ${p === "elevenlabs" ? "ElevenLabs" : "OpenAI"} belum dipasang. Buka Pengaturan, bagian Kunci API.`, "key");
  return k;
};

const httpError = async (label: string, res: Response) => {
  const detail = (await res.text().catch(() => "")).slice(0, 200);
  if (res.status === 401 || res.status === 403) return new AiError(`Kunci ${label} ditolak. Periksa di Pengaturan.`, "auth");
  if (res.status === 429) return new AiError(`Kuota ${label} habis atau terlalu banyak permintaan. Coba lagi nanti.`, "quota");
  if (res.status === 402 || /paid_plan_required|payment_required/.test(detail))
    return new AiError(`Suara ini butuh paket berbayar ${label} (paket gratis tidak bisa memakai suara dari Voice Library lewat API). Upgrade paketnya, atau pilih suara bawaan.`, "quota");
  if (res.status === 404 || /voice_not_found|model_not_found/i.test(detail)) return new AiError(`Suara atau model ${label} tidak ditemukan. Pilih suara lain.`, "model");
  return new AiError(`${label} mengembalikan kesalahan (${res.status}).`, "other");
};

// ------------------------------------------------------------------ voices
export const listVoices = async (p: TtsProvider): Promise<Voice[]> => {
  if (p === "openai") return OPENAI_VOICES;
  if (fake() && !process.env.ELEVENLABS_API_KEY) return [{ id: "demo", label: "Demo (mode uji)", desc: "Nada uji, bukan suara asli" }];
  const res = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": keyOf("elevenlabs") }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw await httpError("ElevenLabs", res);
  const data = (await res.json()) as { voices?: { voice_id: string; name: string; labels?: Record<string, string>; category?: string }[] };
  return (data.voices ?? [])
    .map((v) => ({
      id: v.voice_id,
      label: v.name,
      desc: [v.labels?.gender, v.labels?.age, v.labels?.accent, v.labels?.description ?? v.labels?.descriptive, v.labels?.use_case].filter(Boolean).join(", ") || v.category,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

// ------------------------------------------------------------------ synth
const wavSeconds = (buf: Buffer) => {
  // Find the "data" chunk; byte rate is at offset 28 of the fmt chunk.
  const byteRate = buf.readUInt32LE(28);
  let i = 12;
  while (i < buf.length - 8) {
    const id = buf.toString("ascii", i, i + 4);
    const size = buf.readUInt32LE(i + 4);
    if (id === "data") return Math.min(size, buf.length - i - 8) / byteRate;
    i += 8 + size + (size % 2);
  }
  return (buf.length - 44) / byteRate;
};

export const spreadWords = (text: string, seconds: number) => {
  const words = text.split(/\s+/).filter(Boolean);
  const weights = words.map((w) => 0.6 + w.length * 0.12);
  const total = weights.reduce((a, b) => a + b, 0);
  const span = Math.max(0.3, seconds - 0.25);
  let acc = 0.1;
  return words.map((w, i) => {
    const t = acc;
    acc += (weights[i] / total) * span;
    return { w, t: Math.round(t * 1000) / 1000 };
  });
};

// ElevenLabs character timing -> word start times.
const charsToWords = (chars: string[], starts: number[]) => {
  const out: { w: string; t: number }[] = [];
  let cur = "";
  let t0 = 0;
  let tag = false; // inside an ElevenLabs v3 audio tag like [confident]: not spoken, no word
  chars.forEach((ch, i) => {
    if (ch === "[") { tag = true; return; }
    if (tag) { if (ch === "]") tag = false; return; }
    if (/\s/.test(ch)) {
      if (cur) out.push({ w: cur, t: t0 });
      cur = "";
    } else {
      if (!cur) t0 = starts[i] ?? 0;
      cur += ch;
    }
  });
  if (cur) out.push({ w: cur, t: t0 });
  return out.map((w) => ({ w: w.w, t: Math.round(w.t * 1000) / 1000 }));
};

const fakeVoice = (text: string, speed = 1): TtsResult => {
  const words = text.split(/\s+/).filter(Boolean);
  const per = 0.36 / speed;
  const seconds = 0.3 + words.length * per;
  const SR = 24000;
  const n = Math.round(seconds * SR);
  const data = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const k = (t - 0.15) / per;
    const inWord = k >= 0 && k % 1 < 0.7 && k < words.length;
    const env = inWord ? Math.sin(Math.PI * ((k % 1) / 0.7)) : 0;
    const v = env * 0.12 * Math.sin(2 * Math.PI * (180 + (Math.floor(k) % 5) * 20) * t);
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  return { audio: Buffer.concat([h, data]), ext: "wav", words: words.map((w, i) => ({ w, t: Math.round((0.15 + i * per) * 1000) / 1000 })), seconds };
};

export const synth = async (text: string, v: VoiceSettings, ctx: { previous?: string; next?: string } = {}): Promise<TtsResult> => {
  if (v.provider === "none") throw new AiError("Narator tidak dipilih.", "other");
  const clean = text.replace(/\s+/g, " ").trim().slice(0, 600);
  if (fake() && !process.env[TTS_ENV[v.provider]]) return fakeVoice(clean, v.speed);
  if (v.provider === "elevenlabs") {
    const model = v.model ?? "eleven_multilingual_v2";
    const v3 = model.startsWith("eleven_v3");
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(v.voice)}/with-timestamps?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": keyOf("elevenlabs"), "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        text: clean,
        model_id: model,
        ...(v3 ? {} : { previous_text: ctx.previous, next_text: ctx.next }),
        // v3 only takes stability 0 / 0.5 / 1 (creative / natural / robust)
        voice_settings: { stability: v3 ? [0, 0.5, 1].reduce((a, b) => (Math.abs(b - (v.stability ?? 0.5)) < Math.abs(a - (v.stability ?? 0.5)) ? b : a)) : v.stability ?? 0.5,
          similarity_boost: v.similarity ?? 0.75, style: v.exaggeration ?? 0.2, ...(v3 ? {} : { speed: Math.min(1.2, Math.max(0.7, v.speed ?? 1)) }) },
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) throw await httpError("ElevenLabs", res);
    const data = (await res.json()) as { audio_base64?: string; alignment?: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] } };
    if (!data.audio_base64) throw new AiError("ElevenLabs tidak mengembalikan audio.", "output");
    const a = data.alignment;
    const seconds = a?.character_end_times_seconds?.length ? a.character_end_times_seconds[a.character_end_times_seconds.length - 1] : clean.split(" ").length * 0.38;
    return { audio: Buffer.from(data.audio_base64, "base64"), ext: "mp3", words: a ? charsToWords(a.characters, a.character_start_times_seconds) : spreadWords(clean, seconds), seconds };
  }
  const model = v.model ?? "gpt-4o-mini-tts-2025-12-15";
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { authorization: `Bearer ${keyOf("openai")}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      voice: v.voice || "marin",
      input: clean,
      response_format: "wav",
      speed: Math.min(1.2, Math.max(0.7, v.speed ?? 1)),
      ...(model.startsWith("tts-1") ? {} : { instructions: v.style || "Speak Indonesian clearly and warmly, like a friendly teacher explaining to a beginner. Natural pace, light smile." }),
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw await httpError("OpenAI", res);
  const audio = Buffer.from(await res.arrayBuffer());
  const seconds = wavSeconds(audio);
  return { audio, ext: "wav", words: spreadWords(clean, seconds), seconds };
};
