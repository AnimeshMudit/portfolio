import { createContext, useContext, type RefObject } from 'react';
import { useTransform, type MotionValue } from 'framer-motion';

/**
 * The "scene" is the single visual state the whole page derives from:
 *
 *   mouse  → spatial offset  ─┐
 *                              ├→ every layer's final transform
 *   scroll → cinematic state ─┘
 *
 * Mouse controls where you look; scroll controls where you are in the story.
 * Layers never own their own listeners — they read these motion values.
 */
export interface Scene {
  /** Spring-smoothed cursor, normalized -1..1 (inert on mobile / reduced motion). */
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  /** 0..1 progress through the pinned hero sequence (raw, exactly scroll-linked). */
  intro: MotionValue<number>;
  /** Same, spring-smoothed — for the physical environment (stage layers). */
  introS: MotionValue<number>;
  /** Continuous chapter position: 0 hero, 1 about, 2 work, 3 skills, 4 contact. */
  chapter: MotionValue<number>;
  chapterS: MotionValue<number>;
  /** Un-smoothed cursor, -1..1 (same listener as mouseX/Y). */
  rawMouseX: MotionValue<number>;
  rawMouseY: MotionValue<number>;
  /** 0..1 through the project constellation's scroll span (0 when there is none, e.g. mobile). */
  work: MotionValue<number>;
  /** How strongly the mouse moves the scene right now (varies by chapter). */
  amp: MotionValue<number>;
  /** Interpolated video position, 0..1 (what currentTime is set from). */
  videoProgress: MotionValue<number>;
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Wake the interpolation loop (e.g. when the video's metadata arrives). */
  kick: () => void;
  reduced: boolean;
}

export const SceneContext = createContext<Scene | null>(null);

export function useScene(): Scene {
  const scene = useContext(SceneContext);
  if (!scene) throw new Error('useScene must be used inside <SceneProvider>');
  return scene;
}

export const CHAPTER_IDS = ['hero', 'about', 'projects', 'skills', 'contact'] as const;

/**
 * Per-layer mouse strength, relative to the main visual (1.0). Multiplied by
 * MOUSE_BASE px and by the chapter's `amp`.
 */
export const DEPTH = {
  background: 0.5,
  atmosphere: 0.8,
  visual: 1.0,
  secondary: 1.4,
  foreground: 1.8,
  metadata: 0.4,
  typography: 0.2,
} as const;

export const MOUSE_BASE = 24;

/**
 * A layer's mouse-driven offset. Scene layers move against the cursor (you
 * look right, near things slide left faster than far things), scaled by the
 * chapter's amplitude so the "looking" responds to where you are in the story.
 */
export function useSpatialLayer(depth: number) {
  const { mouseX, mouseY, amp } = useScene();
  const s = -depth * MOUSE_BASE;
  const x = useTransform([mouseX, amp], ([m, a]: number[]) => m * a * s);
  const y = useTransform([mouseY, amp], ([m, a]: number[]) => m * a * s);
  return { x, y };
}

/** Piecewise-linear lookup that clamps at both ends. */
export function interpolate(v: number, marks: number[], values: number[]) {
  if (v <= marks[0]) return values[0];
  const last = marks.length - 1;
  if (v >= marks[last]) return values[last];
  let i = 1;
  while (v > marks[i]) i++;
  const t = (v - marks[i - 1]) / (marks[i] - marks[i - 1]);
  return values[i - 1] + (values[i] - values[i - 1]) * t;
}
