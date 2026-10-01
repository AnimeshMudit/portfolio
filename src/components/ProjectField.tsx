import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { PROJECTS, type ProjectData } from '../data/projects';
import { useScene } from '../utils/sceneContext';

/**
 * The project field: a piece of 2.5D space the cursor flies a camera through.
 * It lives inside the fixed Stage, so it shares the world, the mouse and the
 * scroll with the video plane, haze and geometry.
 *
 *   mouse (central, spring)  → camera position ─┐
 *   scroll (`work`)          → camera progress ─┴→ pose of every project
 *
 * Every project has a deterministic home in *project space* (LAYOUTS, which
 * extends past the viewport) and a depth. For any camera position the pose of
 * each project is computed from that home:
 *
 *   1. parallax   — nearer (higher depth) projects travel further per unit of
 *                   camera movement, so the field shears instead of sliding
 *   2. orbit      — positions rotate about the view centre, near layers one way
 *                   and far layers the other, so the field twists
 *   3. swirl      — a small deterministic curve per project, so trajectories
 *                   bend rather than run in straight lines
 *   4. attraction — the project whose home region the cursor is nearest is
 *                   drawn toward the centre, grows, straightens, comes forward
 *
 * Position, scale, rotation and opacity each go through a per-project spring
 * (stiffer for nearer projects). Nothing is random: the same camera position
 * always produces the same composition.
 */

interface ProjectLayout {
  /** Home in project space, % of the viewport (may lie outside 0..100). */
  x: number;
  y: number;
  /** Size multiplier on a 22vw base — the visual hierarchy. */
  scale: number;
  /** 0.4 (far) .. 1.5 (near): how strongly the camera moves this project. */
  depth: number;
  /** Width / height of the visual crop. */
  aspect: number;
  rotation?: number;
  featured?: boolean;
  /** Scroll position (0..1 along the journey) at which the camera reaches this project: x/y above are where it sits then. */
  at: number;
}

// One world, three planes, travelled by scroll. `depth` is the plane: 1.5
// foreground (moves furthest, largest, brightest), ~1.0 middle, ~0.5 far. `x`/`y`
// are where the project sits (% of the viewport) when scroll reaches its `at`;
// before that it is further along the path (below/beside), after it it has
// been passed (above). Early: RAAHAT with Crafty Mind, SETU arriving. Middle:
// SETU and RepoGuard, News at the edge. Late: RepoGuard leaving, Huddle and
// This Portfolio arriving. Far planes travel less, so they linger and overlap
// the near ones the way distant things do.
const LAYOUTS: Record<string, ProjectLayout> = {
  raahat: { x: 44, y: 52, scale: 1.8, depth: 1.5, aspect: 1.6, featured: true, at: 0.1 },
  'crafty-mind': { x: 25, y: 26, scale: 0.8, depth: 0.5, aspect: 1.25, rotation: -1.5, at: 0.05 },
  setu: { x: 80, y: 38, scale: 1.25, depth: 1.05, aspect: 1.33, rotation: 1.5, at: 0.42 },
  news: { x: 8, y: 58, scale: 0.55, depth: 0.45, aspect: 1.25, rotation: -1, at: 0.55 },
  repoguard: { x: 58, y: 52, scale: 1.2, depth: 0.95, aspect: 1.33, rotation: -1, at: 0.68 },
  huddle: { x: 74, y: 56, scale: 0.85, depth: 0.7, aspect: 1.5, at: 0.85 },
  portfolio: { x: 36, y: 60, scale: 1.05, depth: 0.6, aspect: 1.6, rotation: 1, at: 0.95 },
};

/**
 * The camera's path through the world, in % of the viewport at depth 1: mostly
 * forward (down), bending sideways. A project at depth d is displaced by
 * (path(at) − path(scroll)) × d, so scroll is parallax travel, not a fade.
 */
const PATH_X = 20;
const PATH_Y = 110;
const pathX = (s: number) => PATH_X * Math.sin(s * Math.PI * 1.4);
const pathY = (s: number) => PATH_Y * s;

/** Deterministic fallback for a project added without an art-directed slot. */
function layoutFor(p: ProjectData, i: number): ProjectLayout {
  return (
    LAYOUTS[p.id] ?? {
      x: 12 + ((i * 37) % 76),
      y: 18 + ((i * 29) % 64),
      scale: 0.7,
      depth: 0.5 + ((i * 3) % 7) / 8,
      aspect: 1.4,
      at: i / Math.max(1, PROJECTS.length - 1),
    }
  );
}

// How far the camera moves the field (% of viewport per unit depth at full
// mouse deflection), and how strongly it twists it.
const SHIFT_X = 42;
const SHIFT_Y = 34;
const ORBIT_X = 0.5;
const ORBIT_Y = 0.6;
const ORBIT_PIVOT = { x: 50, y: 50 };
/** Where the focused project is drawn toward. */
const FOCUS_POINT = { x: 54, y: 48 };

interface Pose {
  x: number;
  y: number;
  scale: number;
  rot: number;
  opacity: number;
  z: number;
  focus: number;
}

/** Tablet: pull the composition toward the centre and shrink the objects. */
function useSpread() {
  const [spread, setSpread] = useState(1);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1100px)');
    const update = () => setSpread(mq.matches ? 0.84 : 1);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return spread;
}

interface ObjectProps {
  project: ProjectData;
  index: number;
  layout: ProjectLayout;
  sizeK: number;
  pose: MotionValue<Pose[]>;
  isActive: boolean;
  live: boolean;
  onPin: (i: number) => void;
}

const FieldObjectImpl: React.FC<ObjectProps> = ({ project, index, layout, sizeK, pose, isActive, live, onPin }) => {
  // Nearer projects are stiffer (they respond first); farther ones trail — the
  // field is disturbed like something with mass, not snapped to the cursor.
  const cfg = { stiffness: 50 + 40 * layout.depth, damping: 18, mass: 0.9 };
  const xs = useSpring(useTransform(pose, p => p[index].x), cfg);
  const ys = useSpring(useTransform(pose, p => p[index].y), cfg);
  const scale = useSpring(useTransform(pose, p => p[index].scale), cfg);
  const rotate = useSpring(useTransform(pose, p => p[index].rot), cfg);
  const opacity = useSpring(useTransform(pose, p => p[index].opacity), { stiffness: 90, damping: 20 });
  const focus = useSpring(useTransform(pose, p => p[index].focus), { stiffness: 90, damping: 20 });
  const zIndex = useTransform(pose, p => p[index].z);

  const x = useMotionTemplate`${xs}vw`;
  const y = useMotionTemplate`${ys}vh`;

  // Information follows the visual focus: the title arrives first, the
  // tagline and stack a beat later, and both recede as the camera moves on.
  const capOpacity = useTransform(focus, [0.5, 0.85], [0, 1]);
  const capLift = useTransform(focus, [0.5, 0.85], [8, 0]);
  const metaOpacity = useTransform(focus, [0.78, 1], [0, 1]);

  return (
    <motion.button
      type="button"
      className={`field-obj field-hit ${isActive ? 'is-active' : ''}`}
      style={{
        ['--s' as string]: layout.scale * sizeK,
        ['--ar' as string]: layout.aspect,
        ['--gs' as string]: Math.max(0, (1 - layout.depth / 1.1) * 0.7).toFixed(2),
        x,
        y,
        scale,
        rotate,
        opacity,
        zIndex,
      }}
      tabIndex={live ? 0 : -1}
      onClick={() => onPin(index)}
      onFocus={() => onPin(index)}
      aria-label={`${project.title} — ${project.tagline}`}
    >
      <span className="field-frame">
        {project.image ? (
          <img src={project.image} alt="" loading="lazy" width={640} height={400} />
        ) : (
          <span className="field-flow">
            <span className="field-flow-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <span className="field-flow-text">{project.tech.join(' · ')}</span>
          </span>
        )}
      </span>
      <motion.span className="field-label" style={{ opacity: capOpacity, y: capLift }}>
        <span className="field-cap">
          <span className="field-num">{String(index + 1).padStart(2, '0')}</span>
          <span className="field-name">{project.title}</span>
        </span>
        <motion.span className="field-meta" style={{ opacity: metaOpacity }}>
          <span className="field-tagline">{project.tagline}</span>
          <span className="field-stack">{project.tech.slice(0, 4).join(' · ')}</span>
        </motion.span>
      </motion.span>
    </motion.button>
  );
};

// Memoised: a change of focus re-renders only the objects whose `isActive` flipped.
const FieldObject = React.memo(FieldObjectImpl);

/** The full write-up, opened on demand (click / keyboard) — not a permanent caption. */
const Panel: React.FC<{ project: ProjectData; index: number; onClose: () => void }> = ({ project, index, onClose }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className="field-panel-body"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="field-panel-head">
        <p className="field-panel-index">
          {String(index + 1).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')}
        </p>
        <button type="button" className="field-panel-close" onClick={onClose} aria-label="Close project details">
          <X size={14} />
        </button>
      </div>
      <h3>{project.title}</h3>
      <p className="field-panel-tagline">{project.tagline}</p>
      {project.metric && <span className="project-metric">{project.metric}</span>}
      <div className="project-tags">
        {project.tech.map(t => (
          <span key={t} className="tag">{t}</span>
        ))}
      </div>
      <p className="field-panel-summary">{project.summary}</p>
      <button className="details-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span>Architecture</span>
        <ChevronDown size={14} className={open ? 'rotated' : ''} />
      </button>
      {open && <p className="project-architecture">{project.architecture}</p>}
    </motion.div>
  );
};

export const ProjectField: React.FC = () => {
  const { mouseX, mouseY, rawMouseX, rawMouseY, work, reduced } = useScene();
  const spread = useSpread();
  const sizeK = spread < 1 ? 0.9 : 1;

  const positions = useMemo(
    () =>
      PROJECTS.map((p, i) => {
        const l = layoutFor(p, i);
        return { layout: l, x: 50 + (l.x - 50) * spread, y: 50 + (l.y - 50) * spread };
      }),
    [spread]
  );
  // Read inside motion-value callbacks so they never close over stale layout.
  const posRef = useRef(positions);
  posRef.current = positions;
  const spreadRef = useRef(spread);
  spreadRef.current = spread;

  const aspectRef = useRef(1.78);
  useEffect(() => {
    const update = () => {
      aspectRef.current = window.innerWidth / window.innerHeight;
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ---- holding the camera (rail hover / click / keyboard) ----
  // `lock` freezes the camera at `hold`; `pinIndex` additionally forces one
  // project into focus. A pinned project also opens the detail panel.
  const [pinned, setPinned] = useState<number | null>(null);
  const pinnedRef = useRef<number | null>(null);
  const pinMouse = useRef({ x: 0, y: 0 });
  const uiHover = useRef(false);
  const holdX = useMotionValue(0);
  const holdY = useMotionValue(0);
  const lock = useMotionValue(0);
  const lockS = useSpring(lock, { stiffness: 70, damping: 20 });
  const pinIndex = useMotionValue(-1);

  // The camera input: the mouse, blended toward the frozen pose while held.
  const camX = useTransform([mouseX, holdX, lockS], ([m, h, l]: number[]) => m * (1 - l) + h * l);
  const camY = useTransform([mouseY, holdY, lockS], ([m, h, l]: number[]) => m * (1 - l) + h * l);
  // Scroll is travel along the path: the live window of `work` maps to 0..1.
  // (Reduced motion: parked at the featured project.)
  const journey = useTransform(work, w => (reduced ? LAYOUTS.raahat.at : Math.min(1, Math.max(0, (w - 0.18) / 0.67))));

  // Freeze the camera where it currently is (no-op if already frozen).
  const freezeHere = () => {
    if (lock.get() === 0) {
      holdX.set(mouseX.get());
      holdY.set(mouseY.get());
      lock.set(1);
    }
  };
  const pin = (i: number) => {
    freezeHere();
    pinIndex.set(i);
    pinnedRef.current = i;
    setPinned(i);
    pinMouse.current = { x: rawMouseX.get(), y: rawMouseY.get() };
  };
  const release = () => {
    if (lock.get() === 0 && pinnedRef.current === null) return;
    pinnedRef.current = null;
    pinIndex.set(-1);
    setPinned(null);
    lock.set(0);
  };
  // Travelling away from where the hold started hands the camera back.
  const maybeRelease = () => {
    if (pinnedRef.current === null || uiHover.current) return;
    const d = Math.hypot(rawMouseX.get() - pinMouse.current.x, rawMouseY.get() - pinMouse.current.y);
    if (d > 0.4) release();
  };
  useMotionValueEvent(rawMouseX, 'change', maybeRelease);
  useMotionValueEvent(rawMouseY, 'change', maybeRelease);

  // Reaching for the rail or the panel (both live in a corner) must not fly
  // the camera toward that corner: while the pointer is over them the camera
  // holds still, and on leaving it either resumes or keeps a clicked hold.
  const enterUi = () => {
    uiHover.current = true;
    freezeHere();
  };
  const leaveUi = () => {
    uiHover.current = false;
    if (pinnedRef.current === null) lock.set(0);
    else pinMouse.current = { x: rawMouseX.get(), y: rawMouseY.get() };
  };

  // Stable identity for the memoised objects; always calls the latest `pin`.
  const pinRef = useRef(pin);
  pinRef.current = pin;
  const onPin = useCallback((i: number) => pinRef.current(i), []);

  // ---- the pose of every project, from camera + cursor + hold ----
  const pose = useTransform(
    [camX, camY, journey, lockS, pinIndex],
    ([mx, my, sRaw, l, pi]: number[]): Pose[] => {
      const aspect = aspectRef.current;
      const k = spreadRef.current;
      // Pinning a project flies the journey to it (scroll itself is untouched).
      const sc = pi >= 0 ? sRaw + (posRef.current[pi].layout.at - sRaw) * l : sRaw;
      const cx = mx; // mouse looks around the current region
      const cy = my;
      // The path also twists the field a little (orbit / swirl), so it bends.
      const tx = cx + pathX(sc) / 40;
      const ty = cy + (sc - 0.5) * 0.8;
      // The cursor, in % of the viewport (focus follows the cursor, not the scroll).
      const curX = (mx + 1) * 50;
      const curY = (my + 1) * 50;

      // 1–3: deform every project's home by the camera.
      const deformed = posRef.current.map(({ layout, x: hx, y: hy }, i) => {
        const d = layout.depth;
        // Where the scroll journey has put this project (before the mouse looks).
        const bx = hx + (pathX(layout.at) - pathX(sc)) * d * k;
        const by = hy + (pathY(layout.at) - pathY(sc)) * d * k;
        let x = bx - cx * SHIFT_X * d * k;
        let y = by - cy * SHIFT_Y * d * k;

        // Orbit about the view centre, in isotropic units so it is a true rotation.
        const theta = (ORBIT_X * tx + ORBIT_Y * ty) * (d - 0.95);
        const u = (x - ORBIT_PIVOT.x) * aspect;
        const v = y - ORBIT_PIVOT.y;
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        x = ORBIT_PIVOT.x + (u * c - v * s) / aspect;
        y = ORBIT_PIVOT.y + (u * s + v * c);

        // Swirl: a per-project curve (deterministic phase); zero when the camera is centred.
        const phase = i * 1.7;
        x += 7 * d * k * (Math.sin(1.6 * ty + phase) - Math.sin(phase));
        y += 8 * d * k * (Math.sin(1.6 * tx + phase + 1.1) - Math.sin(phase + 1.1));
        return { x, y, layout, bx, by };
      });

      // Focus: measured from the cursor to each project's *home region* — so
      // "cursor toward the left" means the left-side projects lead, however far
      // the camera has since pushed them. The nearest project is always the
      // leader; the rest ease back with distance (never zero).
      const near = deformed.map(({ layout, bx, by }) => {
        const dist = Math.hypot((curX - bx) * aspect, curY - by);
        const threshold = 26 + 16 * layout.scale;
        return 1 / (1 + Math.pow(dist / threshold, 3));
      });
      const top = Math.max(...near);

      return deformed.map(({ x, y, layout }, i) => {
        // Only what the journey has actually brought near the cursor can lead.
        let f = Math.pow(near[i] / top, 2) * Math.min(1, near[i] / 0.3);
        const isPinned = pi === i;
        if (pi >= 0) f = isPinned ? f + (1 - f) * l : f * (1 - 0.65 * l);

        // 4: attraction toward the focus point, growth, straightening.
        const pull = 0.36 * f * f + (isPinned ? 0.5 * l : 0);
        const px = x + (FOCUS_POINT.x - x) * pull;
        const py = y + (FOCUS_POINT.y - y) * pull;
        const d = layout.depth;
        // Arrival: the leader grows, and small/far projects grow most, so any
        // project reads as "arrived at" whatever plane it lives on.
        const arrive = 1 + 0.55 * f * f * Math.max(0, 1.3 - layout.scale);
        const grow = (0.8 + 0.3 * f) * (0.86 + 0.16 * d) * arrive * (isPinned ? 1 + 0.08 * l : 1);
        const rot = ((layout.rotation ?? 0) + cx * 4 * (d - 0.9)) * (1 - 0.8 * f);

        return {
          x: px,
          y: py,
          scale: grow,
          rot,
          // far planes sit dimmer even when nearest the cursor
          opacity: (0.3 + 0.7 * f) * (0.74 + 0.26 * Math.min(1, d / 1.2)),
          z: Math.round(d * 20 + f * 40),
          focus: f,
        };
      });
    }
  );

  // Which project is "the" focus (rail highlight, keyboard order) — with
  // hysteresis so it doesn't flicker when two are nearly equally near.
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  useMotionValueEvent(pose, 'change', ps => {
    let best = 0;
    for (let i = 1; i < ps.length; i++) if (ps[i].focus > ps[best].focus) best = i;
    if (best !== activeRef.current && ps[best].focus > (ps[activeRef.current]?.focus ?? 0) + 0.08) {
      activeRef.current = best;
      setActive(best);
    }
  });

  // ---- scroll: presence ----
  const opacity = useTransform(work, [0, 0.15, 0.88, 1], [0, 1, 1, 0]);
  const worldScale = useTransform(work, [0, 1], reduced ? [1, 1] : [0.96, 1.05]);

  // Only interactive while the field is actually in front of the reader.
  const [live, setLive] = useState(false);
  useMotionValueEvent(work, 'change', w => {
    const on = w > 0.18 && w < 0.85;
    setLive(on);
    if (!on) release();
  });

  const focusedIndex = pinned ?? active;

  return (
    <motion.div className={`field ${live ? 'is-live' : ''}`} style={{ opacity }}>
      <motion.div className="field-world" style={{ scale: worldScale }} inert={!live}>
        {PROJECTS.map((p, i) => (
          <FieldObject
            key={p.id}
            project={p}
            index={i}
            layout={positions[i].layout}
            sizeK={sizeK}
            pose={pose}
            isActive={focusedIndex === i}
            live={live}
            onPin={onPin}
          />
        ))}
      </motion.div>

      <div className="field-ui" inert={!live}>
        <nav className="field-rail field-hit" aria-label="Jump to project" onPointerEnter={enterUi} onPointerLeave={leaveUi}>
          {PROJECTS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`field-rail-item ${focusedIndex === i ? 'active' : ''}`}
              aria-current={focusedIndex === i ? 'true' : undefined}
              onClick={() => pin(i)}
            >
              <span className="field-rail-tick" />
              <span className="field-rail-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="field-rail-label">{p.title}</span>
            </button>
          ))}
        </nav>

        {pinned !== null && (
          <div className="field-panel field-hit" onPointerEnter={enterUi} onPointerLeave={leaveUi}>
            <Panel key={PROJECTS[pinned].id} project={PROJECTS[pinned]} index={pinned} onClose={release} />
          </div>
        )}

        <p className="field-hint">Move the cursor to travel through the field · click a project to open it</p>
      </div>
    </motion.div>
  );
};
