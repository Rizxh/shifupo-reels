import { Audio } from "@remotion/media";
import { random, Sequence, staticFile, useVideoConfig } from "remotion";
import { HEADLINE } from "../lib/brand";
import {
  SFX,
  SFX_MIX,
  TICK_EVERY_FRAMES,
  WHOOSH_PEAK_SECONDS,
  type SfxName,
} from "../lib/sfx";
import { cueFrame, type Beat } from "../lib/timeline";
import type { Scene } from "../schema";

type Hit = { name: SfxName; at: number; gain?: number };

// Every sound effect of the reel, each on the frame of the picture or text
// event it belongs to (the same cue frames the scenes use).
const hitsFor = (scenes: Scene[], beats: Beat[], fps: number): Hit[] => {
  const hits: Hit[] = [];
  const text = (f: number) => f - HEADLINE.leadFrames;
  scenes.forEach((scene, i) => {
    const beat = beats[i];
    const cue = (w: string) => cueFrame(beat, scene.vo, w);
    if (i > 0) {
      hits.push({
        name: "whoosh",
        at: beat.startFrame + Math.round(8 - WHOOSH_PEAK_SECONDS * fps),
      });
    }
    switch (scene.type) {
      case "hook":
        hits.push({ name: "gong", at: 0, gain: 0.8 });
        hits.push({ name: "thump", at: text(cue(scene.lines[0].cueWord)) });
        hits.push({ name: "pop", at: text(cue(scene.lines[1].cueWord)) });
        break;
      case "insight": {
        const lock = cue(scene.lockCueWord);
        for (
          let f = beat.startFrame + 6;
          f < lock - 2;
          f += TICK_EVERY_FRAMES
        ) {
          hits.push({
            name: "tick",
            at: f,
            gain: 0.7 + random(`tick${f}`) * 0.3,
          });
        }
        hits.push({ name: "lock", at: lock });
        hits.push({ name: "shimmer", at: lock + 3, gain: 0.7 });
        hits.push({ name: "pop", at: text(cue(scene.lines[0].cueWord)) });
        break;
      }
      case "bazi":
        hits.push({
          name: "gong",
          at: text(cue(scene.title.cueWord)),
          gain: 0.6,
        });
        scene.pillars.forEach((p, k) => {
          hits.push({
            name: `chime${k + 1}` as SfxName,
            at: cue(p.cueWord) - 1,
          });
        });
        break;
      case "fengshui":
        hits.push({ name: "shimmer", at: cue(scene.title.cueWord) });
        hits.push({ name: "stamp", at: cue(scene.stamp.cueWord) - 1 });
        break;
      case "proof": {
        const c = cue(scene.count.cueWord);
        for (let k = 0; k < 9; k++) {
          hits.push({
            name: "coin",
            at: c + 10 + k * 3 + Math.floor(random(`coin${k}`) * 3),
            gain: 0.6 + random(`cg${k}`) * 0.4,
          });
        }
        hits.push({ name: "shimmer", at: c + 22 });
        break;
      }
      case "cta":
        hits.push({ name: "gong", at: beat.startFrame + 2, gain: 0.7 });
        hits.push({
          name: "pop",
          at: cue(scene.button.cueWord) - 3,
          gain: 1.2,
        });
        hits.push({ name: "chime3", at: text(cue(scene.tagline.cueWord)) });
        break;
    }
  });
  return hits.filter((h) => h.at >= 0);
};

export const ReelSfx: React.FC<{ scenes: Scene[]; beats: Beat[] }> = ({
  scenes,
  beats,
}) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {hitsFor(scenes, beats, fps).map((hit, i) => (
        <Sequence
          key={`${hit.name}-${hit.at}-${i}`}
          from={hit.at}
          layout="none"
          name={`SFX ${hit.name}`}
        >
          <Audio
            src={staticFile(SFX[hit.name])}
            volume={SFX_MIX[hit.name] * (hit.gain ?? 1)}
          />
        </Sequence>
      ))}
    </>
  );
};
