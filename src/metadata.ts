import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { staticFile, type CalculateMetadataFunction } from "remotion";
import { hasStaticFile } from "./lib/assets";
import { voAlignmentPath, voAudioPath, voSidecarSchema } from "./lib/audio";
import { voGainFor } from "./lib/mix";
import { splitWords } from "./lib/text";
import { evenWordTimings, layoutBeats, type VoLine } from "./lib/timeline";
import { FPS, PACING, REEL, secondsToFrames } from "./lib/timing";
import { reelPropsSchema, type ReelProps } from "./schema";

const audioDurationInSeconds = async (src: string): Promise<number> => {
  const input = new Input({ source: new UrlSource(src), formats: ALL_FORMATS });
  try {
    return await input.computeDuration();
  } finally {
    input.dispose();
  }
};

const estimateSeconds = (vo: string) =>
  Math.max(
    PACING.estimateMinLineSeconds,
    splitWords(vo).length / PACING.estimateWordsPerSecond,
  );

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
    const frames = secondsToFrames(estimateSeconds(vo), FPS);
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

export const calculateReelMetadata: CalculateMetadataFunction<
  ReelProps
> = async ({ props }) => {
  const episode = reelPropsSchema.parse(props);
  const lines = await Promise.all(
    episode.scenes.map((scene, i) => measureLine(episode.id, i, scene.vo)),
  );
  const { beats, durationInFrames } = layoutBeats(lines, FPS);
  const seconds = durationInFrames / FPS;
  if (seconds < REEL.minSeconds || seconds > REEL.maxSeconds) {
    console.warn(
      `${episode.id} is ${seconds.toFixed(1)} s, outside ${REEL.minSeconds}-${REEL.maxSeconds} s. Shorten or extend the VO.`,
    );
  }
  return { durationInFrames, fps: FPS, props: { ...episode, beats } };
};
