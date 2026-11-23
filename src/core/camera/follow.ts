// Focus-follow camera for 2D/2.5D shots: the camera keeps a subject at a
// framing point while zooming, the way the Motion Format engine tracks
// (fx, fy, z). Background layers move by their depth (parallax), each with
// its own reduced zoom, so the world reads as layered space.

export type FollowCam = {
  // World point the camera looks at (subject plane coordinates).
  fx: number;
  fy: number;
  // Zoom on the subject plane (1 = none).
  z: number;
  // Roll in degrees (dutch angle), optional.
  roll?: number;
};

export type FrameSize = { width: number; height: number };

// Where the focus point sits on screen, as a share of the frame.
export type Framing = { sx: number; sy: number };
export const CENTER: Framing = { sx: 0.5, sy: 0.5 };

// CSS transform (use with transform-origin: 0 0) for a layer at `depth`:
// 1 = subject plane, 0 = infinitely far (never moves), > 1 = foreground.
// A layer's zoom and its share of the pan both scale with depth.
export const layerTransform = (cam: FollowCam, depth: number, size: FrameSize, framing: Framing = CENTER): string => {
  const cx = size.width / 2;
  const cy = size.height / 2;
  const zs = 1 + (cam.z - 1) * depth;
  const fx = cx + (cam.fx - cx) * depth;
  const fy = cy + (cam.fy - cy) * depth;
  const tx = size.width * framing.sx - fx * zs;
  const ty = size.height * framing.sy - fy * zs;
  const roll = cam.roll ? ` rotate(${(cam.roll * Math.min(1, depth)).toFixed(3)}deg)` : "";
  return `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zs.toFixed(4)})${roll}`;
};
