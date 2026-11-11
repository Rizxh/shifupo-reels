// The pop-out reel (docs/sp02/PLAN.md): a lacquer frame that never cuts,
// worlds that change inside its window, and objects that break out of it
// toward the viewer. Layer order, back to front:
//   paper -> frame shadow -> inside (clipped by the window) -> frame
//   -> front objects -> front petals -> HTML overlay -> captions

import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  getRemotionEnvironment,
  random,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Paper } from "../components/Background";
import { inkBlotPath } from "../components/Fx";
import { FrameShadow, PopFrame, windowPath } from "../components/Pop";
import { Caption } from "../components/Text";
import { COLORS, HEADLINE, INK_WIPE, SAFE_AREA, VIDEO } from "../lib/brand";
import { MIX } from "../lib/mix";
import {
  SFX,
  SFX_MIX,
  TICK_EVERY_FRAMES,
  WHOOSH_PEAK_SECONDS,
  type SfxName,
} from "../lib/sfx";
import { cameraAt, WINDOW } from "../lib/space";
import { cueFrame, type Beat } from "../lib/timeline";
import type { PopReelProps, PopScene } from "../schema";
import {
  chartCrossing,
  FrontPetals,
  leapCrossing,
  popKicks,
  popLayers,
} from "../scenes/PopScenes";

// Radius of the ink blot that changes the world inside the window.
const WIPE_RADIUS = 700;
// Front objects of a scene keep flying this long after the scene ends.
const FRONT_TAIL = 24;
// Width of the ink edge around a window wipe.
const WIPE_EDGE = 18;

type Hit = { name: SfxName; at: number; gain?: number };

const cueOf = (scene: PopScene, beat: Beat) => (word: string) =>
  cueFrame(beat, scene.vo, word);

// Sound effects on the same frames as the picture events.
const popHits = (scenes: PopScene[], beats: Beat[], fps: number): Hit[] => {
  const hits: Hit[] = [];
  const text = (f: number) => f - HEADLINE.leadFrames;
  const whooshPeakAt = (f: number) => f - Math.round(WHOOSH_PEAK_SECONDS * fps);
  scenes.forEach((scene, i) => {
    const beat = beats[i];
    const cue = cueOf(scene, beat);
    if (i > 0) {
      hits.push({ name: "whoosh", at: whooshPeakAt(beat.startFrame + 8) });
    }
    switch (scene.type) {
      case "chart": {
        const cross = chartCrossing(scene, cue);
        hits.push({ name: "gong", at: 0, gain: 0.7 });
        hits.push({ name: "thump", at: text(cue(scene.lines[0].cueWord)) });
        hits.push({ name: "pop", at: text(cue(scene.lines[1].cueWord)) });
        hits.push({ name: "whoosh", at: whooshPeakAt(cross + 4), gain: 1.2 });
        hits.push({ name: "stamp", at: cross + 14, gain: 0.9 });
        break;
      }
      case "leap": {
        const cross = leapCrossing(scene, beat.startFrame, cue);
        hits.push({ name: "gong", at: 0, gain: 0.7 });
        hits.push({ name: "thump", at: text(cue(scene.lines[0].cueWord)) });
        hits.push({ name: "pop", at: text(cue(scene.lines[1].cueWord)) });
        hits.push({ name: "whoosh", at: whooshPeakAt(cross + 4), gain: 1.2 });
        hits.push({ name: "splash", at: cross });
        break;
      }
      case "turn": {
        const lock = cue(scene.lockCueWord);
        for (
          let f = beat.startFrame + 6;
          f < lock - 2;
          f += TICK_EVERY_FRAMES
        ) {
          hits.push({
            name: "tick",
            at: f,
            gain: 0.7 + random(`pop-tick${f}`) * 0.3,
          });
        }
        hits.push({ name: "whoosh", at: whooshPeakAt(lock - 4) });
        hits.push({ name: "lock", at: lock });
        hits.push({ name: "shimmer", at: lock + 3, gain: 0.8 });
        hits.push({ name: "pop", at: text(cue(scene.lines[0].cueWord)) });
        break;
      }
      case "count": {
        const c = cue(scene.count.cueWord);
        hits.push({ name: "thump", at: c - 2, gain: 0.8 });
        for (let k = 0; k < 10; k++) {
          hits.push({
            name: "coin",
            at: c + 6 + k * 3 + Math.floor(random(`pop-coin${k}`) * 3),
            gain: 0.6 + random(`pop-cg${k}`) * 0.4,
          });
        }
        hits.push({ name: "shimmer", at: c + 18 });
        break;
      }
      case "cta": {
        const btn = cue(scene.button.cueWord);
        hits.push({
          name: "chime2",
          at: cue(scene.shifuCueWord) + 10,
        });
        hits.push({ name: "pop", at: btn - 3, gain: 1.2 });
        hits.push({ name: "chime3", at: btn + 6 });
        break;
      }
    }
  });
  return hits.filter((h) => h.at >= 0);
};

const SafeArea: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: SAFE_AREA.x,
      top: SAFE_AREA.y,
      width: SAFE_AREA.width,
      height: SAFE_AREA.height,
      outline: `4px dashed ${COLORS.seal}`,
    }}
  />
);

export const PopReel: React.FC<PopReelProps> = ({
  scenes,
  beats,
  brand,
  debug,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!beats) {
    return <AbsoluteFill style={{ backgroundColor: COLORS.paper }} />;
  }
  const kicks = scenes.flatMap((scene, i) =>
    popKicks(scene, beats[i].startFrame, cueOf(scene, beats[i]), fps),
  );
  const cam = cameraAt(frame, kicks);
  const layers = scenes.map((scene, i) =>
    popLayers(scene, {
      frame,
      fps,
      start: beats[i].startFrame,
      end: beats[i].endFrame,
      cue: cueOf(scene, beats[i]),
      cam,
      brand,
    }),
  );
  const last = scenes.length - 1;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <Paper />
      <svg
        width={VIDEO.width}
        height={VIDEO.height}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <clipPath id="pop-window">
            <path d={windowPath(cam)} />
          </clipPath>
          {scenes.map((scene, i) => {
            const d =
              i === 0
                ? undefined
                : inkBlotPath(
                    frame,
                    beats[i].startFrame,
                    WINDOW.cx,
                    WINDOW.cy,
                    `pop-wipe-${scene.type}`,
                    WIPE_RADIUS,
                  );
            return d ? (
              <clipPath key={scene.type} id={`pop-wipe-${scene.type}`}>
                <path d={d} />
              </clipPath>
            ) : null;
          })}
        </defs>
        <FrameShadow cam={cam} />
        <g clipPath="url(#pop-window)">
          {scenes.map((scene, i) => {
            const beat = beats[i];
            const until =
              i === last ? beat.endFrame : beat.endFrame + INK_WIPE.frames;
            if (frame < beat.startFrame || frame >= until) {
              return null;
            }
            const wiping = i > 0 && frame < beat.startFrame + INK_WIPE.frames;
            return (
              <g
                key={scene.type}
                clipPath={wiping ? `url(#pop-wipe-${scene.type})` : undefined}
              >
                {layers[i].inside}
              </g>
            );
          })}
        </g>
        {/* The ink edge of each window wipe, so it reads as ink soaking in. */}
        <g clipPath="url(#pop-window)">
          {scenes.map((scene, i) => {
            const d =
              i === 0
                ? undefined
                : inkBlotPath(
                    frame,
                    beats[i].startFrame,
                    WINDOW.cx,
                    WINDOW.cy,
                    `pop-wipe-${scene.type}`,
                    WIPE_RADIUS,
                  );
            return d ? (
              <path
                key={scene.type}
                d={d}
                fill="none"
                stroke={COLORS.ink}
                strokeWidth={WIPE_EDGE}
                strokeLinejoin="round"
                opacity={0.55}
              />
            ) : null;
          })}
        </g>
        <PopFrame cam={cam} glyph={brand.sealGlyph} />
        {scenes.map((scene, i) => {
          const beat = beats[i];
          if (frame < beat.startFrame || frame >= beat.endFrame + FRONT_TAIL) {
            return null;
          }
          return <g key={scene.type}>{layers[i].front}</g>;
        })}
        <FrontPetals cam={cam} frame={frame} />
      </svg>
      {scenes.map((scene, i) => (
        <AbsoluteFill key={scene.type}>{layers[i].overlay}</AbsoluteFill>
      ))}
      {scenes.map((scene, i) => {
        const beat = beats[i];
        return (
          <Sequence
            key={`cap-${scene.type}`}
            from={beat.startFrame}
            durationInFrames={beat.endFrame - beat.startFrame}
            layout="none"
            name={`Caption ${scene.type}`}
          >
            <Caption
              words={beat.words.map((w) => ({
                text: w.text,
                startFrame: w.startFrame - beat.startFrame,
                endFrame: w.endFrame - beat.startFrame,
              }))}
              highlight={scene.voHighlight}
            />
          </Sequence>
        );
      })}
      {beats.map((beat, i) =>
        beat.voSrc ? (
          <Sequence
            key={beat.voSrc}
            from={beat.voStartFrame}
            layout="none"
            name={`VO ${scenes[i].type}`}
          >
            <Audio
              src={staticFile(beat.voSrc)}
              volume={MIX.vo * (beat.voGain ?? 1)}
            />
          </Sequence>
        ) : null,
      )}
      {popHits(scenes, beats, fps).map((hit, i) => (
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
      {debug && getRemotionEnvironment().isStudio ? <SafeArea /> : null}
    </AbsoluteFill>
  );
};
