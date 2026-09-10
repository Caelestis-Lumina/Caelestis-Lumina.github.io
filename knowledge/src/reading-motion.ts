import {smooth} from './rhine/motion.ts';

export const READING_MOTION = {open: 2200, close: 1900, handoff: .8} as const;
export const readingHandoff = (progress: number) => smooth((progress - READING_MOTION.handoff) / (1 - READING_MOTION.handoff));

/** Overlapping actions share the archive's acceleration/settling curve and one clock. */
export function readingPose(t: number) {
  const segment = (start: number, end: number) => smooth((t - start) / (end - start));
  return {lift: segment(0, .4), center: segment(0, .7), open: segment(.18, .65),
    paper: segment(.32, .78), approach: segment(.5, 1)};
}
