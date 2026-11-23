// Where every script writes under out/. One folder per kind of output, so
// the finished videos are easy to find and the working files stay apart:
//
//   out/video/     finished reels, named "<id> - <title>.mp4"
//   out/produce/   renders before loudness (<id>.mp4, <id>_draft.mp4),
//                  render chunks, props and logs
//   out/review/    review loop: <id>_review.md and <id>_review.jpg
//   out/qc/        final QA: <id>_report.md, <id>_sheet.jpg, whisper
//                  transcripts, golden reference frames
//   out/look/      lookdev and stills: stills/<id>/, frame sheets
//   out/sound/     voice-over takes and audio experiments
//   out/archive/   older material kept for reference

import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
export const OUT_DIR = path.join(ROOT, "out");

export const OUT = {
  video: path.join(OUT_DIR, "video"),
  produce: path.join(OUT_DIR, "produce"),
  props: path.join(OUT_DIR, "produce", ".props"),
  logs: path.join(OUT_DIR, "produce", "logs"),
  review: path.join(OUT_DIR, "review"),
  qc: path.join(OUT_DIR, "qc"),
  golden: path.join(OUT_DIR, "qc", "golden"),
  look: path.join(OUT_DIR, "look"),
  stills: path.join(OUT_DIR, "look", "stills"),
  sound: path.join(OUT_DIR, "sound"),
  archive: path.join(OUT_DIR, "archive"),
} as const;

// Characters Windows does not allow in file names.
const safeTitle = (title: string): string =>
  title
    .replace(/[<>:"/\\|?*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const outPaths = (id: string, draft = false) => {
  const d = draft ? "_draft" : "";
  return {
    // Render before postprocess (loudness).
    rendered: path.join(OUT.produce, `${id}${d}.mp4`),
    props: path.join(OUT.props, `${id}.json`),
    report: path.join(OUT.qc, `${id}${d}_report.md`),
    sheet: path.join(OUT.qc, `${id}${d}_sheet.jpg`),
    transcript: path.join(OUT.qc, `${id}.transcript.json`),
    reviewMd: path.join(OUT.review, `${id}_review.md`),
    reviewJpg: path.join(OUT.review, `${id}_review.jpg`),
    stills: path.join(OUT.stills, id),
    frames: path.join(OUT.look, `${id}_frames.jpg`),
  };
};

// The finished reel: out/video/<id> - <title>.mp4.
export const finalVideoPath = (id: string, title: string): string =>
  path.join(OUT.video, `${id} - ${safeTitle(title)}.mp4`);
