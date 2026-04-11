import { spacing } from "../theme";

export const GOALS_ZOOM_COLLAPSED_HEIGHT_RATIO = 0.41;
export const GOALS_ZOOM_COLLAPSED_MIN_HEIGHT = 320;
export const GOALS_ZOOM_COLLAPSED_MAX_HEIGHT = 400;
export const GOALS_ZOOM_EXPANDED_TOP_REVEAL = 96;
export const GOALS_ZOOM_MIN_EXPANDED_DELTA = 150;
export const GOALS_ZOOM_HORIZONTAL_INSET = spacing.sm;

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getGoalsZoomTopReveal(topInset: number) {
  return Math.max(topInset + GOALS_ZOOM_EXPANDED_TOP_REVEAL, 112);
}

export function getGoalsZoomExpandedHeight(windowHeight: number, topInset: number) {
  return Math.max(
    windowHeight - getGoalsZoomTopReveal(topInset),
    GOALS_ZOOM_COLLAPSED_MIN_HEIGHT + GOALS_ZOOM_MIN_EXPANDED_DELTA,
  );
}

export function getGoalsZoomCollapsedHeight(windowHeight: number, topInset: number) {
  const expandedHeight = getGoalsZoomExpandedHeight(windowHeight, topInset);
  const preferredHeight = windowHeight * GOALS_ZOOM_COLLAPSED_HEIGHT_RATIO;
  const maxHeight = Math.max(
    GOALS_ZOOM_COLLAPSED_MIN_HEIGHT,
    Math.min(GOALS_ZOOM_COLLAPSED_MAX_HEIGHT, expandedHeight - GOALS_ZOOM_MIN_EXPANDED_DELTA),
  );

  return clampNumber(preferredHeight, GOALS_ZOOM_COLLAPSED_MIN_HEIGHT, maxHeight);
}

export function getGoalsZoomAlignmentRect({
  topInset,
  windowHeight,
  windowWidth,
}: {
  topInset: number;
  windowHeight: number;
  windowWidth: number;
}) {
  const collapsedHeight = getGoalsZoomCollapsedHeight(windowHeight, topInset);
  return {
    height: collapsedHeight,
    width: Math.max(windowWidth - GOALS_ZOOM_HORIZONTAL_INSET * 2, 1),
    x: GOALS_ZOOM_HORIZONTAL_INSET,
    y: Math.max(windowHeight - collapsedHeight, 0),
  };
}
