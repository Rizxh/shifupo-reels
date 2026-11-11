import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  getRemotionEnvironment,
} from "remotion";
import { Bamboo, InkMountains, Paper, Petals } from "../components/Background";
import { InkSplash, inkBlotClip } from "../components/Fx";
import { Caption } from "../components/Text";
import { COLORS, INK_WIPE, SAFE_AREA, STAGE } from "../lib/brand";
import { MIX } from "../lib/mix";
import { cueFrame, type Beat } from "../lib/timeline";
import type { ReelProps, Scene } from "../schema";
import {
  BaziScene,
  CtaScene,
  FengshuiScene,
  HookScene,
  InsightScene,
  ProofScene,
} from "../scenes/Scenes";
import { ReelSfx } from "../components/Sfx";

// Where each scene's ink wipe opens from: the point the eye is already on.
const WIPE_ORIGIN: Record<Scene["type"], { x: number; y: number }> = {
  hook: { x: STAGE.cx, y: STAGE.cy },
  insight: { x: STAGE.cx, y: STAGE.cy },
  bazi: { x: STAGE.cx, y: STAGE.cy },
  fengshui: { x: 380, y: 1100 },
  proof: { x: STAGE.cx, y: 900 },
  cta: { x: STAGE.cx, y: 560 },
};

const SceneBody: React.FC<{
  scene: Scene;
  beat: Beat;
  brand: ReelProps["brand"];
}> = ({ scene, beat, brand }) => {
  const cue = (word: string) => cueFrame(beat, scene.vo, word);
  const common = { start: beat.startFrame, end: beat.endFrame, cue };
  switch (scene.type) {
    case "hook":
      return <HookScene scene={scene} {...common} />;
    case "insight":
      return <InsightScene scene={scene} {...common} />;
    case "bazi":
      return <BaziScene scene={scene} {...common} />;
    case "fengshui":
      return <FengshuiScene scene={scene} {...common} />;
    case "proof":
      return <ProofScene scene={scene} {...common} />;
    case "cta":
      return <CtaScene scene={scene} {...common} brand={brand} />;
  }
};

// The world behind every scene: paper, mountains, bamboo, petals. It never
// cuts, so the whole reel reads as one continuous move; scenes only nudge
// its camera (travel, lift) and how much of it shows.
const World: React.FC<{ beats: Beat[]; scenes: Scene[] }> = ({
  beats,
  scenes,
}) => {
  const frame = useCurrentFrame();
  const at = (type: Scene["type"]) =>
    beats[scenes.findIndex((s) => s.type === type)]?.startFrame ?? 0;
  const keys = [
    0,
    at("insight"),
    at("bazi"),
    at("fengshui"),
    at("proof"),
    at("cta"),
  ];
  const lift = interpolate(frame, keys, [0, -40, 90, 140, 40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mountains = interpolate(frame, keys, [1, 0.9, 0.85, 0.45, 0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      <Paper />
      <InkMountains parallax={frame * 1.2} lift={lift} opacity={mountains} />
      <Bamboo opacity={0.9} />
      <Petals />
    </>
  );
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

export const Reel: React.FC<ReelProps> = ({ scenes, beats, brand, debug }) => {
  const frame = useCurrentFrame();
  if (!beats) {
    return <AbsoluteFill style={{ backgroundColor: COLORS.paper }} />;
  }
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <World beats={beats} scenes={scenes} />
      {scenes.map((scene, i) => {
        const beat = beats[i];
        const last = i === scenes.length - 1;
        const visibleUntil = last
          ? beat.endFrame
          : beat.endFrame + INK_WIPE.frames;
        if (frame < beat.startFrame || frame >= visibleUntil) {
          return null;
        }
        const origin = WIPE_ORIGIN[scene.type];
        const clip =
          i === 0
            ? undefined
            : inkBlotClip(
                frame,
                beat.startFrame,
                origin.x,
                origin.y,
                `wipe-${scene.type}`,
              );
        const fadeOut = last
          ? 1
          : interpolate(frame, [beat.endFrame, visibleUntil], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
        return (
          <AbsoluteFill
            key={scene.type}
            style={{ clipPath: clip, opacity: fadeOut }}
          >
            <SceneBody scene={scene} beat={beat} brand={brand} />
          </AbsoluteFill>
        );
      })}
      {scenes.map((scene, i) =>
        i === 0 ? null : (
          <InkSplash
            key={`splash-${scene.type}`}
            cx={WIPE_ORIGIN[scene.type].x}
            cy={WIPE_ORIGIN[scene.type].y}
            start={beats[i].startFrame}
            seed={`splash-${scene.type}`}
          />
        ),
      )}
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
      <ReelSfx scenes={scenes} beats={beats} />
      {debug && getRemotionEnvironment().isStudio ? <SafeArea /> : null}
    </AbsoluteFill>
  );
};
