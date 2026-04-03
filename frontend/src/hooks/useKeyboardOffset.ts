/**
 * hooks/useKeyboardOffset.ts – Detects virtual keyboard and returns offset.
 *
 * Uses the VisualViewport API to detect when the on-screen keyboard opens
 * on iOS/Android and calculates how many pixels the bottom UI should shift up.
 */

import { useState, useEffect } from 'react';

/**
 * Returns the number of pixels the bottom of the visual viewport
 * is offset from the bottom of the layout viewport (i.e., keyboard height).
 */
export function useKeyboardOffset(): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // The keyboard height is the difference between the layout viewport
      // height and the visual viewport height, adjusted for scroll.
      const layoutHeight = window.innerHeight;
      const viewportHeight = vv.height;
      const keyboardHeight = layoutHeight - viewportHeight;

      // Only apply offset if keyboard is meaningfully open (> 100px)
      setOffset(keyboardHeight > 100 ? keyboardHeight : 0);
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return offset;
}
