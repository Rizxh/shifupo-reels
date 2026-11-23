import { config } from "@remotion/eslint-config-flat";

export default [
  ...config,
  // plain Node scripts (the toon render/stills runners) use Node globals
  { files: ["scripts/**/*.mjs"], languageOptions: { globals: { process: "readonly", console: "readonly" } } },
];
