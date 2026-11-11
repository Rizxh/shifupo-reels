import { useCurrentFrame, useVideoConfig } from "remotion";
import { Blueprint } from "../components/Blueprint";
import { CornerFrames, LogoPlate, WhatsAppButton } from "../components/Brand";
import { CompassScene } from "../components/Compass";
import { Sparkles, SpeedLines } from "../components/Fx";
import { Coins, KoiPair } from "../components/Koi";
import { Luopan } from "../components/Luopan";
import { PILLAR, Pillars } from "../components/Pillars";
import { PusherScene } from "../components/Pusher";
import { Shifu } from "../components/Shifu";
import { HeadlineLine, HeadlineStack, Kicker } from "../components/Text";
import {
  COLORS,
  FONTS,
  HEADLINE,
  SAFE_AREA,
  STAGE,
  TYPE,
  VIDEO,
} from "../lib/brand";
import { EASE, prog, springAt, SPRING } from "../lib/motion";
import type { SceneOf } from "../schema";

const W = VIDEO.width;
const H = VIDEO.height;

// What every scene receives besides its content: the frame its picture
// starts, the frame it ends (the next scene's ink wipe starts there) and the
// frame of any cue word.
type Base = { start: number; end: number; cue: (word: string) => number };

// Frames before the end of a scene where its exit move starts.
const EXIT_LEAD = 14;
// Size of the hook illustration relative to its drawing.
const HOOK_SCALE = 1.28;
// Scaling around a point above the hill pushes the picture down, clear of
// the headline.
const HOOK_ORIGIN_Y = 690;

export const HookScene: React.FC<Base & { scene: SceneOf<"hook"> }> = ({
  scene,
  start,
  end,
  cue,
}) => {
  const [a, b] = scene.lines;
  const slamAt = cue(a.cueWord);
  return (
    <>
      {/* Scaled up around the hilltop so the figure reads at phone size. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${HOOK_SCALE})`,
          transformOrigin: `${STAGE.cx}px ${HOOK_ORIGIN_Y}px`,
        }}
      >
        <PusherScene
          start={start}
          exitStart={end - EXIT_LEAD}
          exitEnd={end + 6}
        />
      </div>
      <SpeedLines
        cx={SAFE_AREA.x + 300}
        cy={HEADLINE.top + 60}
        start={slamAt - HEADLINE.leadFrames}
        frames={8}
      />
      <HeadlineStack>
        <HeadlineLine
          text={a.text}
          cue={slamAt}
          out={end}
          variant="slam"
          size={TYPE.hook}
        />
        <HeadlineLine
          text={b.text}
          cue={cue(b.cueWord)}
          out={end}
          size={TYPE.headlineSmall}
          color={COLORS.seal}
        />
      </HeadlineStack>
    </>
  );
};

export const InsightScene: React.FC<Base & { scene: SceneOf<"insight"> }> = ({
  scene,
  start,
  end,
  cue,
}) => {
  const frame = useCurrentFrame();
  const [a, b] = scene.lines;
  // The compass grows into the luo pan of the next scene.
  const grow = prog(frame, end - EXIT_LEAD, end + 8, EASE.inOut);
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${1 + grow * 0.25})`,
          transformOrigin: `${STAGE.cx}px ${STAGE.cy}px`,
          opacity: 1 - grow * 0.6,
        }}
      >
        <CompassScene start={start} lock={cue(scene.lockCueWord)} />
      </div>
      <HeadlineStack>
        <HeadlineLine
          text={a.text}
          cue={cue(a.cueWord)}
          out={end}
          size={TYPE.headlineSmall}
        />
        <HeadlineLine
          text={b.text}
          cue={cue(b.cueWord)}
          out={end}
          accent={b.accent}
        />
      </HeadlineStack>
    </>
  );
};

const LUOPAN = { x: 372, y: 900 } as const;
const PILLAR_BASE = { x: 330, y: 1236 } as const;
// Centre x of pillar i on the frame.
const pillarX = (i: number, count: number) =>
  PILLAR_BASE.x -
  (count * PILLAR.width + (count - 1) * PILLAR.gap) / 2 +
  PILLAR.width / 2 +
  i * (PILLAR.width + PILLAR.gap);

export const BaziScene: React.FC<Base & { scene: SceneOf<"bazi"> }> = ({
  scene,
  start,
  end,
  cue,
}) => {
  const frame = useCurrentFrame();
  const titleAt = cue(scene.title.cueWord);
  const pillarCues = scene.pillars.map((p) => cue(p.cueWord));
  const sink = prog(frame, end - EXIT_LEAD, end + 6, EASE.in);
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <g
          transform={`translate(${LUOPAN.x} ${LUOPAN.y}) scale(${1 - sink * 0.15})`}
          opacity={1 - sink}
        >
          <Luopan start={start} id="bazi-luopan" scale={1.02} />
        </g>
        <g transform={`translate(${PILLAR_BASE.x} ${PILLAR_BASE.y})`}>
          <Pillars
            pillars={scene.pillars}
            start={titleAt - 2}
            cues={pillarCues}
            exitStart={end - EXIT_LEAD}
            id="bazi-pillars"
          />
        </g>
      </svg>
      {pillarCues.map((c, i) => (
        <Sparkles
          key={c}
          cx={pillarX(i, scene.pillars.length)}
          cy={PILLAR_BASE.y - 240}
          start={c}
          count={6}
          spread={90}
          frames={20}
        />
      ))}
      <Shifu
        enter={cue(scene.shifuCueWord) - HEADLINE.leadFrames}
        exit={end - EXIT_LEAD}
        x={930}
        baseY={H + 60}
        height={1040}
      />
      <HeadlineStack>
        <Kicker
          text={scene.subtitle}
          start={titleAt - HEADLINE.leadFrames + 6}
          out={end}
        />
        <HeadlineLine
          text={scene.title.text}
          cue={titleAt}
          out={end}
          size={TYPE.headline * 1.4}
          accent={scene.title.text}
        />
      </HeadlineStack>
    </>
  );
};

const BLUEPRINT = { x: STAGE.cx, y: 985, scale: 0.92 } as const;

export const FengshuiScene: React.FC<Base & { scene: SceneOf<"fengshui"> }> = ({
  scene,
  start,
  end,
  cue,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stampAt = cue(scene.stamp.cueWord);
  const stamp = springAt(frame, stampAt - 1, fps, SPRING.snap);
  const leave = prog(frame, end - EXIT_LEAD, end + 6, EASE.in);
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <g
          transform={`translate(${BLUEPRINT.x} ${BLUEPRINT.y + leave * 80}) scale(${BLUEPRINT.scale})`}
          opacity={1 - leave}
        >
          <Blueprint
            start={start}
            flow={cue(scene.title.cueWord)}
            stamp={stampAt}
            id="fs-plan"
          />
        </g>
      </svg>
      <HeadlineStack>
        <HeadlineLine
          text={scene.title.text}
          cue={cue(scene.title.cueWord)}
          out={end}
          size={TYPE.headlineSmall}
          accent="ENERGI"
        />
      </HeadlineStack>
      {stamp > 0 ? (
        <div
          style={{
            position: "absolute",
            left: SAFE_AREA.x + 40,
            top: 1150,
            transform: `rotate(-5deg) scale(${1.5 - Math.min(1, stamp) * 0.5})`,
            transformOrigin: "0% 50%",
            opacity: Math.min(1, stamp * 2) * (1 - leave),
            border: `6px solid ${COLORS.seal}`,
            padding: "10px 26px",
            color: COLORS.seal,
            background: "rgba(248,244,236,0.92)",
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 50,
            letterSpacing: "0.06em",
            whiteSpace: "nowrap",
          }}
        >
          {scene.stamp.text}
        </div>
      ) : null}
    </>
  );
};

const formatCount = (n: number) => new Intl.NumberFormat("id-ID").format(n);

export const ProofScene: React.FC<Base & { scene: SceneOf<"proof"> }> = ({
  scene,
  start,
  end,
  cue,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const countAt = cue(scene.count.cueWord);
  const counting = prog(frame, countAt - 2, countAt + 26, EASE.out);
  const pop = springAt(frame, countAt - 3, fps, SPRING.pop);
  const label = prog(frame, countAt + 8, countAt + 20);
  const leave = prog(frame, end - EXIT_LEAD, end + 6, EASE.in);
  const enter = prog(frame, start, start + 16);
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <g
          opacity={enter * (1 - leave)}
          transform={`translate(0 ${-leave * 160})`}
        >
          <KoiPair
            cx={STAGE.cx}
            cy={1040}
            radius={270}
            start={start}
            scale={1.45}
          />
          <Coins start={countAt - 4} floor={1236} minX={150} maxX={870} />
        </g>
      </svg>
      <Sparkles
        cx={STAGE.cx}
        cy={560}
        start={countAt + 24}
        count={14}
        spread={300}
      />
      {frame >= countAt - 3 ? (
        <div
          style={{
            position: "absolute",
            left: SAFE_AREA.x,
            top: HEADLINE.top,
            width: SAFE_AREA.width,
            textAlign: "center",
            opacity: 1 - leave,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: TYPE.figure,
              whiteSpace: "nowrap",
              // The box hugs the digits so the gold gradient covers all of
              // them (a clipped background stops at the box edge).
              display: "inline-block",
              lineHeight: 1,
              // Vertical so every digit gets the same light-to-deep gold.
              background: `linear-gradient(180deg, ${COLORS.goldLight} 0%, ${COLORS.gold} 42%, ${COLORS.goldDeep} 100%)`,
              WebkitBackgroundClip: "text",
              color: "transparent",
              filter: "drop-shadow(0 8px 18px rgba(156,122,53,0.35))",
              transform: `scale(${0.6 + Math.min(1.2, pop) * 0.4})`,
            }}
          >
            {formatCount(Math.round(scene.count.value * counting))}
            {counting >= 1 ? scene.count.suffix : ""}
          </div>
          <div
            style={{
              fontFamily: FONTS.body,
              fontWeight: 800,
              fontSize: TYPE.figureLabel,
              letterSpacing: "0.18em",
              color: COLORS.ink,
              opacity: label,
              marginTop: 8,
            }}
          >
            {scene.count.label}
          </div>
        </div>
      ) : null}
    </>
  );
};

export const CtaScene: React.FC<
  Base & {
    scene: SceneOf<"cta">;
    brand: { name: string; descriptor: string; sealGlyph: string };
  }
> = ({ scene, start, cue, brand }) => {
  return (
    <>
      <CornerFrames start={start + 4} />
      <Shifu enter={start + 8} x={830} baseY={H + 40} height={1100} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: HEADLINE.top - 20,
          width: W,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <LogoPlate
          start={start + 2}
          glyph={brand.sealGlyph}
          name={brand.name}
          descriptor={brand.descriptor}
        />
      </div>
      <HeadlineStack top={780}>
        <HeadlineLine
          text={scene.tagline.text}
          cue={cue(scene.tagline.cueWord)}
          out={Infinity}
          size={TYPE.tagline}
          accent={scene.tagline.accent}
        />
      </HeadlineStack>
      <div style={{ position: "absolute", left: SAFE_AREA.x, top: 1080 }}>
        <WhatsAppButton
          text={scene.button.text}
          cue={cue(scene.button.cueWord)}
        />
      </div>
      <Sparkles
        cx={SAFE_AREA.x + 330}
        cy={1138}
        start={cue(scene.button.cueWord) + 6}
        count={10}
        spread={240}
      />
    </>
  );
};
