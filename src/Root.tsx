import { Composition } from "remotion";
import sp01 from "../data/episodes/sp01.json";
import { Reel } from "./compositions/Reel";
import { VIDEO } from "./lib/brand";
import { FPS } from "./lib/timing";
import { calculateReelMetadata } from "./metadata";
import { reelPropsSchema, type ReelProps } from "./schema";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    schema={reelPropsSchema}
    width={VIDEO.width}
    height={VIDEO.height}
    fps={FPS}
    // Replaced by calculateMetadata from the VO lengths.
    durationInFrames={FPS * 27}
    defaultProps={{ ...(sp01 as Omit<ReelProps, "debug">), debug: true }}
    calculateMetadata={calculateReelMetadata}
  />
);
