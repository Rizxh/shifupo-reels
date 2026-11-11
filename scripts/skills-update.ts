// Installs or updates the official Remotion Agent Skills (remotion-dev/skills)
// and keeps them in a form that works on every machine:
//
//   npm run skills:update
//
// `npx remotion skills add` installs 13 skills into .agents/skills and links
// them into .claude/skills with absolute symlinks, which break on another
// laptop. The router skill `remotion-best-practices` already contains every
// sub-skill, so this keeps only that one, as a real folder in .claude/skills,
// and removes the rest.

import { cpSync, existsSync, lstatSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { ROOT, run, runMain, ScriptError } from "./lib/common";

const KEEP = "remotion-best-practices";
const AGENTS_DIR = path.join(ROOT, ".agents");
const CLAUDE_SKILLS = path.join(ROOT, ".claude", "skills");
const LOCK_FILE = path.join(ROOT, "skills-lock.json");
const REMOTION_CLI = path.join(
  ROOT,
  "node_modules",
  "@remotion",
  "cli",
  "remotion-cli.js",
);

const main = async () => {
  const add = await run(process.execPath, [REMOTION_CLI, "skills", "add"]);
  if (add.code !== 0) {
    throw new ScriptError("npx remotion skills add failed");
  }
  const source = path.join(AGENTS_DIR, "skills", KEEP);
  if (!existsSync(source)) {
    throw new ScriptError(`${KEEP} was not installed`);
  }

  // Drop the symlinks the installer made; keep the project's own skills.
  for (const name of readdirSync(CLAUDE_SKILLS)) {
    const entry = path.join(CLAUDE_SKILLS, name);
    if (name.startsWith("remotion-") && lstatSync(entry).isSymbolicLink()) {
      rmSync(entry, { recursive: true, force: true });
    }
  }
  const target = path.join(CLAUDE_SKILLS, KEEP);
  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true, dereference: true });

  // Windows can hold the folder briefly after the installer exits.
  rmSync(AGENTS_DIR, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 300,
  });
  rmSync(LOCK_FILE, { force: true });
  console.log(`Official Remotion skill installed at .claude/skills/${KEEP}`);
};

runMain(main);
