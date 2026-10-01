import { useEffect, useRef, useState } from 'react';
import { useScroll, useTransform, useReducedMotion, type MotionValue } from 'framer-motion';

/**
 * Tracks a boolean media-query match (used to scale down parallax ranges on
 * smaller viewports instead of disabling motion outright).
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsMobile(mq.matches);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Shared scroll-parallax primitive. Wraps framer-motion's useScroll/useTransform
 * (rAF-batched, compositor-friendly — no React re-renders per frame) so every
 * section derives its transforms the same way instead of each one wiring up
 * its own scroll math. Ranges automatically shrink on mobile and collapse to
 * zero under prefers-reduced-motion.
 */
type ScrollEdge = 'start' | 'end';
type ScrollOffsetPoint = `${ScrollEdge} ${ScrollEdge}`;
type ScrollOffset = [ScrollOffsetPoint, ScrollOffsetPoint];

export function useScrollParallax(
  ref: React.RefObject<HTMLElement | null>,
  range: [number, number] = [-24, 24],
  offset: ScrollOffset = ['start end', 'end start']
) {
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset,
  });

  const factor = shouldReduceMotion ? 0 : isMobile ? 0.4 : 1;
  const scaledRange: [number, number] = [range[0] * factor, range[1] * factor];

  const y = useTransform(scrollYProgress, [0, 1], scaledRange);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.6, 1, 1, 0.6]);

  return { scrollYProgress, y, opacity };
}

/**
 * One IntersectionObserver shared by every consumer that needs to know which
 * section id is currently "active" (nav highlighting, a project rail, etc.)
 * instead of each caller recomputing scroll position on every render.
 */
export function useActiveInView(ids: string[], rootMargin = '-40% 0px -50% 0px') {
  const [activeId, setActiveId] = useState<string>('');
  const idsKey = ids.join(',');

  useEffect(() => {
    const elements = ids.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (elements.length === 0) return;

    // Track the *set* of sections currently in the band and derive the active
    // one from it (the last in page order), so leaving a section always
    // re-resolves — a jump-scroll can't leave a stale id behind.
    const inBand = new Set<string>();
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) inBand.add(entry.target.id);
          else inBand.delete(entry.target.id);
        });
        const current = ids.filter(id => inBand.has(id)).pop();
        setActiveId(current ?? '');
      },
      { rootMargin, threshold: 0 }
    );

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, rootMargin]);

  return activeId;
}

/** Whole-page scroll progress (0-1), for a nav progress bar etc. */
export function usePageScrollProgress(): MotionValue<number> {
  const { scrollYProgress } = useScroll();
  return scrollYProgress;
}

export function useElementRef<T extends HTMLElement>() {
  return useRef<T>(null);
}
