// Shared Animation Production Core: reusable engine, no product copy or brand.
// Products (src/products/<name>/) bind brand tokens, asset packs, formats and voice.
export * from "./motion/motion";
export * from "./text/text";
export * from "./text/cues";
// timeline's evenWordTimings (frame-based) differs from text's (seconds-based):
// import it from "./timeline/timeline" directly when needed.
export { cueFrame, estimateLineSeconds, layoutBeats, type Beat, type VoLine } from "./timeline/timeline";
export * from "./timeline/timing";
export * from "./audio/audio";
export * from "./audio/mix";
export * from "./assets/assets";
export * from "./camera/space";
