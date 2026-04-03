/**
 * hooks/useSwipeGesture.ts – Horizontal swipe detection for day navigation.
 *
 * Tracks touch start/end on a container element.
 * Calls onSwipeLeft or onSwipeRight when a horizontal swipe > threshold is detected.
 */

import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

interface UseSwipeGestureOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number; // min px to count as swipe
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
}: UseSwipeGestureOptions): SwipeHandlers {
  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX.current;
      const diffY = endY - startY.current;

      // Only trigger if horizontal movement > vertical (not a scroll)
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          onSwipeRight(); // swiped right = go to previous day
        } else {
          onSwipeLeft(); // swiped left = go to next day
        }
      }
    },
    [onSwipeLeft, onSwipeRight, threshold],
  );

  return { onTouchStart, onTouchEnd };
}
