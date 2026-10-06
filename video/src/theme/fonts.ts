import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

/**
 * Geist variable (OFL, same family next/font/google serves the app). Rendering is blocked until the
 * face is loaded so no frame is ever drawn with a fallback font.
 */
let loaded = false;

export function ensureFonts() {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const handle = delayRender("Loading Geist");
  const face = new FontFace("Geist", `url(${staticFile("fonts/Geist-Variable.woff2")}) format("woff2")`, {
    weight: "100 900",
    style: "normal",
  });
  face
    .load()
    .then((f) => {
      document.fonts.add(f);
      return document.fonts.ready;
    })
    .then(() => continueRender(handle))
    // A missing font must fail the render, never fall back silently.
    .catch((err) => cancelRender(err));
}
