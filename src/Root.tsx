import { Composition } from "remotion";
import sp01 from "../data/episodes/sp01.json";
import sp02 from "../data/episodes/sp02.json";
import sp04 from "../data/episodes/sp04.json";
import sp06 from "../data/episodes/sp06.json";
import sp07 from "../data/episodes/sp07.json";
import sp08 from "../data/episodes/sp08.json";
import sp09 from "../data/episodes/sp09.json";
import { MvReel } from "./compositions/MvReel";
import { CinemaReel } from "./compositions/CinemaReel";
import { PopReel } from "./compositions/PopReel";
import { ParadeReel } from "./compositions/ParadeReel";
import { QuizReel } from "./compositions/QuizReel";
import { Reel } from "./compositions/Reel";
import { ShioReel } from "./compositions/ShioReel";
import { VIDEO } from "./lib/brand";
import { FPS } from "./lib/timing";
import { calculateCinemaMetadata, calculateMvMetadata, calculatePopReelMetadata, calculateParadeMetadata, calculateQuizMetadata, calculateReelMetadata, calculateShioMetadata } from "./metadata";
import {
  cinemaReelPropsSchema,
  mvReelPropsSchema,
  type MvReelProps,
  type CinemaReelProps,
  popReelPropsSchema,
  paradeReelPropsSchema,
  quizReelPropsSchema,
  type QuizReelProps,
  type ParadeReelProps,
  reelPropsSchema,
  shioReelPropsSchema,
  type ShioReelProps,
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
    <Composition
      id="CinemaReel"
      component={CinemaReel}
      schema={cinemaReelPropsSchema}
      width={VIDEO.width}
      height={VIDEO.height}
      fps={FPS}
      durationInFrames={FPS * 30}
      defaultProps={{ ...(sp04 as Omit<CinemaReelProps, "debug">), debug: true }}
      calculateMetadata={calculateCinemaMetadata}
    />
    <Composition
      id="ShioReel"
      component={ShioReel}
      schema={shioReelPropsSchema}
      width={VIDEO.width}
      height={VIDEO.height}
      fps={FPS}
      durationInFrames={FPS * 28}
      defaultProps={{ ...(sp06 as unknown as Omit<ShioReelProps, "debug">), debug: true }}
      calculateMetadata={calculateShioMetadata}
    />
    <Composition
      id="ParadeReel"
      component={ParadeReel}
      schema={paradeReelPropsSchema}
      width={VIDEO.width}
      height={VIDEO.height}
      fps={FPS}
      durationInFrames={FPS * 48}
      defaultProps={{ ...(sp07 as unknown as Omit<ParadeReelProps, "debug">), debug: true }}
      calculateMetadata={calculateParadeMetadata}
    />
    <Composition
      id="QuizReel"
      component={QuizReel}
      schema={quizReelPropsSchema}
      width={VIDEO.width}
      height={VIDEO.height}
      fps={FPS}
      durationInFrames={FPS * 50}
      defaultProps={{ ...(sp08 as unknown as Omit<QuizReelProps, "debug">), debug: true }}
      calculateMetadata={calculateQuizMetadata}
    />
    <Composition
      id="MvReel"
      component={MvReel}
      schema={mvReelPropsSchema}
      width={VIDEO.width}
      height={VIDEO.height}
      fps={FPS}
      durationInFrames={FPS * 72}
      defaultProps={{ ...(sp09 as unknown as Omit<MvReelProps, "debug">), debug: true }}
      calculateMetadata={calculateMvMetadata}
    />
  </>
);
