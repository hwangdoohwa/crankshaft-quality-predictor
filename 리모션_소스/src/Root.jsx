import React from "react";
import { Composition } from "remotion";
import { CrankVideo, TOTAL } from "./Video";

export const Root = () => (
  <Composition id="CrankVideo" component={CrankVideo} durationInFrames={TOTAL} fps={30} width={1920} height={1080} />
);
