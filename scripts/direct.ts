// Director Engine gate: validate a production script and write its storyboard.
//
//   npm run direct -- <id>      reads docs/<id>/production.json
//
// Fails (exit 1) when the script would make a plain reel (see
// src/core/director/schema.ts). Writes docs/<id>/STORYBOARD.md on success so
// the scriptwriter and motion developer work from the same shot list.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { directorProblems, estimateSeconds, productionSchema, type Production } from "../src/core/director/schema";
import { rel, ROOT, runMain, ScriptError } from "./lib/common";

const storyboard = (p: Production): string => {
  const rows = p.beats.map(
    (b, i) =>
      `| ${i + 1} | ${b.beat} | ${b.shot.camera} | ${b.shot.subject}: ${b.shot.action} | ${b.environment.setting}; ${b.environment.atmosphere.join(", ")} | ${b.physics.map((x) => `${x.object} (${x.law})`).join("; ")} | ${b.handoff ? `${b.handoff.object} → ${b.handoff.into}` : "—"} | [${b.vo.tone}] ${b.vo.text} |`,
  );
  return [
    `# Storyboard ${p.id} (Director Engine)`,
    "",
    `Prompt: "${p.prompt}"  `,
    `Penonton: ${p.brief.viewer} · Masalah: ${p.brief.problem} · Janji: ${p.brief.promise} · Format: ${p.brief.format}  `,
    `Perkiraan durasi: ${estimateSeconds(p).toFixed(1)} s`,
    "",
    "| # | Beat | Kamera | Subjek & aksi | Lingkungan | Fisika | Penghubung | VO |",
    "|---|---|---|---|---|---|---|---|",
    ...rows,
    "",
    "Dibuat oleh `npm run direct`. Ubah `production.json`, bukan file ini.",
    "",
  ].join("\n");
};

const main = async () => {
  const id = process.argv[2];
  if (!id) {
    throw new ScriptError("Usage: npm run direct -- <id>   (reads docs/<id>/production.json)");
  }
  const file = path.join(ROOT, "docs", id, "production.json");
  if (!existsSync(file)) {
    throw new ScriptError(`No production script: ${rel(file)}. Write it from docs/templates/DIRECTOR-TEMPLATE.md.`);
  }
  const parsed = productionSchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    console.error(`Naskah produksi tidak lengkap:\n- ${issues.join("\n- ")}`);
    process.exit(1);
  }
  const problems = directorProblems(parsed.data);
  if (problems.length > 0) {
    console.error(`Naskah ditolak Director (akan jadi video polos):\n- ${problems.join("\n- ")}`);
    process.exit(1);
  }
  const out = path.join(ROOT, "docs", id, "STORYBOARD.md");
  writeFileSync(out, storyboard(parsed.data));
  console.log(`Director OK: ${parsed.data.beats.length} beat, ±${estimateSeconds(parsed.data).toFixed(1)} s → ${rel(out)}`);
};

runMain(main);
