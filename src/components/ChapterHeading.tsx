import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { DEPTH, useSpatialLayer } from '../utils/sceneContext';

interface ChapterHeadingProps {
  eyebrow: string;
  title: string;
  lead?: string;
}

/**
 * Section heading that belongs to the scene rather than to a one-shot reveal:
 * the title rises out of its mask as it crosses the viewport (scroll-linked,
 * so it also reverses on scroll-up) and drifts a touch with the mouse at
 * typography depth.
 */
export const ChapterHeading: React.FC<ChapterHeadingProps> = ({ eyebrow, title, lead }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { x, y } = useSpatialLayer(DEPTH.typography);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 94%', 'start 56%'] });

  const titleY = useTransform(scrollYProgress, [0, 1], reduced ? ['0%', '0%'] : ['108%', '0%']);
  const eyebrowOpacity = useTransform(scrollYProgress, [0, 0.6], [0, 1]);
  const leadOpacity = useTransform(scrollYProgress, [0.25, 1], [0, 1]);
  const leadY = useTransform(scrollYProgress, [0.25, 1], reduced ? [0, 0] : [16, 0]);

  return (
    <div ref={ref} className="chapter-heading">
      <motion.span className="eyebrow" style={{ opacity: eyebrowOpacity }}>
        {eyebrow}
      </motion.span>
      <motion.div style={{ x, y }}>
        <div className="chapter-title-mask">
          <motion.h2 className="section-title" style={{ y: titleY }}>
            {title}
          </motion.h2>
        </div>
      </motion.div>
      {lead && (
        <motion.p className="section-lead" style={{ opacity: leadOpacity, y: leadY }}>
          {lead}
        </motion.p>
      )}
    </div>
  );
};
