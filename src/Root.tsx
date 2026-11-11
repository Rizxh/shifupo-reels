import { Composition } from "remotion";
import sp01 from "../data/episodes/sp01.json";
import sp02 from "../data/episodes/sp02.json";
import { PopReel } from "./compositions/PopReel";
import { Reel } from "./compositions/Reel";
import { VIDEO } from "./lib/brand";
import { FPS } from "./lib/timing";
import { calculatePopReelMetadata, calculateReelMetadata } from "./metadata";
import {
  popReelPropsSchema,
  reelPropsSchema,
  type PopReelProps,
  type ReelProps,
} from "./schema";

// One composition per episode format. The scripts pick the composition from
// the episode's "format" and pass the episode as props; the defaults here
// are what the Studio shows.
export const RemotionRoot: React.FC = () => (
  <>
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
    <Composition
      id="PopReel"
      component={PopReel}
      schema={popReelPropsSchema}
      width={VIDEO.width}
      height={VIDEO.height}
      fps={FPS}
      durationInFrames={FPS * 15}
      defaultProps={{ ...(sp02 as Omit<PopReelProps, "debug">), debug: true }}
      calculateMetadata={calculatePopReelMetadata}
    />
  </>
);
