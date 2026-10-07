import { useCallback, useLayoutEffect, useRef, useState, type MutableRefObject } from "react";
import { continueRender, delayRender } from "remotion";
import { ensureFonts } from "../theme/fonts";

/**
 * Measures named elements inside a page root in page css px (offset chain, so camera transforms never
 * affect the result). Rendering is held with delayRender until the first measurement lands, so camera
 * targets, cursor paths and hero landing points always come from the real laid-out UI.
 */
export type Rect = { x: number; y: number; w: number; h: number; cx: number; cy: number };
const ZERO: Rect = { x: 0, y: 0, w: 0, h: 0, cx: 0, cy: 0 };

function offsetWithin(el: HTMLElement, root: HTMLElement): Rect {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}

export function usePageRects<K extends string>(
  keys: readonly K[],
  lists: Record<string, MutableRefObject<(HTMLElement | null)[]>> = {},
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const els = useRef<Partial<Record<K, HTMLElement | null>>>({});
  const [rects, setRects] = useState<Record<K, Rect> | null>(null);
  const [listRects, setListRects] = useState<Record<string, Rect[]>>({});
  const [handle] = useState(() => delayRender("Measuring page layout"));

  const ref = useCallback(
    (key: K) => (el: HTMLElement | null) => {
      els.current[key] = el;
    },
    [],
  );

  useLayoutEffect(() => {
    let cancelled = false;
    // Measure only once Geist is in: a fallback font wraps text differently and shifts everything below it.
    ensureFonts().then(() => {
      if (cancelled) return;
      const root = rootRef.current;
      if (root) {
        const out = {} as Record<K, Rect>;
        for (const key of keys) {
          const el = els.current[key];
          out[key] = el ? offsetWithin(el, root) : ZERO;
        }
        const outLists: Record<string, Rect[]> = {};
        for (const [name, arr] of Object.entries(lists)) {
          outLists[name] = arr.current.map((el) => (el ? offsetWithin(el, root) : ZERO));
        }
        setRects(out);
        setListRects(outLists);
      }
      continueRender(handle);
    });
    return () => {
      cancelled = true;
    };
    // Layout is static for the life of a scene; measure once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);

  return { rootRef, ref, rects, listRects };
}
