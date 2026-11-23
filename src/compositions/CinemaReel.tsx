import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  getRemotionEnvironment,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { LogoPlate, WhatsAppButton } from "../components/Brand";
import { getStaticFiles } from "remotion";
import { Caption, HeadlineLine, HeadlineStack, Kicker } from "../components/Text";
import { FilmGrain, LightLeak, TextScrims, Vignette } from "../core/fx/film";
import { cueFrame, type Beat } from "../lib/timeline";
import { CINEMA, COLORS, SAFE_AREA, TYPE, VIDEO } from "../lib/brand";
import { MIX } from "../lib/mix";
import { SFX, SFX_MIX, WHOOSH_PEAK_SECONDS, type SfxName } from "../lib/sfx";
import type { CinemaReelProps, CinemaScene } from "../schema";
import { WorldMarks, WorldSounds, WorldStage, worldOf } from "./WorldLayers";

// Cinema format (sp04): every beat plays a 3D shot rendered in Blender
// (public/assets/3d/<shot>/frame_####.png, npm run render3d) and the brand
// layer sits on top: kicker + title on the cue word, captions, CTA logo and
// button. Shots overlap by CINEMA.transitionFrames (each shot is rendered
// with that many tail frames) and cross with a warm light leak.

const framesOf = (shot: string): number =>
  getStaticFiles().filter((f) => f.name.startsWith(`assets/3d/${shot}/frame_`)).length;

const Shot: React.FC<{ shot: string; local: number }> = ({ shot, local }) => {
  const count = framesOf(shot);
  if (count === 0) {
    // Render still pending: a dusk gradient keeps drafts readable.
    return <AbsoluteFill style={{ background: `linear-gradient(180deg, ${COLORS.inkSoft}, ${COLORS.goldDeep})` }} />;
  }
  const n = Math.min(count, Math.max(1, Math.floor(local) + 1));
  return (
    <AbsoluteFill>
      <Img
        src={staticFile(`assets/3d/${shot}/frame_${String(n).padStart(4, "0")}.png`)}
        style={{ width: VIDEO.width, height: VIDEO.height, objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
};

const SceneTitles: React.FC<{ scene: CinemaScene; beat: Beat }> = ({ scene, beat }) => {
  const cue = (w: string) => cueFrame(beat, scene.vo, w);
  const out = beat.endFrame;
  const first = scene.lines[0];
  return (
    <HeadlineStack align="center">
      {scene.kicker && first ? (
        <Kicker text={scene.kicker} start={cue(first.cueWord) - 6} out={out} color={COLORS.goldLight} />
      ) : null}
      {scene.lines.map((l, i) => (
        <HeadlineLine
          key={l.text}
          text={l.text}
          cue={cue(l.cueWord)}
          out={out}
          accent={l.accent}
          variant={i === 0 && scene.type !== "context" ? "slam" : "rise"}
          size={TYPE.headline}
          color={COLORS.paper}
        />
      ))}
    </HeadlineStack>
  );
};

const Cta: React.FC<{ scene: CinemaScene; beat: Beat; brand: CinemaReelProps["brand"] }> = ({ scene, beat, brand }) => {
  const frame = useCurrentFrame();
  const cue = (w: string) => cueFrame(beat, scene.vo, w);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 60, top: -120 }}>
      {/* Soft dark pool behind the brand block: readable over the night sky
          and over the cream walls of a 3D set alike (no box). */}
      <AbsoluteFill
        style={{
          top: 120,
          background: `radial-gradient(ellipse 62% 30% at 50% 47%, rgba(10,7,5,${CINEMA.ctaScrim}) 0%, rgba(10,7,5,0) 100%)`,
          opacity: interpolate(frame, [beat.startFrame, beat.startFrame + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
      <LogoPlate start={beat.startFrame + 6} glyph={brand.sealGlyph} name={brand.name} descriptor={brand.descriptor} tone="paper" />
      {scene.button ? <WhatsAppButton text={scene.button.text} cue={cue(scene.button.cueWord)} /> : null}
    </AbsoluteFill>
  );
};

export const CinemaReel: React.FC<CinemaReelProps> = ({ scenes, beats, brand, debug, world: worldName }) => {
  const frame = useCurrentFrame();
  if (!beats) {
    return <AbsoluteFill style={{ backgroundColor: COLORS.ink }} />;
  }
  const T = CINEMA.transitionFrames;
  const world = worldOf(worldName);
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      {world ? <WorldStage world={world} scenes={scenes} beats={beats} /> : null}
      {world ? null : scenes.map((scene, i) => {
        const beat = beats[i];
        const last = i === scenes.length - 1;
        const until = last ? beat.endFrame : beat.endFrame + T;
        if (frame < beat.startFrame || frame >= until) {
          return null;
        }
        // Incoming shot fades and settles over the tail of the previous one.
        const fadeIn = i === 0 ? 1 : interpolate(frame, [beat.startFrame, beat.startFrame + T], [0, 1], { extrapolateRight: "clamp" });
        const settle = i === 0 ? 1 : interpolate(frame, [beat.startFrame, beat.startFrame + T], [1.06, 1], { extrapolateRight: "clamp" });
        return (
          <AbsoluteFill key={scene.shot} style={{ opacity: fadeIn, transform: `scale(${settle})` }}>
            <Shot shot={scene.shot} local={frame - beat.startFrame} />
          </AbsoluteFill>
        );
      })}
      {world ? null : beats.slice(1).map((beat, i) => (
        <LightLeak key={`leak-${i}`} progress={(frame - beat.startFrame + T / 2) / (T * 1.4)} color={COLORS.goldLight} x={i % 2 ? 25 : 75} />
      ))}
      <TextScrims />
      <Vignette />
      {world ? <WorldMarks world={world} scenes={scenes} beats={beats} /> : null}
      {scenes.map((scene, i) => {
        const beat = beats[i];
        if (frame < beat.startFrame || frame >= beat.endFrame) {
          return null;
        }
        return scene.type === "cta" ? (
          <Cta key={`ui-${i}`} scene={scene} beat={beat} brand={brand} />
        ) : (
          <SceneTitles key={`ui-${i}`} scene={scene} beat={beat} />
        );
      })}
      {scenes.map((scene, i) => {
        const beat = beats[i];
        return (
          <Sequence key={`cap-${i}`} from={beat.startFrame} durationInFrames={beat.endFrame - beat.startFrame} layout="none">
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
      <FilmGrain width={VIDEO.width} height={VIDEO.height} opacity={CINEMA.grain} />
      {beats.map((beat) =>
        beat.voSrc ? (
          <Sequence key={beat.voSrc} from={beat.voStartFrame} layout="none">
            <Audio src={staticFile(beat.voSrc)} volume={MIX.vo * (beat.voGain ?? 1)} />
          </Sequence>
        ) : null,
      )}
      {scenes.flatMap((scene, i) =>
        scene.sfx
          .filter((s) => s.sound in SFX)
          .map((s) => {
            const name = s.sound as SfxName;
            const cue = cueFrame(beats[i], scene.vo, s.cueWord);
            // A whoosh peaks BEFORE its word: peaking on the word masked its
            // first consonant (whisper heard "boncor", "Untar" in sp05).
            const at = name === "whoosh" ? cue - Math.round(WHOOSH_PEAK_SECONDS * VIDEO.fps) - CINEMA.whooshLeadFrames : cue - 2;
            const gain = name === "whoosh" ? CINEMA.whooshUnderVo : 1;
            return (
              <Sequence key={`sfx-${i}-${s.cueWord}-${s.sound}`} from={Math.max(0, at)} layout="none">
                <Audio src={staticFile(SFX[name])} volume={SFX_MIX[name] * gain} />
              </Sequence>
            );
          }),
      )}
      {beats.slice(1).map((beat, i) => (
        <Sequence key={`swoosh-${i}`} from={Math.max(0, beat.startFrame - 10)} layout="none">
          <Audio src={staticFile(SFX.whoosh)} volume={SFX_MIX.whoosh * 0.7} />
        </Sequence>
      ))}
      {world ? <WorldSounds world={world} scenes={scenes} beats={beats} /> : null}
      {CINEMA.bed ? (
        <Audio
          src={staticFile(CINEMA.bed)}
          volume={(f) => {
            const speaking = beats.some((b) => f >= b.voStartFrame && f < b.voStartFrame + b.voDurationInFrames);
            const total = beats[beats.length - 1].endFrame;
            const fadeOut = interpolate(f, [total - 24, total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (speaking ? CINEMA.bedUnderVo : CINEMA.bedVolume) * fadeOut;
          }}
        />
      ) : null}
      {debug && getRemotionEnvironment().isStudio ? (
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
      ) : null}
    </AbsoluteFill>
  );
};
