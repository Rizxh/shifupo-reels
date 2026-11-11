// The four scenes of the pop-out format (docs/sp02/PLAN.md). Each scene
// draws into three layers that PopReel stacks around the frame:
//   inside  - behind the frame plane, clipped by the window
//   front   - in front of the frame plane, over the frame
//   overlay - HTML on top (headlines, projected count and button)

import { evolvePath } from "@remotion/paths";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Sparkles } from "../components/Fx";
import {
  BlurFilter,
  CoinBurst,
  FrontPetals,
  GoldRoomInside,
  Arrow,
  PhotoInside,
  Ingot,
  KoiAt,
  MountainsInside,
  Needle,
  PondInside,
  Ripples,
  Splash,
} from "../components/Pop";
import { Luopan } from "../components/Luopan";
import { RobedFigure } from "../components/Shifu";
import { WhatsAppButton } from "../components/Brand";
import { HeadlineLine, HeadlineStack, Kicker } from "../components/Text";
import { hasStaticFile } from "../lib/assets";
import { COLORS, FONTS, HEADLINE, POP, SAFE_AREA, SHIFU } from "../lib/brand";
import {
  breathe,
  clamp01,
  drift,
  EASE,
  lerp,
  prog,
  SPRING,
  springAt,
} from "../lib/motion";
import {
  aboveLine,
  cssPolygon,
  nearLook,
  placeAt,
  polygonPath,
  project,
  quadAt,
  shadowOf,
  WINDOW,
  type Camera,
} from "../lib/space";
import type { PopReelProps, PopScene, PopSceneOf } from "../schema";

export type PopCtx = {
  frame: number;
  fps: number;
  start: number;
  end: number;
  cue: (word: string) => number;
  cam: Camera;
  brand: PopReelProps["brand"];
};

export type Layers = {
  inside: React.ReactNode;
  front: React.ReactNode;
  overlay: React.ReactNode;
};

// Frames before the end of a scene where its exit move starts.
const EXIT_LEAD = 14;
const DEG = 180 / Math.PI;

// Wrapper for HTML that sits on a plane at depth z: points of that plane map
// to the screen through the camera (translate + scale about the window).
const planeStyle = (cam: Camera, z: number): React.CSSProperties => {
  const p = project(cam, WINDOW.cx, WINDOW.cy, z);
  return {
    position: "absolute",
    left: 0,
    top: 0,
    transformOrigin: "0 0",
    transform: `translate(${(p.x - WINDOW.cx * p.k).toFixed(2)}px, ${(p.y - WINDOW.cy * p.k).toFixed(2)}px) scale(${p.k.toFixed(4)})`,
  };
};

// CSS drop shadow cast on the frame plane by something at (x, y, z).
// `softness` widens and lightens it (thin shapes like text read as a
// second copy under a crisp shadow).
const dropShadow = (
  cam: Camera,
  x: number,
  y: number,
  z: number,
  softness = 1,
): string => {
  const s = shadowOf(cam, x, y, z);
  if (!s) {
    return "none";
  }
  const p = project(cam, x, y, z);
  return `drop-shadow(${(s.p.x - p.x).toFixed(1)}px ${(s.p.y - p.y).toFixed(1)}px ${(s.blur * softness).toFixed(1)}px rgba(18,16,14,${(s.opacity / softness).toFixed(3)}))`;
};

// Text shadows are this much softer than solid objects' shadows.
const TEXT_SHADOW_SOFTNESS = 2.4;

// Clip for HTML that is still behind the frame plane.
const windowClip = (cam: Camera, z: number): string | undefined =>
  z < 0 ? cssPolygon(quadAt(cam, WINDOW, 0)) : undefined;

// ---------------------------------------------------------------------------
// Chart scene: a sales line falls across a business photo inside the window,
// and on the plunge cue its arrow dives out of the frame toward the viewer.

const CHART = {
  z: -260,
  // Points as fractions of the window, left to right; it ends low (sales
  // falling) but still inside the window, where the arrow takes over.
  points: [
    [0.08, 0.32],
    [0.22, 0.24],
    [0.35, 0.36],
    [0.48, 0.3],
    [0.6, 0.46],
    [0.72, 0.52],
    [0.8, 0.62],
  ] as const,
  lineWidth: 11,
  nodeRadius: 11,
  gridLines: 4,
  photoDim: 0.42,
  arrowLength: 230,
  plungeLead: 4,
  plungeFrames: 24,
  // The arrow first shoots toward the viewer (depth eases out), then falls
  // out of the bottom of the screen (height eases in, like gravity).
  plungeTo: { x: WINDOW.cx - 40, y: 1900 },
  plungeZ: 700,
  // Below this many px of motion per frame the arrow keeps the heading of
  // the chart's last segment instead of a jittery motion direction.
  headingMinSpeed: 6,
} as const;

const chartPoint = (i: number) => ({
  x: WINDOW.left + CHART.points[i][0] * (WINDOW.right - WINDOW.left),
  y: WINDOW.top + CHART.points[i][1] * (WINDOW.bottom - WINDOW.top),
});

const arrowWorld = (f: number, plungeAt: number) => {
  const from = chartPoint(CHART.points.length - 1);
  const t = prog(
    f,
    plungeAt - CHART.plungeLead,
    plungeAt - CHART.plungeLead + CHART.plungeFrames,
    (v) => v,
  );
  const fall = EASE.in(t);
  return {
    x: lerp(from.x, CHART.plungeTo.x, fall),
    y: lerp(from.y, CHART.plungeTo.y, fall),
    z: lerp(CHART.z, CHART.plungeZ, EASE.out(t)),
  };
};

const arrowCrossing = (plungeAt: number): number => {
  const from = plungeAt - CHART.plungeLead;
  for (let f = from; f <= from + CHART.plungeFrames; f++) {
    if (arrowWorld(f, plungeAt).z >= 0) {
      return f;
    }
  }
  return plungeAt;
};

const chartLayers = (scene: PopSceneOf<"chart">, ctx: PopCtx): Layers => {
  const { frame, start, end, cue, cam } = ctx;
  const plungeAt = cue(scene.plungeCueWord);
  const pts = CHART.points.map((_, i) => {
    const w = chartPoint(i);
    return project(cam, w.x, w.y, CHART.z);
  });
  const d = `M ${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ")}`;
  const drawn = prog(frame, start + 4, plungeAt - CHART.plungeLead, EASE.inOut);
  const evolved = evolvePath(drawn, d);
  const grid = Array.from({ length: CHART.gridLines }, (_, i) => {
    const y =
      WINDOW.top +
      ((i + 1) / (CHART.gridLines + 1)) * (WINDOW.bottom - WINDOW.top);
    const a = project(cam, WINDOW.left, y, CHART.z);
    const b = project(cam, WINDOW.right, y, CHART.z);
    return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  });

  const w = arrowWorld(frame, plungeAt);
  const p = project(cam, w.x, w.y, w.z);
  const nextW = arrowWorld(frame + 2, plungeAt);
  const q = project(cam, nextW.x, nextW.y, nextW.z);
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  const moving = frame >= plungeAt - CHART.plungeLead;
  const speed = Math.hypot(q.x - p.x, q.y - p.y) / 2;
  const heading =
    (moving && speed > CHART.headingMinSpeed
      ? Math.atan2(q.y - p.y, q.x - p.x)
      : Math.atan2(last.y - prev.y, last.x - prev.x)) * DEG;
  const look = nearLook(p);
  const shadow = shadowOf(cam, w.x, w.y, w.z);
  const arrowShown = drawn >= 1 || moving;
  const arrow =
    !arrowShown || look.opacity <= 0 ? null : (
      <g>
        <defs>
          {shadow ? <BlurFilter id="arrow-sh" sd={shadow.blur} /> : null}
          {look.blur > 0 ? <BlurFilter id="arrow-dof" sd={look.blur} /> : null}
        </defs>
        {shadow ? (
          <g
            transform={placeAt(shadow.p, 1, heading)}
            opacity={shadow.opacity * look.opacity}
            filter="url(#arrow-sh)"
          >
            <Arrow length={CHART.arrowLength} color={COLORS.ink} />
          </g>
        ) : null}
        <g
          transform={placeAt(p, 1, heading)}
          opacity={look.opacity}
          filter={look.blur > 0 ? "url(#arrow-dof)" : undefined}
        >
          <Arrow length={CHART.arrowLength} color={COLORS.seal} />
        </g>
      </g>
    );

  return {
    inside: (
      <>
        {scene.photo ? (
          <PhotoInside
            cam={cam}
            frame={frame}
            start={start}
            src={scene.photo}
            dim={CHART.photoDim}
          />
        ) : (
          <GoldRoomInside cam={cam} frame={frame} />
        )}
        {grid.map((g, i) => (
          <path
            key={i}
            d={g}
            stroke={COLORS.paper}
            strokeWidth={2}
            opacity={0.28}
          />
        ))}
        <path
          d={d}
          fill="none"
          stroke={COLORS.ink}
          strokeWidth={CHART.lineWidth + 8}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={evolved.strokeDasharray}
          strokeDashoffset={evolved.strokeDashoffset}
        />
        <path
          d={d}
          fill="none"
          stroke={COLORS.gold}
          strokeWidth={CHART.lineWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={evolved.strokeDasharray}
          strokeDashoffset={evolved.strokeDashoffset}
        />
        {pts.map((pt, i) =>
          drawn >= i / (pts.length - 1) ? (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={CHART.nodeRadius * pt.k}
              fill={COLORS.goldLight}
              stroke={COLORS.ink}
              strokeWidth={4}
            />
          ) : null,
        )}
        {w.z < 0 ? arrow : null}
      </>
    ),
    front: w.z >= 0 ? arrow : null,
    overlay: (
      <HeadlineStack>
        <HeadlineLine
          text={scene.lines[0].text}
          cue={cue(scene.lines[0].cueWord)}
          out={end}
          variant="slam"
          size={POP.type.headline}
        />
        <HeadlineLine
          text={scene.lines[1].text}
          cue={cue(scene.lines[1].cueWord)}
          out={end}
          size={POP.type.headline}
          accent={scene.lines[1].text.split(" ").pop()}
        />
      </HeadlineStack>
    ),
  };
};

// The frame the chart arrow crosses the plane (for sound and camera).
export const chartCrossing = (
  scene: PopSceneOf<"chart">,
  cue: PopCtx["cue"],
): number => arrowCrossing(cue(scene.plungeCueWord));

// ---------------------------------------------------------------------------
// Scene 1: the gold koi leaps out of the night pond on the leap cue.

const KOI = {
  swimZ: -560,
  diveZ: -700,
  apexZ: 540,
  hangZ: 590,
  exitZ: 780,
  // Frames relative to the leap start (4 frames before the leap cue).
  leadFrames: 4,
  diveFrames: 12,
  burstFrames: 18,
  hangFrames: 10,
  exitFrames: 13,
  swimRadius: { x: 200, y: 84 },
  swimSpeed: 0.05,
} as const;

// Key points on the plane: launch under the water, apex in front of the
// middle of the window (kept below the headline), then out past the lower
// left of the screen.
const KOI_LAUNCH = { x: WINDOW.cx + 170, y: WINDOW.cy + 120 };
const KOI_APEX = { x: WINDOW.cx - 40, y: WINDOW.cy + 10 };
const KOI_HANG = { x: WINDOW.cx - 120, y: WINDOW.cy + 40 };
const KOI_EXIT = { x: -460, y: 1500 };

const koiSwim = (f: number, start: number) => {
  const a = (f - start) * KOI.swimSpeed + 1.4;
  return {
    x: WINDOW.cx + Math.cos(a) * KOI.swimRadius.x,
    y: WINDOW.cy + 70 + Math.sin(a) * KOI.swimRadius.y,
  };
};

const mix = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  t: number,
) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });

const koiWorld = (f: number, start: number, leapAt: number) => {
  const leap0 = leapAt - KOI.leadFrames;
  const apexAt = leap0 + KOI.burstFrames;
  const hangEnd = apexAt + KOI.hangFrames;
  if (f < leap0) {
    // Swims, then dives toward the launch point (anticipation).
    const dive = prog(f, leap0 - KOI.diveFrames, leap0, EASE.inOut);
    const p = mix(koiSwim(f, start), KOI_LAUNCH, dive);
    return { ...p, z: lerp(KOI.swimZ, KOI.diveZ, dive) };
  }
  if (f < apexAt) {
    // Bursts out fast and slows into the apex.
    const u = EASE.out(clamp01((f - leap0) / KOI.burstFrames));
    return {
      ...mix(KOI_LAUNCH, KOI_APEX, u),
      z: lerp(KOI.diveZ, KOI.apexZ, u),
    };
  }
  if (f < hangEnd) {
    // Hangs in front of the viewer for a beat.
    const u = EASE.inOut((f - apexAt) / KOI.hangFrames);
    return { ...mix(KOI_APEX, KOI_HANG, u), z: lerp(KOI.apexZ, KOI.hangZ, u) };
  }
  // Shoots past the viewer, out of the lower left of the screen.
  const u = EASE.in(clamp01((f - hangEnd) / KOI.exitFrames));
  return { ...mix(KOI_HANG, KOI_EXIT, u), z: lerp(KOI.hangZ, KOI.exitZ, u) };
};

// First frame the koi is in front of the frame plane.
const koiCrossing = (start: number, leapAt: number): number => {
  const leap0 = leapAt - KOI.leadFrames;
  for (let f = leap0; f <= leap0 + KOI.burstFrames; f++) {
    if (koiWorld(f, start, leapAt).z >= 0) {
      return f;
    }
  }
  return leapAt;
};

// Heading from the koi's motion on screen, smoothed over a few frames.
const HEADING_SPAN = 3;

const leapLayers = (scene: PopSceneOf<"leap">, ctx: PopCtx): Layers => {
  const { frame, start, end, cue, cam } = ctx;
  const leapAt = cue(scene.leapCueWord);
  const leap0 = leapAt - KOI.leadFrames;
  const cross = koiCrossing(start, leapAt);
  const w = koiWorld(frame, start, leapAt);
  const before = koiWorld(frame - HEADING_SPAN, start, leapAt);
  const after = koiWorld(frame + HEADING_SPAN, start, leapAt);
  const a = project(cam, before.x, before.y, before.z);
  const b = project(cam, after.x, after.y, after.z);
  const heading = Math.atan2(b.y - a.y, b.x - a.x) * DEG;
  const phase = frame * 0.25 + Math.max(0, frame - leap0) * 0.3;
  const koi = (
    <KoiAt
      cam={cam}
      id="leap-koi"
      x={w.x}
      y={w.y}
      z={w.z}
      heading={heading}
      phase={phase}
    />
  );
  const dive = KOI_LAUNCH;
  const splashAt = koiWorld(cross, start, leapAt);
  return {
    inside: (
      <>
        {scene.photo ? (
          <PhotoInside
            cam={cam}
            frame={frame}
            start={start}
            src={scene.photo}
          />
        ) : (
          <PondInside cam={cam} frame={frame} />
        )}
        <Ripples
          cam={cam}
          frame={frame}
          at={leap0}
          x={dive.x}
          y={dive.y}
          z={KOI.diveZ}
        />
        {w.z < 0 ? koi : null}
      </>
    ),
    front: (
      <>
        {w.z >= 0 ? koi : null}
        <Splash
          cam={cam}
          frame={frame}
          at={cross}
          x={splashAt.x}
          y={splashAt.y}
        />
      </>
    ),
    overlay: (
      <HeadlineStack>
        <HeadlineLine
          text={scene.lines[0].text}
          cue={cue(scene.lines[0].cueWord)}
          out={end}
          variant="slam"
          size={POP.type.headline}
        />
        <HeadlineLine
          text={scene.lines[1].text}
          cue={cue(scene.lines[1].cueWord)}
          out={end}
          size={POP.type.headline}
        />
      </HeadlineStack>
    ),
  };
};

// ---------------------------------------------------------------------------
// Scene 2: a luo pan rises in the misty mountains, flies out of the frame to
// face the viewer and its needle locks on the lock cue.

const LUOPAN = {
  deepZ: -700,
  outZ: 380,
  passZ: 1120,
  flatTiltDeg: 72,
  faceTiltDeg: 12,
  flyFrames: 24,
  needleLength: 190,
  // The needle settles pointing south-east.
  targetDeg: 135,
} as const;

const luopanWorld = (
  f: number,
  fps: number,
  start: number,
  end: number,
  lockAt: number,
) => {
  const rise = springAt(f, start, fps, SPRING.soft);
  const fly = prog(f, lockAt - LUOPAN.flyFrames + 2, lockAt + 2, EASE.inOut);
  const exit = prog(f, end - EXIT_LEAD, end + 12, EASE.in);
  const y =
    lerp(WINDOW.bottom + 300, WINDOW.cy + 40, rise) - fly * 40 - exit * 60;
  const z =
    lerp(LUOPAN.deepZ, LUOPAN.outZ, fly) + exit * (LUOPAN.passZ - LUOPAN.outZ);
  const tilt = lerp(LUOPAN.flatTiltDeg, LUOPAN.faceTiltDeg, fly);
  return {
    x: WINDOW.cx + drift("luopan-x", f, 0.01) * 18,
    y,
    z,
    tilt,
    rot: drift("luopan-rot", f, 0.012) * 6,
  };
};

const needleAngle = (f: number, fps: number, start: number, lockAt: number) => {
  const search = (t: number) =>
    (t - start) * 13 + drift("needle", t, 0.05) * 60;
  if (f < lockAt) {
    return search(f);
  }
  const from = search(lockAt);
  const target =
    LUOPAN.targetDeg + 360 * Math.ceil((from - LUOPAN.targetDeg) / 360);
  return lerp(from, target, springAt(f, lockAt, fps, SPRING.snap));
};

const turnLayers = (scene: PopSceneOf<"turn">, ctx: PopCtx): Layers => {
  const { frame, fps, start, end, cue, cam } = ctx;
  const lockAt = cue(scene.lockCueWord);
  const l = luopanWorld(frame, fps, start, end, lockAt);
  const p = project(cam, l.x, l.y, l.z);
  const look = nearLook(p);
  const shadow = shadowOf(cam, l.x, l.y, l.z);
  const squash = Math.cos(l.tilt / DEG);
  const radius = 318 * POP.luopanScale;
  const disc =
    look.opacity <= 0 ? null : (
      <g>
        <defs>
          {shadow ? <BlurFilter id="luopan-sh" sd={shadow.blur} /> : null}
          {look.blur > 0 ? <BlurFilter id="luopan-dof" sd={look.blur} /> : null}
        </defs>
        {shadow ? (
          <ellipse
            transform={placeAt(shadow.p, 1, l.rot)}
            rx={radius}
            ry={radius * squash}
            fill={COLORS.ink}
            opacity={shadow.opacity * look.opacity}
            filter="url(#luopan-sh)"
          />
        ) : null}
        <g
          transform={placeAt(p, 1, l.rot)}
          opacity={look.opacity}
          filter={look.blur > 0 ? "url(#luopan-dof)" : undefined}
        >
          <g transform={`scale(1 ${squash.toFixed(4)})`}>
            <g transform={`scale(${POP.luopanScale})`}>
              <Luopan start={start} id="pop-luopan" />
            </g>
            <Needle
              angle={needleAngle(frame, fps, start, lockAt)}
              length={LUOPAN.needleLength}
            />
          </g>
        </g>
      </g>
    );
  const lockP = project(cam, l.x, l.y, LUOPAN.outZ);
  return {
    inside: (
      <>
        {scene.photo ? (
          <PhotoInside
            cam={cam}
            frame={frame}
            start={start}
            src={scene.photo}
          />
        ) : (
          <MountainsInside cam={cam} frame={frame} />
        )}
        {l.z < 0 ? disc : null}
      </>
    ),
    front: l.z >= 0 ? disc : null,
    overlay: (
      <>
        <Sparkles
          cx={lockP.x}
          cy={lockP.y}
          start={lockAt}
          count={12}
          spread={300}
          frames={24}
        />
        <HeadlineStack>
          <HeadlineLine
            text={scene.lines[0].text}
            cue={cue(scene.lines[0].cueWord)}
            out={end}
            size={POP.type.headline}
          />
          <HeadlineLine
            text={scene.lines[1].text}
            cue={cue(scene.lines[1].cueWord)}
            out={end}
            size={POP.type.headline}
            accent={scene.lines[1].accent}
          />
        </HeadlineStack>
      </>
    ),
  };
};

const turnLockKick = (scene: PopSceneOf<"turn">, cue: PopCtx["cue"]) =>
  cue(scene.lockCueWord) - 6;

// ---------------------------------------------------------------------------
// Scene 3: gold coins burst out of a glowing room on the count cue, and the
// number breaks out of the frame while it counts up.

const COUNT = {
  deepZ: -520,
  outZ: 290,
  passZ: 1100,
  countFrames: 28,
  // Coins cross the frame plane about this many frames after the burst.
  crossFrames: 12,
  // The flying number fades out over this many frames at the scene end.
  fadeFrames: 6,
  // A photo behind the coins is darkened this much so the gold reads.
  photoDim: 0.35,
  y: WINDOW.cy - 10,
} as const;

const formatCount = (n: number) => new Intl.NumberFormat("id-ID").format(n);

const countLayers = (scene: PopSceneOf<"count">, ctx: PopCtx): Layers => {
  const { frame, fps, start, end, cue, cam, brand } = ctx;
  const burstAt = cue(scene.count.cueWord) - 2;
  const pop = springAt(frame, burstAt - 2, fps, SPRING.pop);
  const exit = prog(frame, end - EXIT_LEAD, end + 10, EASE.in);
  const z =
    lerp(COUNT.deepZ, COUNT.outZ, pop) + exit * (COUNT.passZ - COUNT.outZ);
  const p = project(cam, WINDOW.cx, COUNT.y, z);
  const look = nearLook(p);
  const value = Math.round(
    scene.count.value *
      EASE.out(prog(frame, burstAt, burstAt + COUNT.countFrames)),
  );
  // Gone before the next scene's picture settles, even mid-flight.
  const fade = 1 - prog(frame, end - 2, end + COUNT.fadeFrames, EASE.in);
  const opacity = look.opacity * fade;
  const shown = frame >= burstAt - 2 && opacity > 0;
  return {
    inside: (
      <>
        {scene.photo ? (
          <PhotoInside
            cam={cam}
            frame={frame}
            start={start}
            src={scene.photo}
            dim={COUNT.photoDim}
          />
        ) : (
          <GoldRoomInside cam={cam} frame={frame} />
        )}
        <Ingot cam={cam} frame={frame} start={start} burstAt={burstAt} />
        <CoinBurst cam={cam} frame={frame} at={burstAt} side="inside" />
      </>
    ),
    front: <CoinBurst cam={cam} frame={frame} at={burstAt} side="front" />,
    overlay: (
      <>
        {shown ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: windowClip(cam, z),
            }}
          >
            <div style={planeStyle(cam, z)}>
              <div
                style={{
                  position: "absolute",
                  left: WINDOW.cx,
                  top: COUNT.y,
                  transform: "translate(-50%, -50%)",
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  fontFamily: FONTS.display,
                  fontWeight: 900,
                  fontSize: POP.type.count,
                  lineHeight: 1,
                  background: `linear-gradient(180deg, ${COLORS.goldLight} 0%, ${COLORS.gold} 55%, ${COLORS.goldDeep} 100%)`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  WebkitTextStroke: `4px ${COLORS.ink}`,
                  opacity,
                  filter: `${dropShadow(cam, WINDOW.cx, COUNT.y, z, TEXT_SHADOW_SOFTNESS)}${look.blur > 0 ? ` blur(${look.blur.toFixed(1)}px)` : ""}`,
                }}
              >
                {formatCount(value)}
                {scene.count.suffix}
              </div>
            </div>
          </div>
        ) : null}
        <HeadlineStack>
          <HeadlineLine
            text={brand.name}
            cue={cue(scene.kickerCueWord)}
            out={end}
            size={POP.type.headline}
            accent={brand.name.split(" ").pop()}
          />
          <HeadlineLine
            text={scene.count.label}
            cue={cue(scene.count.cueWord)}
            out={end}
            size={POP.type.label}
          />
        </HeadlineStack>
      </>
    ),
  };
};

// ---------------------------------------------------------------------------
// Scene 4: Shifu Po rises in the window and leans out over the sill, then
// the WhatsApp button breaks out of the frame.

const LEAN = {
  insideZ: -70,
  outZ: 80,
  riseFrom: 560,
  // Height offset while still behind the plane: keeps the head under the
  // top rail until the figure is in front of it.
  hold: 160,
  riseFrames: 16,
  settleFrames: 20,
} as const;

const shifuWorld = (f: number, fps: number, enter: number) => {
  const rise = prog(f, enter, enter + LEAN.riseFrames, EASE.out);
  const lean = springAt(f, enter + LEAN.riseFrames - 4, fps, SPRING.soft);
  const settle = prog(
    f,
    enter + LEAN.riseFrames + 4,
    enter + LEAN.riseFrames + 4 + LEAN.settleFrames,
    EASE.inOut,
  );
  const yOff =
    f < enter + LEAN.riseFrames + 4
      ? lerp(LEAN.riseFrom, LEAN.hold, rise)
      : lerp(LEAN.hold, 0, settle);
  return {
    x: POP.shifu.x,
    y: POP.shifu.baseY + yOff,
    z: lerp(LEAN.insideZ, LEAN.outZ, lean),
    rot: -3 * lean + drift("shifu-sway", f, 0.01) * 1.2,
  };
};

// The figure standing on (0, 0): the cut-out photo once it exists, else the
// ink placeholder. `shadow` draws it as a soft ink shape.
const ShifuFigure: React.FC<{ fan: number; shadowFilter?: string }> = ({
  fan,
  shadowFilter,
}) => {
  const h = POP.shifu.height;
  const photo = hasStaticFile(SHIFU.photo);
  return (
    <g filter={shadowFilter}>
      {photo ? (
        <image
          href={staticFile(SHIFU.photo)}
          x={-h * 0.42}
          y={-h}
          width={h * 0.84}
          height={h}
          preserveAspectRatio="xMidYMax meet"
        />
      ) : (
        <g transform={`scale(${h / 960})`}>
          <RobedFigure fan={fan} />
        </g>
      )}
    </g>
  );
};

// The official logo in the headline column: rises out of a blur with a
// small overshoot, then breathes.
const BrandLogo: React.FC<{ src: string; start: number }> = ({
  src,
  start,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = springAt(frame, start, fps, SPRING.pop);
  if (frame < start) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE_AREA.x,
        top: HEADLINE.top,
        width: POP.logoWidth,
        opacity: Math.min(1, t * 1.5),
        transform: `translateY(${((1 - t) * 40).toFixed(1)}px) scale(${breathe(frame, fps, 0.008).toFixed(4)})`,
        transformOrigin: "0% 50%",
        filter: `blur(${(Math.max(0, 1 - t * 1.4) * 10).toFixed(1)}px)`,
      }}
    >
      <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
    </div>
  );
};

const ctaLayers = (scene: PopSceneOf<"cta">, ctx: PopCtx): Layers => {
  const { frame, fps, start, cue, cam, brand } = ctx;
  const enter = cue(scene.shifuCueWord) - HEADLINE.leadFrames;
  const s = shifuWorld(frame, fps, enter);
  const p = project(cam, s.x, s.y, s.z);
  const sill = quadAt(cam, WINDOW, 0);
  const shadow = shadowOf(cam, s.x, s.y, s.z);
  const fan = Math.sin(frame / 22);
  const scale = breathe(frame, fps, 0.006);
  const leaning = scene.figure === "lean";
  const figure = (key: string) =>
    frame < enter || !leaning ? null : (
      <g key={key} transform={placeAt(p, scale, s.rot)}>
        <ShifuFigure fan={fan} />
      </g>
    );
  const btnAt = cue(scene.button.cueWord);
  const btnZ = lerp(-260, 150, springAt(frame, btnAt - 3, fps, SPRING.pop));
  return {
    inside: (
      <>
        {scene.photo ? (
          <PhotoInside
            cam={cam}
            frame={frame}
            start={start}
            src={scene.photo}
          />
        ) : (
          <MountainsInside cam={cam} frame={frame} lift={70} opacity={0.8} />
        )}
        {figure("inside")}
      </>
    ),
    front:
      leaning && s.z >= 0 && frame >= enter ? (
        <>
          <defs>
            <clipPath id="cta-above-sill">
              <path d={polygonPath(aboveLine(sill[3], sill[2]))} />
            </clipPath>
            {shadow ? (
              <filter
                id="cta-shifu-sh"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0.07  0 0 0 0 0.06  0 0 0 0 0.05  0 0 0 1 0"
                />
                <feGaussianBlur stdDeviation={shadow.blur.toFixed(2)} />
              </filter>
            ) : null}
          </defs>
          {shadow ? (
            <g
              clipPath="url(#cta-above-sill)"
              opacity={shadow.opacity}
              transform={placeAt(shadow.p, scale, s.rot)}
            >
              <ShifuFigure fan={fan} shadowFilter="url(#cta-shifu-sh)" />
            </g>
          ) : null}
          <g clipPath="url(#cta-above-sill)">{figure("front")}</g>
        </>
      ) : null,
    overlay: (
      <>
        {brand.logo ? (
          <BrandLogo src={brand.logo} start={start + 4} />
        ) : (
          <HeadlineStack>
            <Kicker
              text={brand.descriptor}
              start={start + 6}
              out={Number.POSITIVE_INFINITY}
            />
            <HeadlineLine
              text={brand.name}
              cue={enter + HEADLINE.leadFrames}
              out={Number.POSITIVE_INFINITY}
              size={POP.type.brand}
              accent={brand.name.split(" ").pop()}
            />
          </HeadlineStack>
        )}
        {frame >= btnAt - 3 ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: windowClip(cam, btnZ),
            }}
          >
            <div style={planeStyle(cam, btnZ)}>
              <div
                style={{
                  position: "absolute",
                  left: POP.button.x,
                  top: POP.button.y,
                  transform: "translate(-50%, -50%)",
                  filter: dropShadow(cam, POP.button.x, POP.button.y, btnZ),
                }}
              >
                <WhatsAppButton text={scene.button.text} cue={btnAt} />
              </div>
            </div>
          </div>
        ) : null}
      </>
    ),
  };
};

// ---------------------------------------------------------------------------

export const popLayers = (scene: PopScene, ctx: PopCtx): Layers => {
  switch (scene.type) {
    case "chart":
      return chartLayers(scene, ctx);
    case "leap":
      return leapLayers(scene, ctx);
    case "turn":
      return turnLayers(scene, ctx);
    case "count":
      return countLayers(scene, ctx);
    case "cta":
      return ctaLayers(scene, ctx);
  }
};

// Frames where something breaks out of the frame: the camera recoils there.
export const popKicks = (
  scene: PopScene,
  start: number,
  cue: PopCtx["cue"],
  fps: number,
): number[] => {
  switch (scene.type) {
    case "chart":
      return [arrowCrossing(cue(scene.plungeCueWord))];
    case "leap":
      return [koiCrossing(start, cue(scene.leapCueWord))];
    case "turn":
      return [turnLockKick(scene, cue)];
    case "count":
      return [cue(scene.count.cueWord) - 2 + COUNT.crossFrames];
    case "cta": {
      if (scene.figure === "none") {
        return [cue(scene.button.cueWord)];
      }
      const enter = cue(scene.shifuCueWord) - HEADLINE.leadFrames;
      let lean = enter;
      while (shifuWorld(lean, fps, enter).z < 0 && lean < enter + 60) {
        lean++;
      }
      return [lean, cue(scene.button.cueWord)];
    }
  }
};

// The frame the koi crosses the plane (for the splash sound).
export const leapCrossing = (
  scene: PopSceneOf<"leap">,
  start: number,
  cue: PopCtx["cue"],
): number => koiCrossing(start, cue(scene.leapCueWord));

export { FrontPetals };
