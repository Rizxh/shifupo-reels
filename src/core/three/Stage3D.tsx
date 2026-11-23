// Stage of the shared core for live 3D worlds: a Remotion ThreeCanvas with
// the camera driven by the rig, image-based light built from procedural
// light panels (no HDR download at render time), soft shadows and a filmic
// post stack (ambient occlusion, bloom, depth of field, AgX tone mapping).
// The product supplies the look; the world supplies the meshes.
//
// Rules (Remotion): nothing animates by itself. No useFrame animations, no
// self-animating helpers; every change comes from useCurrentFrame().

import { Environment, Lightformer } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef } from "react";
import { continueRender, delayRender, useCurrentFrame } from "remotion";
import { Bloom, DepthOfField, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ThreeCanvas } from "@remotion/three";
import { ToneMappingMode } from "postprocessing";
import { NoToneMapping, PCFShadowMap, type PerspectiveCamera, Vector3 } from "three";
import { applyCamera, NEAR_FAR, type CamState, type Vec3 } from "./rig";

export type LookConfig = {
  background: string;
  ao: { radius: number; intensity: number };
  bloom: { intensity: number; threshold: number; smoothing: number };
  // Depth of field around the shot's focus point: range in world units.
  dof: { range: number; bokehScale: number } | null;
  vignette: { offset: number; darkness: number };
  // Procedural light panels for reflections and soft fill.
  panels: readonly { color: string; intensity: number; position: Vec3; scale: readonly [number, number] }[];
};

// ThreeCanvas advances from a renderer placed BEFORE the children, and the
// post stack initializes asynchronously, so the first frame after a mount
// came out black (measured: frame 0 of a run black, later frames fine). This
// advance sits after the composer; on the first frame of a mount it holds the
// render (delayRender) for a few warm-up draws.
const WARMUP_DRAWS = 4;
const LateAdvance: React.FC = () => {
  const { advance } = useThree();
  const frame = useCurrentFrame();
  const warmed = useRef(false);
  useEffect(() => {
    if (warmed.current) {
      advance(performance.now());
      return;
    }
    const handle = delayRender("Warming up the 3D post stack");
    let n = 0;
    let raf = 0;
    const step = () => {
      advance(performance.now());
      n += 1;
      if (n < WARMUP_DRAWS) {
        raf = requestAnimationFrame(step);
      } else {
        warmed.current = true;
        continueRender(handle);
      }
    };
    step();
    return () => {
      cancelAnimationFrame(raf);
      if (!warmed.current) {
        continueRender(handle);
      }
    };
  }, [frame, advance]);
  return null;
};

const CameraDriver: React.FC<{ state: CamState }> = ({ state }) => {
  const { camera, size } = useThree();
  applyCamera(camera as PerspectiveCamera, state, size.width / size.height);
  return null;
};

// The post stack lives in a memoized component: EffectComposer rebuilds its
// effect passes whenever its children change, and fresh JSX every frame made
// it compile a new pass per frame without disposing the old one (GPU leak:
// Chrome crashed after ~80-230 frames per tab). The DOF focus is one stable
// vector mutated by Stage3D, so these children never change during a render.
const PostStack: React.FC<{ look: LookConfig; focus: Vector3 }> = memo(({ look, focus }) => (
  <>
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <N8AO aoRadius={look.ao.radius} intensity={look.ao.intensity} distanceFalloff={1} halfRes />
      {look.dof ? <DepthOfField target={focus} worldFocusRange={look.dof.range} bokehScale={look.dof.bokehScale} /> : <></>}
      <Bloom mipmapBlur intensity={look.bloom.intensity} luminanceThreshold={look.bloom.threshold} luminanceSmoothing={look.bloom.smoothing} />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Vignette offset={look.vignette.offset} darkness={look.vignette.darkness} />
      <SMAA />
    </EffectComposer>
    <LateAdvance />
  </>
));
PostStack.displayName = "PostStack";

// Memoized for the same reason as PostStack: drei's Environment re-renders
// its cube map whenever its children change.
const EnvLight: React.FC<{ look: LookConfig }> = memo(({ look }) => (
  <Environment resolution={256} frames={1}>
    {look.panels.map((p, i) => (
      <Lightformer
        key={i}
        form="rect"
        color={p.color}
        intensity={p.intensity}
        position={p.position as [number, number, number]}
        scale={[p.scale[0], p.scale[1], 1]}
        target={[0, 0, 0]}
      />
    ))}
  </Environment>
));
EnvLight.displayName = "EnvLight";

const GL = { antialias: false, toneMapping: NoToneMapping, preserveDrawingBuffer: true, powerPreference: "high-performance" } as const;
const SHADOWS = { type: PCFShadowMap } as const;

export const Stage3D: React.FC<{
  width: number;
  height: number;
  cam: CamState;
  look: LookConfig;
  children: React.ReactNode;
}> = ({ width, height, cam, look, children }) => {
  const focus = useMemo(() => new Vector3(), []);
  focus.set(cam.focus[0], cam.focus[1], cam.focus[2]);
  const initialCamera = useMemo(() => ({ fov: cam.fov, near: NEAR_FAR.near, far: NEAR_FAR.far }), []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <ThreeCanvas width={width} height={height} dpr={1} shadows={SHADOWS} gl={GL} camera={initialCamera}>
      <color attach="background" args={[look.background]} />
      <CameraDriver state={cam} />
      <EnvLight look={look} />
      {children}
      <PostStack look={look} focus={focus} />
    </ThreeCanvas>
  );
};
