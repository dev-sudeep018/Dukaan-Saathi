import { useEffect, useRef, useState } from "react";

/* Count from 0 → target once the element scrolls into view.
   Uses IntersectionObserver + rAF; respects prefers-reduced-motion by
   snapping straight to the final value. */
export function useCountUp(target, { duration = 1600, decimals = 0 } = {}) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || started.current) return;
          started.current = true;

          if (reduce) {
            setValue(target);
            return;
          }

          let raf;
          let startTs;
          const tick = (ts) => {
            if (startTs === undefined) startTs = ts;
            const p = Math.min((ts - startTs) / duration, 1);
            // easeOutCubic
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(target * eased);
            if (p < 1) raf = requestAnimationFrame(tick);
            else setValue(target);
          };
          raf = requestAnimationFrame(tick);
          el._raf = raf;
        });
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  const display =
    decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString("en-IN");

  return { ref, display };
}
