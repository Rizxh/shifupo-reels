// Live 3D worlds of the music video format (MvReel). A music video world
// gets the current shot name and its progress instead of cue-word events:
// the song's lyric table drives everything.

import type { ShotSpec } from "../../../core/three/rig";
import type { LookConfig } from "../../../core/three/Stage3D";
import { RukoWorld, type ShotState } from "./ruko";
import { RUKO_LOOK, RUKO_SHOTS } from "./rukoConfig";
import { Ruko2D } from "../worlds2d/Ruko2D";
import { C2, RUKO2D_SHOTS } from "../worlds2d/ruko2dConfig";

export type { ShotState };

// "3d": a React Three Fiber world on the Stage3D (camera from `shots`).
// "2d": an SVG world that draws its own camera (Motion Format paper cartoon).
export type MvWorldDef =
  | { kind: "3d"; Component: React.FC<{ s: ShotState }>; shots: Record<string, ShotSpec>; look: LookConfig }
  | { kind: "2d"; Component: React.FC<{ s: ShotState }>; shots: readonly string[]; background: string };

export const MV_WORLDS: Record<string, MvWorldDef> = {
  ruko: { kind: "3d", Component: RukoWorld, shots: RUKO_SHOTS, look: RUKO_LOOK },
  ruko2d: { kind: "2d", Component: Ruko2D, shots: RUKO2D_SHOTS, background: C2.sky[1] },
};
