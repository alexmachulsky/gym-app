import { useEffect, useState } from 'react';

/**
 * Animate a number from 0 to `target` over `duration` ms.
 * Returns the current animated value (integer).
 */
export function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0 || typeof target !== 'number') {
      setValue(target || 0);
      return;
    }
    let start = null;
    let frame;
    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
