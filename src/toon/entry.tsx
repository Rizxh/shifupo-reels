// Stand-alone entry for the toon format (Shifu Po): bundles only these compositions for fast stills and renders.
import React from "react";
import { Composition, registerRoot } from "remotion";
import { ShifuShort, SHIFU_FRAMES } from "./shifu/Short";

const Root: React.FC = () => (
  <>
    <Composition id="ShifuShort" component={ShifuShort} durationInFrames={SHIFU_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
registerRoot(Root);
