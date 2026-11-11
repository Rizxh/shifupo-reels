import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { staticFile, type CalculateMetadataFunction } from "remotion";
import { hasStaticFile } from "./lib/assets";
import { voAlignmentPath, voAudioPath, voSidecarSchema } from "./lib/audio";
import { voGainFor } from "./lib/mix";
import { splitWords } from "./lib/text";
import {
  estimateLineSeconds,
  evenWordTimings,
  layoutBeats,
  type VoLine,
} from "./lib/timeline";
import { FPS, POP_PACING, REEL, secondsToFrames } from "./lib/timing";
import {
  popReelPropsSchema,
  reelPropsSchema,
  type PopReelProps,
  type ReelProps,
} from "./schema";

const audioDurationInSeconds = async (src: string): Promise<number> => {
  const input = new Input({ source: new UrlSource(src), formats: ALL_FORMATS });
  try {
    return await input.computeDuration();
  } finally {
    input.dispose();
  }
};

// Measures one VO line from its file and sidecar, or estimates it from the
// word count while the file does not exist yet (the Studio and draft renders
// keep working before `npm run tts`).
const measureLine = async (
  episodeId: string,
  index: number,
  vo: string,
): Promise<VoLine> => {
  const words = splitWords(vo);
  const audio = voAudioPath(episodeId, index);
  if (!hasStaticFile(audio)) {
    const frames = secondsToFrames(estimateLineSeconds(vo), FPS);
    return {
      voDurationInFrames: frames,
      words: evenWordTimings(words, frames),
    };
  }
  const frames = Math.max(
    1,
    secondsToFrames(await audioDurationInSeconds(staticFile(audio)), FPS),
  );
  const sidecarPath = voAlignmentPath(episodeId, index);
  if (hasStaticFile(sidecarPath)) {
    const res = await fetch(staticFile(sidecarPath));
    const parsed = voSidecarSchema.safeParse(await res.json());
    if (
      parsed.success &&
      parsed.data.text === vo &&
      parsed.data.words.length === words.length
    ) {
      return {
        voDurationInFrames: frames,
        voSrc: audio,
        voGain: voGainFor(parsed.data.loudnessLufs),
        words: parsed.data.words.map((w) => ({
          text: w.text,
          startFrame: secondsToFrames(w.startInSeconds, FPS),
          endFrame: secondsToFrames(w.endInSeconds, FPS),
        })),
      };
    }
    console.warn(
      `${sidecarPath} is out of date; captions use an even split. Re-run: npm run tts -- ${episodeId}`,
    );
  }
  return {
    voDurationInFrames: frames,
    voSrc: audio,
    words: evenWordTimings(words, frames),
  };
};

type TimedProps = {
  id: string;
  scenes: { vo: string }[];
  beats?: unknown;
};

// Builds a calculateMetadata for one format: measures every VO line, lays the
// beats out on one timeline and sets the composition length from it.
const metadataFor =
  <P extends TimedProps>(
    parse: (props: unknown) => P,
    options: { outroHoldSeconds?: number; minSeconds?: number } = {},
  ): CalculateMetadataFunction<P> =>
  async ({ props }) => {
    const episode = parse(props);
    const lines = await Promise.all(
      episode.scenes.map((scene, i) => measureLine(episode.id, i, scene.vo)),
    );
    const { beats, durationInFrames } = layoutBeats(lines, FPS, {
      outroHoldSeconds: options.outroHoldSeconds,
      minFrames:
        options.minSeconds === undefined
          ? undefined
          : secondsToFrames(options.minSeconds, FPS),
    });
    const seconds = durationInFrames / FPS;
    if (seconds < REEL.minSeconds || seconds > REEL.maxSeconds) {
      console.warn(
        `${episode.id} is ${seconds.toFixed(1)} s, outside ${REEL.minSeconds}-${REEL.maxSeconds} s. Shorten or extend the VO.`,
      );
    }
    return { durationInFrames, fps: FPS, props: { ...episode, beats } };
  };

export const calculateReelMetadata = metadataFor<ReelProps>((p) =>
  reelPropsSchema.parse(p),
);

export const calculatePopReelMetadata = metadataFor<PopReelProps>(
  (p) => popReelPropsSchema.parse(p),
  {
    outroHoldSeconds: POP_PACING.outroHoldSeconds,
    minSeconds: POP_PACING.minSeconds,
  },
);
