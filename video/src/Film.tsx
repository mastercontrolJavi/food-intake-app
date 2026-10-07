import { AbsoluteFill, Sequence } from "remotion";
import type { Orientation } from "./layout";
import { ensureFonts } from "./theme/fonts";
import { sceneWindow } from "./timing";
import { Hook } from "./scenes/Hook";
import { LogAgain } from "./scenes/LogAgain";
import { Water } from "./scenes/Water";
import { Hero } from "./scenes/Hero";
import { Patterns } from "./scenes/Patterns";
import { Resolve } from "./scenes/Resolve";
import { Soundtrack } from "./Soundtrack";

ensureFonts();

/** The 30 s film. Scene windows come from the beat grid in timing.ts; every cut lands on a beat. */
export function Film({ orientation }: { orientation: Orientation }) {
  return (
    <AbsoluteFill className="dark" style={{ backgroundColor: "var(--background)" }}>
      <Sequence {...sceneWindow("hook")} name="1 Hook"><Hook orientation={orientation} /></Sequence>
      <Sequence {...sceneWindow("log")} name="2 Log again"><LogAgain orientation={orientation} /></Sequence>
      <Sequence {...sceneWindow("water")} name="3 Water"><Water orientation={orientation} /></Sequence>
      <Sequence {...sceneWindow("hero")} name="4 Hero"><Hero orientation={orientation} /></Sequence>
      <Sequence {...sceneWindow("patterns")} name="5 Patterns"><Patterns orientation={orientation} /></Sequence>
      <Sequence {...sceneWindow("resolve")} name="6 Resolve"><Resolve orientation={orientation} /></Sequence>
      <Soundtrack />
    </AbsoluteFill>
  );
}
