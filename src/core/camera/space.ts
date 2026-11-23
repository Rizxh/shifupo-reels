// A small 3D camera for frame-based "pop-out" shots. World units are screen
// pixels on the frame plane z = 0; +z points toward the viewer. Everything
// that should read as one space goes through `project`.
//
// Product-agnostic: `createSpace(config)` binds the frame geometry and look
// (focal length, sway, recoil, shadow, depth of field) of one product.

import { drift } from "../motion/motion";

export type Camera = {
  cx: number;
  cy: number;
  focal: number;
  yaw: number;
  pitch: number;
  // Extra depth added to every point: negative pushes the world away.
  dolly: number;
};

export type Point = { x: number; y: number };
export type Projected = Point & { k: number; z: number };
type Rect = { left: number; top: number; right: number; bottom: number };

export type SpaceConfig = {
  video: { width: number; height: number };
  frame: { x: number; y: number; width: number; height: number; border: number };
  focal: number;
  sway: { yawDeg: number; pitchDeg: number };
  kickDolly: number;
  kickFrames: number;
  shadow: { dx: number; dy: number; blur: number; opacity: number };
  dofFromScale: number;
  dofBlurPerScale: number;
  nearFade: { from: number; to: number };
};

const DEG = Math.PI / 180;

export const project = (cam: Camera, x: number, y: number, z: number): Projected => {
  let dx = x - cam.cx;
  let dy = y - cam.cy;
  let dz = z + cam.dolly;
  const cyaw = Math.cos(cam.yaw);
  const syaw = Math.sin(cam.yaw);
  [dx, dz] = [dx * cyaw - dz * syaw, dx * syaw + dz * cyaw];
  const cp = Math.cos(cam.pitch);
  const sp = Math.sin(cam.pitch);
  [dy, dz] = [dy * cp - dz * sp, dy * sp + dz * cp];
  const k = cam.focal / Math.max(1, cam.focal - dz);
  return { x: cam.cx + dx * k, y: cam.cy + dy * k, k, z: dz };
};

// SVG transform that puts a drawing made around (0, 0) at a world point.
export const placeAt = (p: Projected, scale = 1, rotateDeg = 0): string =>
  `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${rotateDeg.toFixed(2)}) scale(${(p.k * scale).toFixed(4)})`;

// Corners of a rectangle on a plane at depth z, projected (clockwise).
export const quadAt = (cam: Camera, r: Rect, z: number): Projected[] => [
  project(cam, r.left, r.top, z),
  project(cam, r.right, r.top, z),
  project(cam, r.right, r.bottom, z),
  project(cam, r.left, r.bottom, z),
];

export const polygonPath = (pts: Point[]): string =>
  `M ${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ")} Z`;

// CSS clip-path for HTML layers.
export const cssPolygon = (pts: Point[]): string =>
  `polygon(${pts.map((p) => `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`).join(", ")})`;

export const createSpace = (cfg: SpaceConfig) => {
  // The window (inside of the frame) on the plane z = 0.
  const WINDOW = {
    cx: cfg.frame.x + cfg.frame.width / 2,
    cy: cfg.frame.y + cfg.frame.height / 2,
    left: cfg.frame.x + cfg.frame.border,
    right: cfg.frame.x + cfg.frame.width - cfg.frame.border,
    top: cfg.frame.y + cfg.frame.border,
    bottom: cfg.frame.y + cfg.frame.height - cfg.frame.border,
  } as const;

  const FRAME_OUTER = {
    left: cfg.frame.x,
    right: cfg.frame.x + cfg.frame.width,
    top: cfg.frame.y,
    bottom: cfg.frame.y + cfg.frame.height,
  } as const;

  // One pull-back of the camera: out fast, settle slowly. 0 outside.
  const kick = (frame: number, at: number): number => {
    const t = (frame - at) / cfg.kickFrames;
    if (t < 0 || t > 1) {
      return 0;
    }
    return Math.sin(Math.min(1, t * 3) * (Math.PI / 2)) * (1 - t) ** 2;
  };

  // The camera at a frame: a slow organic sway, plus a recoil at every frame
  // in `kicks` (the moments something breaks out of the frame).
  const cameraAt = (frame: number, kicks: number[]): Camera => ({
    cx: WINDOW.cx,
    cy: WINDOW.cy,
    focal: cfg.focal,
    yaw: drift("cam-yaw", frame, 0.006) * cfg.sway.yawDeg * DEG,
    pitch: drift("cam-pitch", frame, 0.005) * cfg.sway.pitchDeg * DEG,
    dolly: -kicks.reduce((sum, at) => sum + kick(frame, at), 0) * cfg.kickDolly,
  });

  // Where the shadow of a point at height z lands on the frame plane, and how
  // soft and dark it is. Null for points behind the plane.
  const shadowOf = (cam: Camera, x: number, y: number, z: number) => {
    if (z <= 0) {
      return null;
    }
    const p = project(cam, x + z * cfg.shadow.dx, y + z * cfg.shadow.dy, 0);
    const fade = Math.max(0, 1 - z / cfg.nearFade.to);
    return {
      p,
      blur: 2 + z * cfg.shadow.blur,
      opacity: cfg.shadow.opacity * fade,
    };
  };

  // Depth of field and near fade for an object at projected scale k / depth z.
  const nearLook = (p: Projected) => {
    const blur = Math.max(0, (p.k - cfg.dofFromScale) * cfg.dofBlurPerScale);
    const t = (p.z - cfg.nearFade.from) / (cfg.nearFade.to - cfg.nearFade.from);
    return { blur, opacity: 1 - Math.min(1, Math.max(0, t)) };
  };

  // The screen above the line through a and b, as a polygon reaching the
  // screen edges: the part of something leaning out over the window sill
  // that is in front of the frame.
  const aboveLine = (a: Point, b: Point): Point[] => {
    const slope = (b.y - a.y) / (b.x - a.x);
    const yAt = (x: number) => a.y + (x - a.x) * slope;
    return [
      { x: 0, y: 0 },
      { x: cfg.video.width, y: 0 },
      { x: cfg.video.width, y: yAt(cfg.video.width) },
      { x: 0, y: yAt(0) },
    ];
  };

  return { WINDOW, FRAME_OUTER, cameraAt, shadowOf, nearLook, aboveLine };
};
