// Live 3D world layers of the cinema format (episode `world`): one continuous
// stage for the whole reel (the camera travels between beats, no cuts), the
// hand-drawn marks pinned to world anchors, and the sounds the world's
// physics makes. Event and mark timing come from cue words in the episode.

import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { NoteArrow, ScribbleCircle, Stamp } from "../core/fx/marks";
import { projectToScreen, reelCamera, travelStart, type CamState } from "../core/three/rig";
import { Stage3D } from "../core/three/Stage3D";
import { MARK_STYLE, SAFE_AREA, VIDEO } from "../lib/brand";
import { cueFrame, type Beat } from "../lib/timeline";
import { SFX, SFX_MIX } from "../lib/sfx";
import { WORLDS, type Ev, type WorldDef } from "../products/shifupo/worlds";
import type { CinemaScene } from "../schema";

export const worldOf = (name: string | undefined): WorldDef | undefined => (name ? WORLDS[name] : undefined);

export const worldEvents = (scenes: readonly CinemaScene[], beats: readonly Beat[]): Ev => {
  const ev: Ev = {};
  scenes.forEach((s, i) => {
    for (const e of s.events) {
      ev[e.name] = cueFrame(beats[i], s.vo, e.cueWord);
    }
  });
  return ev;
};

const shotsOf = (world: WorldDef, scenes: readonly CinemaScene[]) =>
  scenes.map((s) => world.shots[s.shot] ?? Object.values(world.shots)[0]);

const camAt = (world: WorldDef, scenes: readonly CinemaScene[], beats: readonly Beat[]) => {
  const shots = shotsOf(world, scenes);
  return (f: number): CamState => reelCamera(f, beats, shots);
};

export const WorldStage: React.FC<{ world: WorldDef; scenes: CinemaScene[]; beats: Beat[] }> = ({ world, scenes, beats }) => {
  const frame = useCurrentFrame();
  const ev = worldEvents(scenes, beats);
  const cam = camAt(world, scenes, beats)(frame);
  const W = world.Component;
  // Set by scripts/render.ts for the audio-only pass: no WebGL needed there.
  if (process.env.REMOTION_AUDIO_ONLY) {
    return null;
  }
  return (
    <AbsoluteFill>
      <Stage3D width={VIDEO.width} height={VIDEO.height} cam={cam} look={world.look}>
        <W frame={frame} ev={ev} />
      </Stage3D>
    </AbsoluteFill>
  );
};

// Titles occupy the top of the safe area; marks keep notes below this line.
const TITLE_BAND_BOTTOM = SAFE_AREA.y + 380;

const clampX = (x: number, m: number) => Math.min(SAFE_AREA.x + SAFE_AREA.width - m, Math.max(SAFE_AREA.x + m, x));
const clampY = (y: number, m: number) => Math.min(SAFE_AREA.y + SAFE_AREA.height - m, Math.max(SAFE_AREA.y + m, y));

export const WorldMarks: React.FC<{ world: WorldDef; scenes: CinemaScene[]; beats: Beat[] }> = ({ world, scenes, beats }) => {
  const frame = useCurrentFrame();
  const ev = worldEvents(scenes, beats);
  const cam = camAt(world, scenes, beats)(frame);
  const { width, height } = VIDEO;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={width} height={height}>
        {scenes.flatMap((s, i) =>
          s.marks.map((m, k) => {
            const beat = beats[i];
            const cue = cueFrame(beat, s.vo, m.cueWord);
            // Marks leave when the camera starts travelling to the next shot,
            // so they never slide across the frame with their anchor.
            const out = Math.max(cue + MARK_STYLE.drawFrames + MARK_STYLE.fadeFrames, travelStart(i, beats, shotsOf(world, scenes)));
            if (frame < cue || frame >= out) {
              return null;
            }
            const a = world.anchor(m.anchor, frame, ev);
            const p = a ? projectToScreen(cam, a.pos, width, height) : null;
            if (!a || !p) {
              return null;
            }
            const key = `mark-${i}-${k}`;
            const common = { frame, cue, out, style: MARK_STYLE };
            if (m.kind === "circle") {
              const top = projectToScreen(cam, [a.pos[0], a.pos[1] + a.radius, a.pos[2]], width, height);
              const r = Math.min(380, Math.max(90, top ? Math.abs(top.y - p.y) * 1.2 : 120));
              return <ScribbleCircle key={key} {...common} x={p.x} y={p.y} rx={r} ry={r * 0.82} seed={key} />;
            }
            if (m.kind === "arrow") {
              const side = p.x < width / 2 ? 1 : -1;
              // Notes stay out of the title band: above the target when there
              // is room, otherwise below it.
              const above = p.y - 330 > TITLE_BAND_BOTTOM;
              const from = { x: clampX(p.x + side * 300, 150), y: clampY(above ? p.y - 330 : p.y + 300, 90) };
              return <NoteArrow key={key} {...common} from={from} to={{ x: p.x, y: p.y }} text={m.text} />;
            }
            return <Stamp key={key} {...common} x={clampX(p.x, 260)} y={clampY(p.y, 120)} text={m.text ?? ""} />;
          }),
        )}
      </svg>
    </AbsoluteFill>
  );
};

export const WorldSounds: React.FC<{ world: WorldDef; scenes: CinemaScene[]; beats: Beat[] }> = ({ world, scenes, beats }) => {
  const ev = worldEvents(scenes, beats);
  return (
    <>
      {world.sounds(ev).map((s, i) => (
        <Sequence key={`ws-${i}`} from={Math.max(0, s.frame)} layout="none">
          <Audio src={staticFile(SFX[s.sound])} volume={SFX_MIX[s.sound] * s.gain} />
        </Sequence>
      ))}
    </>
  );
};
