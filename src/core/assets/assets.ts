import { getStaticFiles } from "remotion";

// True when a file exists in public/. Lets scenes fall back gracefully (e.g. to
// a gradient or built-in icon) while footage and Lottie files are still being
// produced. getStaticFiles works in the Studio and during rendering.
export const hasStaticFile = (path: string): boolean =>
  getStaticFiles().some((file) => file.name === path);

// "lottie/fuel.json" -> "fuel"
export const assetBaseName = (path: string): string => {
  const file = path.split("/").pop() ?? path;
  return file.replace(/\.[^.]+$/, "");
};
