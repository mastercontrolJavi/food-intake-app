import "./styles.css";
import { Composition } from "remotion";
import { Cover } from "./Cover";
import { Film } from "./Film";
import { FidelityCheck } from "./dev/FidelityCheck";
import { DURATION_IN_FRAMES, FPS } from "./timing";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Film16x9" component={Film} durationInFrames={DURATION_IN_FRAMES} fps={FPS} width={2560} height={1440} defaultProps={{ orientation: "landscape" as const }} />
      <Composition id="Film9x16" component={Film} durationInFrames={DURATION_IN_FRAMES} fps={FPS} width={1440} height={2560} defaultProps={{ orientation: "portrait" as const }} />
      <Composition id="Cover16x9" component={Cover} durationInFrames={1} fps={FPS} width={2560} height={1440} defaultProps={{ layout: "16x9" as const }} />
      <Composition id="Cover4x3" component={Cover} durationInFrames={1} fps={FPS} width={2400} height={1800} defaultProps={{ layout: "4x3" as const }} />
      <Composition id="FidelityCheck" component={FidelityCheck} durationInFrames={1} fps={60} width={2880} height={1800} />
    </>
  );
};
