import { Audio, getStaticFiles, interpolate, Sequence, staticFile } from "remotion";
import { beat, DURATION_IN_FRAMES, FPS } from "./timing";

/**
 * Music: public/audio/track.mp3 when present (drop a ~100 BPM track in and re-render), otherwise the
 * bed synthesized by scripts/make-audio.py on the same grid. Fades out over the last 1.5 s.
 * UI clicks sit on the three on-screen presses; volumes keep each click ≥ 12 dB under the local music
 * level (measured against the generated bed — see DECISIONS.md).
 */
const FADE_START = DURATION_IN_FRAMES - Math.round(1.5 * FPS);

const CLICKS = [
  { at: beat(6.5), volume: 0.07 }, // Log again (half-beat)
  { at: beat(14), volume: 0.12 }, // +500
  { at: beat(20), volume: 0.5 }, // Why this score? (hero hit)
];

export function Soundtrack() {
  const hasTrack = getStaticFiles().some((f: { name: string }) => f.name === "audio/track.mp3");
  const music = staticFile(hasTrack ? "audio/track.mp3" : "audio/generated-bed.wav");
  return (
    <>
      <Audio
        src={music}
        volume={(f: number) => interpolate(f, [FADE_START, DURATION_IN_FRAMES], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
      {CLICKS.map((c) => (
        <Sequence key={c.at} from={c.at} durationInFrames={12} layout="none">
          <Audio src={staticFile("audio/click.wav")} volume={c.volume} />
        </Sequence>
      ))}
    </>
  );
}
