import React, { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useActiveInView, useIsMobile } from '../utils/scroll';
import { DEPTH, useSpatialLayer } from '../utils/sceneContext';
import { PROJECTS, type ProjectData } from '../data/projects';
import { ChapterHeading } from './ChapterHeading';

const PROJECT_IDS = PROJECTS.map(p => `project-${p.id}`);

/**
 * Each project is its own scene. `q` is the scene's transit through the
 * viewport (0 = entering from below, 1 = gone above): the visual arrives and
 * dominates, the copy trails it, and as the next project rises this one
 * recedes — all scroll-linked, so it reverses cleanly, and all
 * transform/opacity. The mouse nudges the numeral and body at typography /
 * metadata depth so the chapter still sits inside the shared scene.
 */
const ProjectScene: React.FC<{ project: ProjectData; index: number; isActive: boolean }> = ({ project, index, isActive }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  const k = reduced ? 0 : isMobile ? 0.5 : 1;

  const { scrollYProgress: q } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  const sceneOpacity = useTransform(q, [0, 0.22, 0.72, 1], [0, 1, 1, 0.15]);
  const mediaY = useTransform(q, [0, 1], [70 * k, -70 * k]);
  const mediaScale = useTransform(q, [0, 0.35, 1], [1 + 0.1 * k, 1, 1 - 0.04 * k]);
  const bodyY = useTransform(q, [0, 0.4, 1], [110 * k, 0, -50 * k]);
  const numeralX = useTransform(q, [0, 0.5, 1], [-60 * k, 0, 60 * k]);

  const { x: numX, y: numY } = useSpatialLayer(DEPTH.typography);
  const { x: bodyX, y: bodyMouseY } = useSpatialLayer(DEPTH.metadata);

  const flip = index % 2 === 1;

  return (
    <motion.article
      ref={ref}
      id={`project-${project.id}`}
      className={`project-scene ${flip ? 'flip' : ''} ${isActive ? 'active' : ''}`}
      style={{ opacity: sceneOpacity }}
    >
      <motion.span className="project-numeral" aria-hidden="true" style={{ x: numeralX }}>
        <motion.span style={{ display: 'block', x: numX, y: numY }}>{String(index + 1).padStart(2, '0')}</motion.span>
      </motion.span>

      <div className="project-visual">
        {project.image ? (
          <div className="project-media">
            <motion.img
              src={project.image}
              alt={`${project.title} interface`}
              loading="lazy"
              width={640}
              height={400}
              style={{ y: mediaY, scale: mediaScale }}
            />
          </div>
        ) : (
          <div className="project-media project-media-flow" aria-hidden="true">
            <motion.span className="mono-tag" style={{ y: mediaY }}>
              {project.architecture.split('→')[0].trim()}
            </motion.span>
          </div>
        )}
      </div>

      <motion.div className="project-body" style={{ y: bodyY }}>
        <motion.div style={{ x: bodyX, y: bodyMouseY }}>
          <div className="project-heading">
            <h3>{project.title}</h3>
          </div>
          <p className="project-tagline">{project.tagline}</p>
          {project.metric && <span className="project-metric">{project.metric}</span>}

          <div className="project-tags">
            {project.tech.map(t => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>

          <p className="project-summary">{project.summary}</p>

          <button className="details-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
            <span>Architecture</span>
            <ChevronDown size={14} className={open ? 'rotated' : ''} />
          </button>

          {open && <p className="project-architecture">{project.architecture}</p>}
        </motion.div>
      </motion.div>
    </motion.article>
  );
};

/** Mobile: a simple vertical progression — one project in focus at a time. */
const MobileProjects: React.FC = () => {
  const activeId = useActiveInView(PROJECT_IDS, '-45% 0px -45% 0px');
  return (
    <div className="projects-list">
      {PROJECTS.map((p, i) => (
        <ProjectScene key={p.id} project={p} index={i} isActive={activeId === `project-${p.id}`} />
      ))}
    </div>
  );
};

/**
 * Desktop/tablet: the projects are the constellation inside the fixed Stage
 * (see ProjectField.tsx). This section only supplies the heading and the
 * scroll distance the constellation plays out over (`#project-field-spacer`,
 * which the scene measures). Mobile falls back to the vertical list.
 */
export const Projects: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <section id="projects" className={`section container container-wide ${isMobile ? '' : 'projects-constellation'}`}>
      <ChapterHeading
        eyebrow="02 — Work"
        title="Selected projects & system architectures."
        lead="Seven production-oriented systems spanning applied AI, backend infrastructure, payments, and security."
      />

      {isMobile ? <MobileProjects /> : <div id="project-field-spacer" className="projects-spacer" aria-hidden="true" />}
    </section>
  );
};
