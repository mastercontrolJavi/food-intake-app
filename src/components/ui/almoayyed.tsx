// --- Component ---
// GradientBackground — recolored from the 21st.dev Gradient Builder export
// ("Almoayyed") to the app's own green brand tokens instead of its original
// purple. Colors are driven by color-mix() against the live CSS variables
// (--background/--primary/--accent) so the gradient re-tints itself for
// light/dark mode automatically, the same way globals.css already blends
// --primary into the page background.
// Zero dependencies: one <div> that fills its parent. Drop it behind your
// content: <div className="relative h-96"><GradientBackground className="absolute inset-0" /></div>
// Original recipe: https://21st.dev/community/gradients/editor?from=dc893a4f-0b29-4732-9b29-d4de9c0b70ee
export function GradientBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        height: "100%",
        containerType: "size",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "var(--background)",
          backgroundImage:
            "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.280'/></svg>\"), radial-gradient(circle at 66.94% 46.43%, color-mix(in oklab, var(--background) 100%, transparent) 0%, color-mix(in oklab, var(--background) 84.4%, transparent) 19.02%, color-mix(in oklab, var(--background) 50%, transparent) 38.05%, color-mix(in oklab, var(--background) 15.6%, transparent) 57.07%, color-mix(in oklab, var(--background) 0%, transparent) 76.1%), radial-gradient(circle at 34.69% 66.31%, color-mix(in oklab, var(--primary) 100%, transparent) 0%, color-mix(in oklab, var(--primary) 84.4%, transparent) 12.73%, color-mix(in oklab, var(--primary) 50%, transparent) 25.45%, color-mix(in oklab, var(--primary) 15.6%, transparent) 38.18%, color-mix(in oklab, var(--primary) 0%, transparent) 50.9%), radial-gradient(circle at 48.93% 19.32%, color-mix(in oklab, color-mix(in oklab, var(--primary) 55%, var(--accent) 45%) 100%, transparent) 0%, color-mix(in oklab, color-mix(in oklab, var(--primary) 55%, var(--accent) 45%) 84.4%, transparent) 16.75%, color-mix(in oklab, color-mix(in oklab, var(--primary) 55%, var(--accent) 45%) 50%, transparent) 33.5%, color-mix(in oklab, color-mix(in oklab, var(--primary) 55%, var(--accent) 45%) 15.6%, transparent) 50.25%, color-mix(in oklab, color-mix(in oklab, var(--primary) 55%, var(--accent) 45%) 0%, transparent) 67%), radial-gradient(circle at 80.23% 87.54%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.844) 10.28%, rgba(255, 255, 255, 0.5) 20.55%, rgba(255, 255, 255, 0.156) 30.83%, rgba(255, 255, 255, 0) 41.1%)",
          backgroundSize: "120px 120px, auto, auto, auto, auto",
          backgroundBlendMode: "overlay, normal, normal, normal, normal",
        }}
      />
      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.28,
          mixBlendMode: "overlay",
        }}
      >
        <filter id="grain-dc893a4f">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-dc893a4f)" />
      </svg>
    </div>
  );
}
