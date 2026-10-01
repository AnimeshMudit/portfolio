import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useMousePosition } from '../utils/mouse';
import { SceneContext, interpolate, type Scene } from '../utils/sceneContext';

/** Fraction of the video the pinned intro consumes; the rest plays out slowly across the page. */
const INTRO_SHARE = 0.82;

// Mouse amplitude per chapter: widest during the intro, calmer in the work
// chapter where content needs to hold still, opening up again to resolve.
const AMP_BY_CHAPTER = [1, 0.75, 0.5, 0.65, 0.9];

// Chapter value at each measured mark (see `measure` below): pairs are the
// arrive/hold points of about, work and skills, then contact is reached.
const CHAPTER_AT_MARK = [0, 1, 1, 2, 2, 3, 3, 4];

/**
 * Owns the one and only scene: mouse (single listener, via useMousePosition),
 * scroll-derived cinematic state, and the single RAF loop that interpolates
 * scroll progress into `video.currentTime`. The loop only runs while the
 * interpolated value is still catching up to its target.
 */
export const SceneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const reduced = !!useReducedMotion();
  const { x: mouseX, y: mouseY, rawX: rawMouseX, rawY: rawMouseY } = useMousePosition();
  const { scrollY } = useScroll();

  // Section geometry, measured outside React state (read every frame by the
  // transforms below): chapter switch points, intro length, page end.
  const geo = useRef({
    heroTop: 0,
    pinEnd: 1,
    docEnd: 2,
    marks: [0, 1, 2, 3, 4, 5, 6, 7] as number[],
    hasField: false,
    workStart: 0,
    workEnd: 1,
  });

  useEffect(() => {
    const measure = () => {
      const vh = window.innerHeight;
      const y = window.scrollY;
      const top = (id: string) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top + y : 0;
      };
      const hero = document.getElementById('hero');
      const heroTop = top('hero');
      const heroH = hero?.offsetHeight ?? vh;
      const pinEnd = heroTop + Math.max(1, heroH - vh);
      // Each chapter is *reached* as its section arrives and *held* until the
      // next section is about to arrive, so a long chapter (Work) doesn't
      // spend its whole length half-way between two states.
      const raw = [
        heroTop + (pinEnd - heroTop) * 0.78, // hero: hold until its final stretch
        top('about') - vh * 0.2, //         about: reached
        top('projects') - vh * 0.75, //     about: held until work approaches
        top('projects') - vh * 0.25, //     work: reached
        top('skills') - vh * 0.75,
        top('skills') - vh * 0.25, //       skills: reached
        top('contact') - vh * 0.75,
        top('contact') - vh * 0.25, //      contact: reached
      ];
      // Strictly increasing so interpolation can never divide by zero.
      for (let i = 1; i < raw.length; i++) raw[i] = Math.max(raw[i], raw[i - 1] + 1);
      // The project constellation's scroll span: the field fades in as its
      // spacer approaches, is live while the spacer fills the viewport, and
      // dissolves into Skills as the spacer leaves. Absent on mobile.
      const spacer = document.getElementById('project-field-spacer');
      const spacerTop = spacer ? top('project-field-spacer') : 0;
      geo.current = {
        heroTop,
        pinEnd,
        docEnd: Math.max(pinEnd + 1, document.documentElement.scrollHeight - vh),
        marks: raw,
        hasField: !!spacer,
        workStart: spacerTop - vh * 0.6,
        workEnd: Math.max(spacerTop - vh * 0.6 + 1, spacerTop + (spacer?.offsetHeight ?? 0) - vh * 0.3),
      };
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    document.fonts?.ready.then(measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('load', measure);
    };
  }, []);

  const intro = useTransform(scrollY, y => {
    const g = geo.current;
    return Math.min(1, Math.max(0, (y - g.heroTop) / (g.pinEnd - g.heroTop)));
  });

  const work = useTransform(scrollY, y => {
    const g = geo.current;
    if (!g.hasField) return 0;
    return Math.min(1, Math.max(0, (y - g.workStart) / (g.workEnd - g.workStart)));
  });

  const chapter = useTransform(scrollY, y => interpolate(y, geo.current.marks, CHAPTER_AT_MARK));

  const spring = { stiffness: 55, damping: 22, mass: 0.7 };
  const introS = useSpring(intro, spring);
  const chapterS = useSpring(chapter, spring);

  const amp = useTransform(chapterS, c => interpolate(c, [0, 1, 2, 3, 4], AMP_BY_CHAPTER));

  // Where the video should be: most of it plays through the pinned intro, the
  // remainder drifts forward across the rest of the page so the environment
  // never freezes into a static backdrop.
  const videoTarget = useTransform(scrollY, y => {
    const g = geo.current;
    const introP = Math.min(1, Math.max(0, (y - g.heroTop) / (g.pinEnd - g.heroTop)));
    const restP = Math.min(1, Math.max(0, (y - g.pinEnd) / (g.docEnd - g.pinEnd)));
    return introP * INTRO_SHARE + restP * (1 - INTRO_SHARE);
  });

  const videoProgress = useMotionValue(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const kickRef = useRef<() => void>(() => {});
  const kick = useCallback(() => kickRef.current(), []);

  useEffect(() => {
    if (reduced) return;

    let raf = 0;
    let running = false;
    let last = 0;

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;

      const target = videoTarget.get();
      const cur = videoProgress.get();
      const next = cur + (target - cur) * (1 - Math.exp(-dt * 7));
      const done = Math.abs(target - next) < 0.0004;
      const value = done ? target : next;
      videoProgress.set(value);

      const v = videoRef.current;
      if (v && v.readyState >= 1 && Number.isFinite(v.duration) && v.duration > 0) {
        const t = value * (v.duration - 0.04);
        // Don't queue seeks behind an in-flight one, except the final settle.
        if (Math.abs(t - v.currentTime) > 0.02 && (!v.seeking || done)) v.currentTime = t;
      }

      if (done) {
        running = false;
      } else {
        raf = requestAnimationFrame(step);
      }
    };

    const wake = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(step);
    };

    kickRef.current = wake;
    const unsub = videoTarget.on('change', wake);
    wake();

    return () => {
      unsub();
      cancelAnimationFrame(raf);
      running = false;
      kickRef.current = () => {};
    };
  }, [reduced, videoTarget, videoProgress]);

  const scene = useMemo<Scene>(
    () => ({
      mouseX, mouseY, rawMouseX, rawMouseY, work, intro, introS, chapter, chapterS, amp, videoProgress, videoRef, kick, reduced,
    }),
    [mouseX, mouseY, rawMouseX, rawMouseY, work, intro, introS, chapter, chapterS, amp, videoProgress, kick, reduced]
  );

  return <SceneContext.Provider value={scene}>{children}</SceneContext.Provider>;
};
