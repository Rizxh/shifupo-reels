// Synthesizes the temporary music bed of sp09 "KITA PAY JAY SEN" until the
// real song exists: an original festive piece in D major pentatonic at
// 120 BPM, so every 4-second lyric line of the storyboard is exactly two
// bars. Plucked zither (Karplus-Strong), bamboo flute, festival drum, wood
// block, cymbal, gong, bass and a soft pad, all from oscillators and seeded
// noise: original work, identical on every run, no third-party material.
//
//   npm run music

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PUBLIC_DIR, rel, runMain } from "./lib/common";

const SR = 48000;
const BPM = 120;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const LINE = BAR * 2; // one lyric line of the storyboard (4 s)
const SECONDS = 72;
const OUT = path.join(PUBLIC_DIR, "audio", "bgm", "pay-jay-sen-temp.wav");

// ------------------------------------------------------------------ helpers
const N = Math.ceil(SECONDS * SR) + SR * 2;
const L = new Float32Array(N);
const R = new Float32Array(N);
const sendL = new Float32Array(N);
const sendR = new Float32Array(N);

const mulberry = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rnd = mulberry(909);

// Adds a mono signal at time t0 with gain, pan (-1..1) and reverb send.
const add = (t0: number, sig: Float32Array, gain: number, pan = 0, send = 0.15) => {
  const start = Math.round(t0 * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < sig.length && start + i < N; i++) {
    if (start + i < 0) continue;
    L[start + i] += sig[i] * gl;
    R[start + i] += sig[i] * gr;
    sendL[start + i] += sig[i] * gl * send;
    sendR[start + i] += sig[i] * gr * send;
  }
};

// D major pentatonic degrees: 0 = D4.
const PENTA = [0, 2, 4, 7, 9];
const D4 = 293.66;
const deg = (d: number) => D4 * 2 ** ((PENTA[((d % 5) + 5) % 5] + 12 * Math.floor(d / 5)) / 12);

// ------------------------------------------------------------------ voices
// Plucked zither: Karplus-Strong with a bright seeded burst.
const pluck = (f: number, dur: number, bright = 0.5) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const p = Math.max(2, Math.round(SR / f));
  const buf = new Float32Array(p);
  for (let i = 0; i < p; i++) buf[i] = rnd() * 2 - 1;
  let idx = 0;
  const damp = 0.996 + 0.0035 * bright;
  for (let i = 0; i < n; i++) {
    const a = buf[idx];
    const b = buf[(idx + 1) % p];
    const v = damp * (0.5 * (a + b));
    buf[idx] = v;
    out[i] = a * (i < 60 ? i / 60 : 1);
    idx = (idx + 1) % p;
  }
  return out;
};

// Bamboo flute: sine + soft 2nd/3rd harmonics, delayed vibrato and breath.
const flute = (f: number, dur: number) => {
  const n = Math.round((dur + 0.15) * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const vib = 1 + 0.006 * Math.min(1, t / 0.35) * Math.sin(2 * Math.PI * 5.4 * t);
    ph += (2 * Math.PI * f * vib) / SR;
    const env = Math.min(1, t / 0.05) * (t > dur ? Math.exp(-(t - dur) * 30) : 1) * (1 - 0.15 * Math.min(1, t / dur));
    const breath = (rnd() * 2 - 1) * 0.04;
    out[i] = env * (Math.sin(ph) + 0.22 * Math.sin(2 * ph) + 0.08 * Math.sin(3 * ph) + breath);
  }
  return out;
};

// Festival drum (tanggu): pitch-dropping body plus a skin slap.
const drum = (big = 1) => {
  const n = Math.round(0.7 * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 58 + 90 * Math.exp(-t * 28);
    ph += (2 * Math.PI * f) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * (6 / big)) + (rnd() * 2 - 1) * 0.35 * Math.exp(-t * 60);
  }
  return out;
};

const woodblock = (f = 1180) => {
  const n = Math.round(0.08 * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(2 * Math.PI * f * 2.7 * t)) * Math.exp(-t * 70);
  }
  return out;
};

// Cymbal (bo): high-passed noise with a long shimmering decay.
const cymbal = (dur = 1.6) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const w = rnd() * 2 - 1;
    const hp = w - prev;
    prev = w;
    out[i] = hp * Math.exp(-t * 2.6) * (0.8 + 0.2 * Math.sin(2 * Math.PI * 7 * t));
  }
  return out;
};

const gong = (dur = 4) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const parts: [number, number, number][] = [
    [98, 0.5, 0.7],
    [147.5, 0.32, 1.0],
    [213, 0.2, 1.4],
    [318, 0.12, 2.0],
    [61, 0.35, 0.5],
  ];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    for (const [f, a, d] of parts) v += a * Math.sin(2 * Math.PI * f * t) * Math.exp(-d * t);
    out[i] = v * (1 + 0.15 * Math.sin(2 * Math.PI * 2.4 * t)) * Math.min(1, t / 0.02);
  }
  return out;
};

const bass = (f: number, dur: number) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * Math.exp(-t * 2.2) * Math.min(1, t / 0.01);
  }
  return out;
};

// Pad: detuned sines on the chord, slow swell, one-pole lowpass feel.
const pad = (freqs: number[], dur: number) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    for (const f of freqs) v += Math.sin(2 * Math.PI * f * t) + Math.sin(2 * Math.PI * f * 1.004 * t) * 0.7;
    const env = Math.min(1, t / 0.6) * Math.min(1, (dur - t) / 0.4);
    out[i] = (v / freqs.length) * env;
  }
  return out;
};

// ------------------------------------------------------------------ song
type Note = [beat: number, degree: number, beats: number];
const CHORDS: Record<string, number[]> = {
  D: [146.83, 185.0, 220.0],
  Bm: [123.47, 146.83, 185.0],
  G: [98.0, 123.47, 146.83],
  A: [110.0, 138.59, 164.81],
};

// Melodies, one per lyric line (8 beats), degrees of D pentatonic.
const VERSE: Note[][] = [
  [[0, 3, 1], [1, 4, 1], [2, 5, 1], [3, 4, 0.5], [3.5, 3, 0.5], [4, 2, 2], [6, 3, 2]], // KITA PAY JAY SEN
  [[0, 2, 1], [1, 3, 1], [2, 4, 1.5], [3.5, 3, 0.5], [4, 5, 3]], // PINTU TERBUKA
  [[0, 5, 1], [1, 4, 1], [2, 3, 1], [3, 2, 1], [4, 3, 2], [6, 1, 2]], // KAYA DAN JAYA
  [[0, 1, 0.5], [0.5, 2, 0.5], [1, 3, 1], [2, 2, 1], [3, 1, 1], [4, 0, 4]], // ADA SEBABNYA
  [[0, 3, 1], [1, 5, 1], [2, 6, 1], [3, 5, 0.5], [3.5, 4, 0.5], [4, 3, 2], [6, 4, 2]], // SIKON MENUNJANG
  [[0, 4, 1], [1, 5, 1], [2, 4, 1], [3, 3, 1], [4, 2, 3]], // RAMAH ORANGNYA
  [[0, 2, 0.5], [0.5, 3, 0.5], [1, 4, 1], [2, 5, 2], [4, 4, 1], [5, 3, 1], [6, 4, 2]], // GIAT USAHA
  [[0, 5, 1], [1, 6, 1], [2, 5, 1], [3, 4, 1], [4, 5, 4]], // BERKAT BERLIMPAH
];
const CALL: Note[] = [[0, 5, 1], [1, 6, 1], [2, 7, 2], [4, 6, 1], [5, 5, 1], [6, 4, 2]]; // PAY JAY SEN
const ANSWERS: Note[][] = [
  [[0, 4, 1], [1, 5, 0.5], [1.5, 4, 0.5], [2, 3, 2], [4, 2, 1], [5, 3, 1], [6, 4, 2]], // DAPAT PAHALA
  [[0, 5, 1], [1, 4, 1], [2, 5, 1], [3, 6, 1], [4, 5, 4]], // HARTA MERUAH
  [[0, 3, 1], [1, 4, 1], [2, 5, 1.5], [3.5, 6, 0.5], [4, 7, 2], [6, 5, 2]], // HOKGI BERTAMBAH
  [[0, 6, 1], [1, 7, 1], [2, 8, 2], [4, 7, 1], [5, 6, 1], [6, 5, 2]], // HOKGI BERTAMBAH (final)
];
const VERSE_CHORDS: [string, string][] = [
  ["D", "Bm"],
  ["G", "A"],
  ["D", "Bm"],
  ["G", "D"],
];

const playMelody = (t0: number, notes: Note[], gain: number, withFlute: boolean) => {
  for (const [b, d, len] of notes) {
    const t = t0 + b * BEAT;
    add(t, pluck(deg(d), len * BEAT + 0.6, 0.6), gain, -0.25, 0.22);
    if (withFlute) add(t, flute(deg(d) * 2, len * BEAT * 0.95), gain * 0.32, 0.3, 0.3);
  }
};

const playChords = (t0: number, a: string, b: string, gain: number) => {
  [a, b].forEach((c, k) => {
    const start = t0 + k * BAR;
    add(start, pad(CHORDS[c].map((f) => f * 2), BAR + 0.3), gain * 0.18, 0, 0.4);
    add(start, bass(CHORDS[c][0] / 2, BEAT * 1.8), gain * 0.55, 0, 0.05);
    add(start + 2 * BEAT, bass(CHORDS[c][0] / 2, BEAT * 1.8), gain * 0.45, 0, 0.05);
    // Zither arpeggio (eighths) under the melody.
    for (let e = 0; e < 8; e++) {
      const f = CHORDS[c][e % 3] * (e % 6 < 3 ? 2 : 4);
      add(start + e * BEAT * 0.5, pluck(f, 0.5, 0.3), gain * 0.16, 0.45, 0.2);
    }
  });
};

const playDrums = (t0: number, energy: 1 | 2, fill: boolean) => {
  for (let bar = 0; bar < 2; bar++) {
    for (let beat = 0; beat < 4; beat++) {
      const t = t0 + bar * BAR + beat * BEAT;
      if (beat === 0 || beat === 2 || energy === 2) add(t, drum(beat === 0 ? 1.3 : 1), beat === 0 ? 0.9 : 0.6, 0, 0.08);
      add(t + BEAT / 2, woodblock(beat % 2 ? 1180 : 980), 0.22, 0.15 * (beat % 2 ? 1 : -1), 0.1);
    }
  }
  if (fill) {
    for (let k = 0; k < 4; k++) add(t0 + LINE - BEAT + k * BEAT * 0.25, drum(0.8), 0.45 + k * 0.12, 0, 0.08);
  }
};

const compose = () => {
  // Intro (0-4 s): gong, rising zither arpeggio, pad.
  add(0, gong(), 0.7, 0, 0.35);
  add(0, pad(CHORDS.D.map((f) => f * 2), LINE), 0.16, 0, 0.5);
  for (let k = 0; k < 12; k++) add(0.5 + k * 0.25, pluck(deg(k), 1.2, 0.4), 0.28, -0.2 + k * 0.04, 0.3);
  add(LINE - BEAT, drum(0.8), 0.5, 0, 0.08);
  add(LINE - BEAT * 0.5, drum(0.8), 0.65, 0, 0.08);

  // Verse (4-36 s): eight lines.
  VERSE.forEach((mel, i) => {
    const t = LINE * (1 + i);
    const [a, b] = VERSE_CHORDS[i % 4];
    playChords(t, a, b, 1);
    playDrums(t, 1, i === VERSE.length - 1);
    playMelody(t, mel, 0.5, i >= 4);
  });

  // Chorus (36-68 s): call "PAY JAY SEN" and answer, four times.
  for (let k = 0; k < 4; k++) {
    const call = LINE * (9 + k * 2);
    const ans = call + LINE;
    if (k === 0 || k === 2) add(call, cymbal(2.2), 0.28, 0, 0.3);
    playChords(call, "D", "Bm", 1.1);
    playChords(ans, "G", k === 3 ? "D" : "A", 1.1);
    playDrums(call, 2, false);
    playDrums(ans, 2, k < 3);
    playMelody(call, CALL, 0.55, true);
    playMelody(ans, ANSWERS[k], 0.55, true);
  }

  // Outro (68-72 s): final hit, gong, arpeggio up to the high D, ring out.
  const end = LINE * 17;
  add(end, drum(1.6), 1.0, 0, 0.15);
  add(end, cymbal(3), 0.3, 0, 0.35);
  add(end, gong(4), 0.6, 0, 0.4);
  add(end, bass(CHORDS.D[0] / 2, 3), 0.6, 0, 0.05);
  add(end, pad(CHORDS.D.map((f) => f * 2), LINE), 0.2, 0, 0.5);
  for (let k = 0; k < 11; k++) add(end + 0.3 + k * 0.18, pluck(deg(k), 2, 0.5), 0.26, -0.3 + k * 0.06, 0.35);
};

// ------------------------------------------------------------------ mix
// Schroeder reverb on the send bus: four combs, two allpasses per side.
const reverb = (input: Float32Array, offset: number) => {
  const out = new Float32Array(input.length);
  const combs = [1557, 1617, 1491, 1422].map((d) => ({ buf: new Float32Array(d + offset), i: 0 }));
  for (let n = 0; n < input.length; n++) {
    let s = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.buf[c.i] = input[n] + y * 0.82;
      c.i = (c.i + 1) % c.buf.length;
      s += y;
    }
    out[n] = s * 0.25;
  }
  for (const d of [225, 556]) {
    const buf = new Float32Array(d + offset);
    let i = 0;
    for (let n = 0; n < out.length; n++) {
      const y = buf[i];
      const x = out[n];
      buf[i] = x + y * 0.5;
      out[n] = y - x * 0.5;
      i = (i + 1) % buf.length;
    }
  }
  return out;
};

// About -16 dBFS RMS: close to the -14 LUFS delivery level, so loudness
// normalization adds little gain on top of the limited peaks.
const RMS_TARGET = 0.16;
const CEILING = 0.6; // -4.4 dBFS sample peak
const LOOKAHEAD = Math.round(0.005 * SR);
const RELEASE = Math.exp(-1 / (0.09 * SR));

const limit = (left: Float32Array, right: Float32Array, length: number) => {
  const need = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const p = Math.max(Math.abs(left[i]), Math.abs(right[i]));
    need[i] = p > CEILING ? CEILING / p : 1;
  }
  // Smallest gain needed over the next LOOKAHEAD samples (sliding minimum).
  const ahead = new Float32Array(length);
  const q: number[] = [];
  for (let i = length - 1; i >= 0; i--) {
    while (q.length && need[q[q.length - 1]] >= need[i]) q.pop();
    q.push(i);
    while (q[0] > i + LOOKAHEAD) q.shift();
    ahead[i] = need[q[0]];
  }
  let gain = 1;
  for (let i = 0; i < length; i++) {
    const target = ahead[i];
    gain = target < gain ? gain + (target - gain) * (4 / LOOKAHEAD) : target + (gain - target) * RELEASE;
    gain = Math.min(gain, 1);
    left[i] = Math.max(-CEILING, Math.min(CEILING, left[i] * gain));
    right[i] = Math.max(-CEILING, Math.min(CEILING, right[i] * gain));
  }
};

const writeWav = (file: string, left: Float32Array, right: Float32Array, length: number) => {
  const data = Buffer.alloc(length * 4);
  for (let i = 0; i < length; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i])) * 32767), i * 4);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i])) * 32767), i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 4, 28);
  h.writeUInt16LE(4, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  writeFileSync(file, Buffer.concat([h, data]));
};

const main = async () => {
  compose();
  const wl = reverb(sendL, 0);
  const wr = reverb(sendR, 23);
  const length = Math.round(SECONDS * SR);
  let sq = 0;
  for (let i = 0; i < length; i++) {
    L[i] = Math.tanh((L[i] + wl[i]) * 0.9);
    R[i] = Math.tanh((R[i] + wr[i]) * 0.9);
    sq += L[i] * L[i] + R[i] * R[i];
  }
  // Level by RMS, then a look-ahead limiter: the drum transients made the
  // true peak overshoot -1.5 dB after loudness normalization and AAC (sp09).
  const g = RMS_TARGET / Math.sqrt(sq / (2 * length));
  for (let i = 0; i < length; i++) {
    L[i] *= g;
    R[i] *= g;
  }
  limit(L, R, length);
  mkdirSync(path.dirname(OUT), { recursive: true });
  writeWav(OUT, L, R, length);
  console.log(`Wrote ${rel(OUT)} (${SECONDS} s, ${BPM} BPM, ${LINE} s per lyric line)`);
};

runMain(main);
