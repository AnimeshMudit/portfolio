import React from 'react';
import { motion, useTransform, type MotionValue } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { DEPTH, useScene, useSpatialLayer } from '../utils/sceneContext';
import { PROJECTS } from '../data/projects';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The opening is one pinned, native-scrolling sequence (see .hero in
 * index.css: a tall section with a sticky 100svh frame). `intro` (0..1) is the
 * progress through it, and it drives the typography, the plane behind it (see
 * Stage) and the video's playback position from the same source.
 *
 * One focal thought at a time:
 *   A  BACKEND / ENGINEER      wide, establishing
 *   B  / APPLIED AI            closer — what the work is
 *   C  SYSTEMS                 technical identity
 *   D  selected work           projects begin entering the composition
 * Each thought's window is [in-start, in-end, out-start, out-end] on `intro`.
 */
type Window4 = [number, number, number, number];

const THOUGHTS: { win: Window4; lines: string[]; accent?: boolean; meta: string }[] = [
  {
    win: [-0.02, 0, 0.2, 0.29],
    lines: ['Backend', 'Engineer'],
    meta: 'Backend Engineer & Systems Developer — Applied AI & Distributed Systems.',
  },
  {
    win: [0.27, 0.37, 0.48, 0.57],
    lines: ['/ Applied AI'],
    accent: true,
    meta: 'Retrieval, embeddings, multi-agent orchestration, memory, safety boundaries, fallbacks.',
  },
  {
    win: [0.55, 0.65, 0.73, 0.8],
    lines: ['Systems'],
    meta: 'APIs, persistence, business rules, state transitions, and third-party integrations.',
  },
];

const WORK_WINDOW_IN = 0.78;
const WORK_WINDOW_OUT: [number, number] = [0.9, 0.955];
const WORK_TEASER = PROJECTS.slice(0, 4);

interface ThoughtLineProps {
  text: string;
  win: Window4;
  index: number;
  accent?: boolean;
  loadIn?: boolean;
}

/** One masked line: slides up into view, holds, slides up out — reversible with scroll. */
const ThoughtLine: React.FC<ThoughtLineProps> = ({ text, win, index, accent, loadIn }) => {
  const { intro, reduced } = useScene();
  // Lines within a thought are staggered so the block separates as it leaves.
  // The opening thought (win[1] === 0) must be fully in at scroll 0, so only
  // its exit is staggered.
  const s = index * 0.012;
  const sIn = win[1] > 0 ? s : 0;
  const stops: Window4 = [win[0] + sIn, win[1] + sIn, win[2] + s, win[3] + s];
  const y = useTransform(intro, stops, reduced ? ['0%', '0%', '0%', '0%'] : ['108%', '0%', '0%', '-108%']);
  const x = useTransform(intro, stops, reduced ? [0, 0, 0, 0] : [0, 0, 0, index % 2 ? 40 : -40]);
  const opacity = useTransform(intro, stops, [0, 1, 1, 0]);

  return (
    <span className="hero-line">
      <motion.span className="hero-line-scroll" style={{ y, x, opacity }}>
        <motion.span
          className={`hero-line-in ${accent ? 'hero-line-accent' : ''}`}
          initial={loadIn && !reduced ? { y: '108%' } : false}
          animate={{ y: '0%' }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.3 + index * 0.12 }}
        >
          {text}
        </motion.span>
      </motion.span>
    </span>
  );
};

const Thought: React.FC<{ thought: (typeof THOUGHTS)[number]; first?: boolean }> = ({ thought, first }) => {
  const { intro } = useScene();
  const { x: typeX, y: typeY } = useSpatialLayer(DEPTH.typography);
  const { x: metaX, y: metaY } = useSpatialLayer(DEPTH.metadata);
  const [a, b, c, d] = thought.win;
  const Title = first ? motion.h1 : motion.h2;
  // The opening thought's metadata is already present at scroll 0.
  const inA = first ? -0.06 : a + 0.03;
  const inB = first ? -0.05 : b + 0.04;
  const metaOpacity = useTransform(intro, [inA, inB, c - 0.03, d - 0.04], [0, 1, 1, 0]);
  const metaLift = useTransform(intro, [inA, inB], [12, 0]);

  return (
    <div className="hero-thought">
      {/* Only the opening thought is the page's h1; the rest are sequence beats. */}
      <Title className="hero-title" style={{ x: typeX, y: typeY }} aria-label={thought.lines.join(' ')}>
        {thought.lines.map((line, i) => (
          <ThoughtLine key={line} text={line} win={thought.win} index={i} accent={thought.accent} loadIn={first} />
        ))}
      </Title>
      <motion.p className="hero-meta" style={{ x: metaX, y: metaY, opacity: metaOpacity }}>
        <motion.span style={{ y: metaLift, display: 'block' }}>{thought.meta}</motion.span>
      </motion.p>
    </div>
  );
};

const WorkItem: React.FC<{ index: number; title: string; total: number }> = ({ index, title, total }) => {
  const { intro, reduced } = useScene();
  const t = index * 0.022;
  const y = useTransform(intro, [WORK_WINDOW_IN + t, WORK_WINDOW_IN + t + 0.07, WORK_WINDOW_OUT[0], WORK_WINDOW_OUT[1]], reduced ? ['0%', '0%', '0%', '0%'] : ['110%', '0%', '0%', '-110%']);
  const opacity = useTransform(intro, [WORK_WINDOW_IN + t, WORK_WINDOW_IN + t + 0.05, WORK_WINDOW_OUT[0], WORK_WINDOW_OUT[1]], [0, 1, 1, 0]);
  return (
    <li className="hero-work-item">
      <span className="hero-work-index">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
      <span className="hero-line">
        <motion.span className="hero-line-scroll hero-work-title" style={{ y, opacity }}>
          {title}
        </motion.span>
      </span>
    </li>
  );
};

const WorkTeaser: React.FC = () => {
  const { intro } = useScene();
  const { x, y } = useSpatialLayer(DEPTH.typography);
  const labelOpacity = useTransform(intro, [WORK_WINDOW_IN, WORK_WINDOW_IN + 0.06, WORK_WINDOW_OUT[0], WORK_WINDOW_OUT[1]], [0, 1, 1, 0]);
  // The whole block (rules included) is invisible until its window opens.
  const blockOpacity = useTransform(intro, [WORK_WINDOW_IN - 0.04, WORK_WINDOW_IN, WORK_WINDOW_OUT[0], WORK_WINDOW_OUT[1]], [0, 1, 1, 0]);
  return (
    <motion.div className="hero-thought hero-work" style={{ x, y, opacity: blockOpacity }}>
      <motion.p className="hero-work-label" style={{ opacity: labelOpacity }}>
        Selected work — {PROJECTS.length} systems
      </motion.p>
      <ul className="hero-work-list">
        {WORK_TEASER.map((p, i) => (
          <WorkItem key={p.id} index={i} title={p.title} total={PROJECTS.length} />
        ))}
      </ul>
    </motion.div>
  );
};

const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

export const Hero: React.FC = () => {
  const { intro } = useScene();
  const { x: metaX, y: metaY } = useSpatialLayer(DEPTH.metadata);

  // Persistent frame furniture leaves as the sequence resolves into About.
  const nameOpacity = useTransform(intro, [0.78, 0.88], [1, 0]);
  const footerOpacity = useTransform(intro, [0.82, 0.92], [1, 0]);
  const cueOpacity = useTransform(intro, [0, 0.05], [1, 0]);

  return (
    <section id="hero" className="hero">
      <div className="hero-sticky">
        <motion.div className="hero-top" style={{ x: metaX, y: metaY, opacity: nameOpacity }}>
          <p className="hero-name">Animesh Mudit</p>
          <p className="hero-sub">B.Tech CSE — PSIT Kanpur</p>
        </motion.div>

        <div className="hero-body">
          {THOUGHTS.map((t, i) => (
            <Thought key={t.lines[0]} thought={t} first={i === 0} />
          ))}
          <WorkTeaser />
        </div>

        <motion.div className="hero-foot" style={{ x: metaX, y: metaY, opacity: footerOpacity }}>
          <nav className="hero-links" aria-label="Hero links">
            <button onClick={() => scrollToId('projects')} className="hero-link">View work</button>
            <a href="https://github.com/animeshmudit" target="_blank" rel="noopener noreferrer" className="hero-link">GitHub</a>
            <button onClick={() => scrollToId('contact')} className="hero-link">Contact</button>
          </nav>
          <div className="hero-progress">
            <motion.span className="hero-scroll-cue" style={{ opacity: cueOpacity }}>
              Scroll <ArrowDown size={13} />
            </motion.span>
            <span className="hero-progress-track">
              <ProgressFill source={intro} />
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const ProgressFill: React.FC<{ source: MotionValue<number> }> = ({ source }) => (
  <motion.span className="hero-progress-fill" style={{ scaleX: source }} />
);
