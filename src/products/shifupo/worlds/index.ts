// Live 3D worlds of Shifu Po reels (cinema format, episode `world`). Each
// world brings its meshes, one camera per shot name, its film look, the
// story events it understands, the anchors marks can pin to and the sounds
// its physics makes.

import type { ShotSpec, Vec3 } from "../../../core/three/rig";
import type { LookConfig } from "../../../core/three/Stage3D";
import type { SfxName } from "../sfx";
import { OfficeWorld, officeAnchor, officeSounds, type Ev } from "./office";
import { OFFICE_EVENTS, OFFICE_LOOK, OFFICE_SHOTS } from "./officeConfig";

export type { Ev };

export type WorldDef = {
  Component: React.FC<{ frame: number; ev: Ev }>;
  shots: Record<string, ShotSpec>;
  look: LookConfig;
  events: readonly string[];
  anchor: (name: string, frame: number, ev: Ev) => { pos: Vec3; radius: number } | null;
  anchors: readonly string[];
  sounds: (ev: Ev) => { frame: number; sound: SfxName; gain: number }[];
};

export const WORLDS: Record<string, WorldDef> = {
  office: {
    Component: OfficeWorld,
    shots: OFFICE_SHOTS,
    look: OFFICE_LOOK,
    events: OFFICE_EVENTS,
    anchor: officeAnchor,
    anchors: ["door", "doorway", "chair-back", "coin-exit", "desk"],
    sounds: officeSounds,
  },
};
