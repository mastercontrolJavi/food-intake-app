import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

/**
 * Geist variable (OFL, same family next/font/google serves the app). Rendering is blocked until the
 * face is loaded so no frame is ever drawn with a fallback font. The returned promise also gates layout
 * measurement (lib/measure.ts): text wraps differently in a fallback font, so nothing is measured before
 * Geist is in.
 */
let ready: Promise<void> | null = null;

export function ensureFonts(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (ready) return ready;
  const handle = delayRender("Loading Geist");
  const face = new FontFace("Geist", `url(${staticFile("fonts/Geist-Variable.woff2")}) format("woff2")`, {
    weight: "100 900",
    style: "normal",
  });
  ready = face
    .load()
    .then((f) => {
      document.fonts.add(f);
      return document.fonts.ready;
    })
    .then(() => continueRender(handle));
  // A missing font must fail the render, never fall back silently.
  ready.catch((err) => cancelRender(err));
  return ready;
}
