// Synthesizes the sound effects with ffmpeg: oscillators, seeded noise and
// envelopes only, so the output is identical on every run and carries no
// third-party license.
//
//   npm run sfx

import { mkdirSync } from "node:fs";
import path from "node:path";
import { SFX, WHOOSH_PEAK_SECONDS, type SfxName } from "../src/lib/sfx";
import { PUBLIC_DIR, rel, run, runMain, ScriptError } from "./lib/common";

const SAMPLE_RATE = 48000;
const S = `s=${SAMPLE_RATE}`;

// A bell: fundamental plus inharmonic partials (2.76, 5.4, 8.93), each
// decaying faster than the one below.
const bell = (f: number, d: number) =>
  `aevalsrc='0.5*sin(2*PI*${f}*t)*exp(-3*t)+0.26*sin(2*PI*${(f * 2.76).toFixed(1)}*t)*exp(-5*t)+0.14*sin(2*PI*${(f * 5.4).toFixed(1)}*t)*exp(-8*t)+0.06*sin(2*PI*${(f * 8.93).toFixed(1)}*t)*exp(-12*t)':d=${d}:${S},afade=t=in:d=0.004[out]`;

// One ffmpeg filter graph per effect; each ends in a stream named [out].
const RECIPES: Record<SfxName, string> = {
  // Soft temple gong: low inharmonic partials with a slow beat.
  gong: `aevalsrc='(0.5*sin(2*PI*98*t)*exp(-0.9*t)+0.32*sin(2*PI*147.5*t)*exp(-1.3*t)+0.2*sin(2*PI*213*t)*exp(-1.8*t)+0.12*sin(2*PI*318*t)*exp(-2.6*t))*(1+0.18*sin(2*PI*2.6*t))':d=3.5:${S},afade=t=in:d=0.02,lowpass=f=1800[out]`,
  // Wind-chime notes on a pentatonic scale (A5, B5, D6, E6), one per pillar.
  chime1: bell(880, 1.6),
  chime2: bell(987.8, 1.6),
  chime3: bell(1174.7, 1.6),
  chime4: bell(1318.5, 1.6),
  // Air rush for ink wipes.
  whoosh: `anoisesrc=d=0.6:c=pink:seed=3:a=0.8,highpass=f=220,lowpass=f=3200,afade=t=in:st=0:d=${WHOOSH_PEAK_SECONDS}:curve=qsin,afade=t=out:st=${WHOOSH_PEAK_SECONDS}:d=0.25:curve=qsin,volume=9dB[out]`,
  // Compass tick: a tiny wooden click.
  tick: `aevalsrc='0.7*sin(2*PI*2100*t)*exp(-90*t)':d=0.05:${S}[a];anoisesrc=d=0.012:c=white:seed=9:a=0.4,highpass=f=3000[b];[a][b]amix=inputs=2:normalize=0[out]`,
  // Needle lock: metallic clack with a short ring.
  lock: `aevalsrc='0.8*sin(2*PI*1250*t)*exp(-22*t)+0.4*sin(2*PI*3100*t)*exp(-40*t)':d=0.4:${S}[a];anoisesrc=d=0.02:c=white:seed=4:a=0.6,highpass=f=2000,afade=t=out:st=0:d=0.02[b];[a][b]amix=inputs=2:normalize=0,alimiter=limit=0.9[out]`,
  // Heavy hit under a slammed headline.
  thump: `aevalsrc='0.95*sin(2*PI*(45*t+(75/16)*(1-exp(-16*t))))*exp(-6*t)':d=0.6:${S}[a];anoisesrc=d=0.03:c=white:seed=21:a=0.5,highpass=f=1500,afade=t=out:st=0:d=0.025[b];[a][b]amix=inputs=2:normalize=0,alimiter=limit=0.9[out]`,
  // Seal stamp: dull thud of wood on paper.
  stamp: `aevalsrc='0.9*sin(2*PI*(70*t+(90/24)*(1-exp(-24*t))))*exp(-12*t)':d=0.35:${S}[a];anoisesrc=d=0.12:c=brown:seed=6:a=0.9,lowpass=f=600,afade=t=out:st=0:d=0.12[b];[a][b]amix=inputs=2:normalize=0,alimiter=limit=0.9[out]`,
  // Coin: bright metallic ting.
  coin: `aevalsrc='0.5*sin(2*PI*2400*t)*exp(-9*t)+0.35*sin(2*PI*3760*t)*exp(-12*t)+0.2*sin(2*PI*5230*t)*exp(-16*t)':d=0.5:${S},afade=t=in:d=0.002[out]`,
  // Text pop.
  pop: `aevalsrc='0.6*sin(2*PI*(520*t+(480/40)*(1-exp(-40*t))))*exp(-42*t)':d=0.1:${S}[out]`,
  // Sparkle: a cluster of high bells with a slow tremolo.
  shimmer: `aevalsrc='(0.22*sin(2*PI*2093*t)+0.18*sin(2*PI*2637*t)+0.14*sin(2*PI*3136*t)+0.1*sin(2*PI*4186*t))*(0.6+0.4*sin(2*PI*11*t))*sin(PI*t/1.2)':d=1.2:${S}[out]`,
  // Water splash: a burst of filtered noise with two rising bubble blips.
  splash: `anoisesrc=d=0.7:c=pink:seed=12:a=0.9,highpass=f=500,lowpass=f=5000,afade=t=in:d=0.005,afade=t=out:st=0.03:d=0.6:curve=exp[a];aevalsrc='0.3*sin(2*PI*(900*t+400*t*t))*exp(-14*t)+0.2*sin(2*PI*(1500*t+900*t*t))*exp(-18*(t-0.08))*gte(t,0.08)':d=0.5:${S}[b];[a][b]amix=inputs=2:normalize=0,alimiter=limit=0.9[out]`,
};

const main = async () => {
  for (const [name, file] of Object.entries(SFX) as [SfxName, string][]) {
    const output = path.join(PUBLIC_DIR, file);
    mkdirSync(path.dirname(output), { recursive: true });
    const { code, stderr } = await run(
      "ffmpeg",
      [
        "-hide_banner",
        "-y",
        "-filter_complex",
        RECIPES[name],
        "-map",
        "[out]",
        "-ar",
        String(SAMPLE_RATE),
        "-ac",
        "1",
        "-c:a",
        "pcm_s16le",
        output,
      ],
      { capture: true },
    );
    if (code !== 0) {
      throw new ScriptError(
        `ffmpeg failed on ${name}\n${stderr.trim().split("\n").slice(-4).join("\n")}`,
      );
    }
    console.log(`wrote ${rel(output)}`);
  }
};

runMain(main);
