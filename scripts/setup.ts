// First-run setup and health check for a fresh clone:
//
//   npm run setup
//
// Checks Node and ffmpeg, creates .env from .env.example when it is missing,
// reports whether the ElevenLabs variables are filled in (never their
// values), synthesizes the sound effects, and lists missing assets.

import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { SHIFU } from "../src/lib/brand";
import {
  missingElevenLabsVars,
  PUBLIC_DIR,
  rel,
  ROOT,
  run,
  runMain,
} from "./lib/common";

const MIN_NODE_MAJOR = 20;
const ENV_FILE = path.join(ROOT, ".env");
const ENV_TEMPLATE = path.join(ROOT, ".env.example");
const TSX_CLI = path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs");

const ok = (msg: string) => console.log(`  OK    ${msg}`);
const todo = (msg: string) => console.log(`  TODO  ${msg}`);
const fail = (msg: string) => console.log(`  GAGAL ${msg}`);

const hasCommand = async (command: string): Promise<boolean> => {
  try {
    const { code } = await run(command, ["-version"], { capture: true });
    return code === 0;
  } catch {
    return false;
  }
};

const main = async () => {
  console.log("Setup shifupo-reels\n");
  let blocking = 0;

  const major = Number(process.versions.node.split(".")[0]);
  if (major >= MIN_NODE_MAJOR) {
    ok(`Node ${process.versions.node}`);
  } else {
    fail(
      `Node ${process.versions.node}: butuh versi ${MIN_NODE_MAJOR} ke atas`,
    );
    blocking++;
  }

  for (const tool of ["ffmpeg", "ffprobe"]) {
    if (await hasCommand(tool)) {
      ok(tool);
    } else {
      fail(
        `${tool} tidak ditemukan di PATH (install ffmpeg, lalu buka ulang terminal)`,
      );
      blocking++;
    }
  }

  if (!existsSync(ENV_FILE)) {
    copyFileSync(ENV_TEMPLATE, ENV_FILE);
    console.log("  BARU  .env dibuat dari .env.example");
  }
  const missing = missingElevenLabsVars();
  if (missing.length === 0) {
    ok(".env berisi kunci dan voice ElevenLabs (nilainya tidak ditampilkan)");
  } else {
    todo(
      `Isi ${missing.join(" dan ")} di .env (tanpa itu video dibuat tanpa VO)`,
    );
  }

  if (blocking === 0) {
    const sfx = await run(process.execPath, [TSX_CLI, "scripts/sfx.ts"], {
      capture: true,
    });
    if (sfx.code === 0) {
      ok("SFX disintesis ke public/audio/sfx/");
    } else {
      fail(`npm run sfx gagal:\n${sfx.stderr}`);
      blocking++;
    }
  }

  const photo = path.join(PUBLIC_DIR, SHIFU.photo);
  if (existsSync(photo)) {
    ok(`Foto Shifu Po: ${rel(photo)}`);
  } else {
    todo(
      `Foto Shifu Po belum ada (${rel(photo)}); sementara dipakai siluet tinta`,
    );
  }

  console.log(
    blocking === 0
      ? "\nSiap. Coba: npm run studio  atau  npm run produce -- sp01 --draft"
      : `\n${blocking} masalah harus dibereskan dulu (lihat GAGAL di atas).`,
  );
  if (blocking > 0) {
    process.exitCode = 1;
  }
};

runMain(main);
