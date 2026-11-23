// Continuity rules of the shared core: no empty frames between scenes.
//
// A scene's entrance animation runs `entrancePreroll` frames before its
// transition reveals it, so the reveal opens on a stage that is already
// alive. The first scene starts `firstScenePreroll` frames "before" frame 0,
// so the reel opens mid-motion (a still or empty first second is a scroll).
// Values measured against scripts/qc-motion.ts gap detection (docs/core).
export const CONTINUITY = {
  entrancePreroll: 12,
  firstScenePreroll: 16,
} as const;
