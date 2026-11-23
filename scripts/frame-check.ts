// Framing check for a music video in a live 3D world, without rendering:
// projects every actor of every shot (start, middle, end) through that
// shot's camera and flags what made bad frames in lookdev: a head filling
// the frame, the camera inside a figure, inside a wall, or nobody in frame.
//
//   npx tsx scripts/frame-check.ts sp09

import { projectToScreen, shotAt, type CamState, type Vec3 } from "../src/core/three/rig";
import { VIDEO } from "../src/lib/brand";
import { mvStarts } from "../src/lib/timing";
import { RUKO_SHOTS, RUKO } from "../src/products/shifupo/worlds/rukoConfig";
import { cast, HEIGHT } from "../src/products/shifupo/worlds/rukoCast";
import { loadEpisode, requireEpisodeId, runMain, ScriptError } from "./lib/common";

const W = VIDEO.width;
const H = VIDEO.height;
// A head wider than this share of the frame width is an unwanted close-up.
const MAX_HEAD_SHARE = 0.34;
// The camera must keep this distance from any figure (m).
const MIN_CLEARANCE = 0.55;

type Subject = { id: string; head: Vec3; r: number; body: Vec3[] };

const subjectsOf = (shot: string, t: number, frame: number): Subject[] => {
  const people = cast({ shot, t, frame, local: 0 }).map((a) => {
    const h = HEIGHT[a.id] ?? (a.id === "grandpa" ? 1.08 : 1.15);
    const [x, y, z] = a.pos;
    return {
      id: a.id,
      head: [x, y + 0.84 * h, z] as Vec3,
      r: 0.2 * h,
      body: [0.15, 0.45, 0.7, 0.84].map((k) => [x, y + k * h, z] as Vec3),
    };
  });
  const cs = RUKO.caishen.pos;
  const s = RUKO.caishen.height;
  return [
    ...people,
    { id: "caishen", head: [cs[0], cs[1] + 0.74 * s, cs[2]], r: 0.15 * s, body: [0.2, 0.5, 0.74].map((k) => [cs[0], cs[1] + k * s, cs[2]] as Vec3) },
  ];
};

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const wallProblem = (p: Vec3): string | null => {
  const R = RUKO.room;
  const inside = p[2] < R.front;
  if (inside && (Math.abs(p[0]) > R.halfX - 0.15 || p[2] < R.back + 0.15 || p[1] > R.height - 0.2)) {
    return "camera in a wall or ceiling";
  }
  if (p[2] > R.front - 0.12 && p[2] < R.front + R.wall + 0.12 && Math.abs(p[0]) > RUKO.door.width / 2 - 0.1) {
    return "camera in the front wall";
  }
  return null;
};

const check = (cam: CamState, subjects: Subject[]) => {
  const problems: string[] = [];
  const seen: string[] = [];
  const wall = wallProblem(cam.pos);
  if (wall) problems.push(wall);
  for (const s of subjects) {
    const near = Math.min(...s.body.map((b) => dist(b, cam.pos)));
    if (near < MIN_CLEARANCE) problems.push(`camera ${near.toFixed(2)} m from ${s.id}`);
    const c = projectToScreen(cam, s.head, W, H);
    const top = projectToScreen(cam, [s.head[0], s.head[1] + s.r, s.head[2]], W, H);
    if (!c || !top) continue;
    const share = (2 * Math.abs(top.y - c.y)) / W;
    const inFrame = c.x > -0.05 * W && c.x < 1.05 * W && c.y > 0 && c.y < H;
    if (!inFrame) continue;
    seen.push(`${s.id}(${(c.x / W).toFixed(2)},${(c.y / H).toFixed(2)} ${(share * 100).toFixed(0)}%)`);
    if (share > MAX_HEAD_SHARE) problems.push(`${s.id} head ${(share * 100).toFixed(0)}% of width`);
  }
  return { problems, seen };
};

const main = async () => {
  const id = requireEpisodeId(process.argv.slice(2), "npx tsx scripts/frame-check.ts <id>");
  const episode = loadEpisode(id);
  if (episode.format !== "mv") {
    throw new ScriptError(`${id} is not a music video`);
  }
  const starts = mvStarts(episode.scenes.map((s) => s.seconds));
  let bad = 0;
  episode.scenes.forEach((scene, i) => {
    const spec = RUKO_SHOTS[scene.shot];
    for (const t of [0, 0.5, 1]) {
      const frame = Math.round(starts[i] + t * (starts[i + 1] - starts[i] - 1));
      const cam = shotAt(spec, t, frame);
      const { problems, seen } = check(cam, subjectsOf(scene.shot, t, frame));
      const flag = problems.length ? "!!" : "ok";
      if (problems.length) bad++;
      console.log(`${flag} ${scene.shot.padEnd(9)} t=${t.toFixed(1)} f${String(frame).padEnd(5)} ${seen.join(" ") || "(nobody in frame)"}${problems.length ? `\n     ${problems.join("; ")}` : ""}`);
    }
  });
  console.log(bad ? `\n${bad} samples with problems` : "\nAll shots framed.");
};

runMain(main);
