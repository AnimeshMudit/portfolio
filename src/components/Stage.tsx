import React, { useState } from 'react';
import { motion, useMotionTemplate, useTransform } from 'framer-motion';
import { DEPTH, interpolate, useScene, useSpatialLayer } from '../utils/sceneContext';
import { useIsMobile } from '../utils/scroll';
import { ProjectField } from './ProjectField';

/**
 * The fixed visual environment behind the whole page. Layers, back to front:
 *
 *   background      0.5x   faint architectural grid
 *   atmosphere      0.8x   haze that changes tone per chapter
 *   main visual     1.0x   the scrubbed video plane
 *   secondary       1.4x   hairline geometry
 *   foreground      1.8x   a glare streak
 *   (typography     0.2x   lives in the DOM, see Hero / ChapterHeading)
 *
 * Each layer is two nested elements: the outer one carries the scroll-driven
 * chapter state (position/scale/opacity keyed to `chapterS` / `introS`), the
 * inner one carries the mouse offset. They never share a transform property.
 * Everything is motion-value driven: no React state changes per frame.
 */

const CHAPTER_STOPS = [0, 1, 2, 3, 4];
const CHAPTER_LABELS = ['Intro', 'About', 'Work', 'Skills', 'Contact'];

function useChapterKeyed(values: number[]) {
  const { chapterS } = useScene();
  return useTransform(chapterS, c => interpolate(c, CHAPTER_STOPS, values));
}

const Background: React.FC = () => {
  const { x, y } = useSpatialLayer(DEPTH.background);
  return (
    <motion.div className="stage-layer" style={{ x, y }}>
      <div className="stage-grid" />
    </motion.div>
  );
};

const Atmosphere: React.FC = () => {
  const { x, y } = useSpatialLayer(DEPTH.atmosphere);
  const blueX = useChapterKeyed([0, -12, 10, -6, 4]);
  const blueOpacity = useChapterKeyed([1, 0.8, 0.35, 0.6, 0.9]);
  const hazeY = useChapterKeyed([0, 8, 0, -8, 4]);
  return (
    <motion.div className="stage-layer" style={{ x, y }}>
      <motion.div className="stage-haze stage-haze-blue" style={{ x: useMotionTemplate`${blueX}vw`, opacity: blueOpacity }} />
      <motion.div className="stage-haze stage-haze-grey" style={{ y: useMotionTemplate`${hazeY}vh` }} />
    </motion.div>
  );
};

const VisualPlane: React.FC = () => {
  const { videoRef, kick, introS, reduced } = useScene();
  const isMobile = useIsMobile();
  const [videoFailed, setVideoFailed] = useState(false);
  const { x: mx, y: my } = useSpatialLayer(DEPTH.visual);

  // Chapter state: where the plane sits and how present it is. Desktop slides
  // it around the frame; mobile keeps it anchored and only changes presence.
  const shiftVw = useChapterKeyed(isMobile ? [0, 0, 0, 0, 0] : [0, 16, 0, 22, 0]);
  const chapterScale = useChapterKeyed([1, 0.92, 1, 0.86, 1.06]);
  const opacity = useChapterKeyed([1, 0.55, 0.17, 0.3, 0.45]);

  // Intro: the visual expands as the hero typography exits.
  const expand = useTransform(introS, [0.55, 0.92], [1, 1.14]);
  const scale = useTransform([chapterScale, expand], ([a, b]: number[]) => a * b);
  const x = useMotionTemplate`${shiftVw}vw`;

  // Camera: the footage itself is scrubbed by scroll (see SceneProvider); this
  // adds a slow push-in on top, so the plane is never quite still.
  const push = useTransform(introS, [0, 1], [1.08, 1.22]);

  return (
    <motion.div className="stage-layer stage-plane-wrap" style={{ x, scale, opacity }}>
      <motion.div className="stage-plane" style={{ x: mx, y: my }}>
        <div className="stage-plane-ambient" />
        {reduced || videoFailed ? (
          reduced && <img className="stage-video" src="/media/hero-poster.jpg" alt="" />
        ) : (
          <motion.video
            ref={videoRef}
            className="stage-video"
            style={{ scale: push }}
            muted
            playsInline
            preload="auto"
            poster="/media/hero-poster.jpg"
            onLoadedMetadata={kick}
            onLoadedData={kick}
            onError={() => setVideoFailed(true)}
          >
            <source src="/media/hero-scrub.mp4" type="video/mp4" />
          </motion.video>
        )}
      </motion.div>
    </motion.div>
  );
};

const Geometry: React.FC = () => {
  const { x, y } = useSpatialLayer(DEPTH.secondary);
  const shiftX = useChapterKeyed([0, -5, 4, -3, 0]);
  const opacity = useChapterKeyed([0.9, 0.55, 0.28, 0.45, 0.65]);
  return (
    <motion.div className="stage-layer stage-geometry" style={{ x, y, opacity }}>
      <motion.svg
        className="stage-lines"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ x: useMotionTemplate`${shiftX}vw` }}
      >
        <line x1="34" y1="0" x2="34" y2="100" />
        <line x1="61" y1="0" x2="61" y2="100" />
        <line x1="88" y1="0" x2="88" y2="100" />
        <line x1="0" y1="72" x2="100" y2="72" />
      </motion.svg>
    </motion.div>
  );
};

const Glare: React.FC = () => {
  const { x, y } = useSpatialLayer(DEPTH.foreground);
  const shiftX = useChapterKeyed([0, 10, -8, 6, -2]);
  const opacity = useChapterKeyed([0.9, 0.5, 0.2, 0.35, 0.55]);
  return (
    <motion.div className="stage-layer" style={{ x, y, opacity }}>
      <motion.div className="stage-glare" style={{ x: useMotionTemplate`${shiftX}vw`, skewX: -12 }} />
    </motion.div>
  );
};

/** Cursor-following light with the mouse spring's own inertia. */
const CursorLight: React.FC = () => {
  const { mouseX, mouseY } = useScene();
  const lx = useTransform(mouseX, [-1, 1], ['15%', '85%']);
  const ly = useTransform(mouseY, [-1, 1], ['15%', '85%']);
  const background = useMotionTemplate`radial-gradient(720px circle at ${lx} ${ly}, rgba(255,255,255,0.55), transparent 62%)`;
  return <motion.div className="stage-layer stage-light" style={{ background }} />;
};

/** Small chapter readout: cross-fades with the chapter position. */
const ChapterMarker: React.FC = () => {
  const { chapterS } = useScene();
  return (
    <div className="stage-marker" aria-hidden="true">
      {CHAPTER_LABELS.map((label, i) => (
        <ChapterMarkerLabel key={label} index={i} label={label} source={chapterS} />
      ))}
    </div>
  );
};

const ChapterMarkerLabel: React.FC<{ index: number; label: string; source: ReturnType<typeof useScene>['chapterS'] }> = ({
  index,
  label,
  source,
}) => {
  const opacity = useTransform(source, [index - 0.5, index, index + 0.5], [0, 1, 0]);
  return (
    <motion.span style={{ opacity }}>
      {String(index).padStart(2, '0')} — {label}
    </motion.span>
  );
};

export const Stage: React.FC = () => {
  const { reduced } = useScene();
  const isMobile = useIsMobile();
  // Decorative layers are hidden from assistive tech; the project field is real
  // (focusable) content and is not. On mobile the projects are an ordinary
  // vertical list in the page flow instead (see Projects.tsx).
  return (
    <div className="stage">
      <div className="stage-decor" aria-hidden="true">
        <Background />
        <Atmosphere />
        <VisualPlane />
        <Geometry />
      </div>
      {!isMobile && <ProjectField />}
      <div className="stage-decor" aria-hidden="true">
        <Glare />
        {!reduced && <CursorLight />}
        <ChapterMarker />
      </div>
    </div>
  );
};
