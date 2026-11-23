// Shifu Po's pop-out space: the shared camera (src/core/camera/space.ts)
// bound to the lacquer frame and look defined in this product's brand.

import { createSpace } from "../../core/camera/space";
import { POP, VIDEO } from "./brand";

export {
  cssPolygon,
  placeAt,
  polygonPath,
  project,
  quadAt,
  type Camera,
  type Point,
  type Projected,
} from "../../core/camera/space";

export const { WINDOW, FRAME_OUTER, cameraAt, shadowOf, nearLook, aboveLine } = createSpace({
  video: VIDEO,
  ...POP,
});
