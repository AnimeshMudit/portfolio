import { useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, useReducedMotion, type MotionValue } from 'framer-motion';
import { useIsMobile } from './scroll';

/**
 * The single source of mouse-position truth for the app. Attaches exactly one
 * `mousemove` listener (only on fine-pointer, motion-OK devices) and exposes
 * spring-smoothed, normalized (-1..1) motion values. Consumers derive their
 * own parallax offsets with `useParallaxLayer` rather than reading raw
 * coordinates or re-subscribing to the DOM event — this hook should be
 * called once per page (currently: once, in `Hero`) and the resulting motion
 * values passed down as props.
 */
export function useMousePosition() {
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  useEffect(() => {
    if (isMobile || shouldReduceMotion) return;

    const handleMove = (e: MouseEvent) => {
      rawX.set((e.clientX / window.innerWidth) * 2 - 1);
      rawY.set((e.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, [isMobile, shouldReduceMotion, rawX, rawY]);

  // Inertia: the visual gently catches up to the cursor rather than tracking
  // it 1:1. Low stiffness / higher damping = a slow, physical "settle".
  const x = useSpring(rawX, { stiffness: 40, damping: 20, mass: 0.6 });
  const y = useSpring(rawY, { stiffness: 40, damping: 20, mass: 0.6 });

  // `rawX`/`rawY` are the un-smoothed cursor (same single listener) for the few
  // consumers that need "did the pointer actually move" rather than a
  // camera-like value — e.g. releasing a held project focus.
  return { x, y, rawX, rawY };
}

/** Derives a depth layer's translate offset from the shared mouse motion values. */
export function useParallaxLayer(
  x: MotionValue<number>,
  y: MotionValue<number>,
  strengthX: number,
  strengthY: number = strengthX
) {
  const layerX = useTransform(x, v => v * strengthX);
  const layerY = useTransform(y, v => v * strengthY);
  return { x: layerX, y: layerY };
}
