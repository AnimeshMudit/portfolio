# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page portfolio site for Animesh Mudit (Backend Engineer & Systems Developer — Applied AI & Distributed Systems), built with React 19 + TypeScript + Vite. Light, Apple-inspired design system (see `src/index.css`), animated with Framer Motion.

Not a git repository — there is no `.git` here, so git-based workflows (diffs, commits, branches) aren't available unless the user initializes one.

**Content policy:** every user-facing claim (projects, metrics, skills, bio, credentials) must trace back to `animesh master resume.pdf` in the project root. Do not invent achievements, metrics, or projects — a previous iteration of this codebase had two fabricated-content components that were deleted for this reason (see git-free history: none, but ask the user before reintroducing anything not sourced from the resume).

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — type-check (`tsc -b`) then production build via Vite
- `npm run lint` — run oxlint
- `npm run preview` — preview the production build

There is no test runner configured in this project.

## Architecture

`src/App.tsx` wraps everything in `SceneProvider` and renders a fixed section order: `Stage` (fixed environment behind everything) → `Nav` (sticky) → `main` (`Hero` → `About` → `Projects` → `TechStack` → `Contact`) → `Footer`, plus a global `CustomCursor` overlay (desktop-only, gated by `(pointer: fine)` and `prefers-reduced-motion`).

### Design system (`src/index.css`)

All styling lives in one stylesheet — there's no CSS-in-JS or per-component CSS file. Tokens are defined once on `:root` (colors, fonts, borders, shadows, `--nav-height`) and consumed via `var(--token)`. Reusable primitives: `.container`, `.section`, `.eyebrow`, `.section-title`, `.section-lead`, `.glass-card`, `.btn-primary`/`.btn-secondary`, `.tag`. Responsive rules are grouped at the bottom of the file under `@media` breakpoints (1024 / 900 / 768 / 640 / 480px) rather than scattered per-component — add new responsive rules there, in the same pattern. A `@media (prefers-reduced-motion: reduce)` block collapses all CSS animation/transition durations globally.

### Reveal animation (`src/utils/reveal.tsx`)

`Reveal` is a shared wrapper around `framer-motion`'s `whileInView` (IntersectionObserver-backed, `once: true`, respects `useReducedMotion`). Use it for one-shot entrance of secondary content (About cards, skill groups, contact form). Section *headings* and the project constellation are not `Reveal`s — they are scroll-linked (see the scene section below).

### The scene: one environment driven by mouse + scroll (`src/utils/sceneContext.ts`, `src/components/SceneProvider.tsx`, `src/components/Stage.tsx`)

The site is one continuous visual composition, not a stack of independent sections with their own effects. Everything derives from a single **scene** (`useScene()`), created once by `SceneProvider` (wraps the app in `App.tsx`):

```
mouse  → spatial offset  ─┐
                           ├→ every layer's final transform
scroll → cinematic state ─┘
```

- **Mouse** — `useMousePosition()` (`utils/mouse.ts`) is called *once*, inside `SceneProvider`; it owns the only scene `mousemove` listener (skipped on mobile / reduced motion, returns inert 0-values then) and spring-smoothed -1..1 motion values give the inertia. Nothing else calls it or adds a listener. (`CustomCursor` has its own separate listener for the cursor ring.) Consumers use `useSpatialLayer(depth)`: offset = `-mouse × amp × depth × 24px`, where `amp` varies by chapter (wide in the intro, calm in Work). `DEPTH` in `sceneContext.ts` holds the strengths: background 0.5, atmosphere 0.8, visual 1.0, secondary 1.4, foreground 1.8, metadata 0.4, typography 0.2.
- **Scroll** — `SceneProvider` derives `intro` (0..1 through the pinned hero) and `chapter` (continuous 0 hero · 1 about · 2 work · 3 skills · 4 contact) from `scrollY` via `useTransform`, reading section geometry from a ref that a `ResizeObserver` keeps fresh (measured outside React state; nothing re-renders per frame). Chapters are *reached* as a section arrives and *held* until the next approaches — see the `raw` marks array and `CHAPTER_AT_MARK`. `introS`/`chapterS` are spring-smoothed copies for the physical environment; typography uses the raw `intro` so it stays exactly scroll-linked and reversible.
- **Video is scrubbed by scroll, not looped.** One RAF loop in `SceneProvider` interpolates a target progress (`0.82 × intro + 0.18 × rest-of-page`, so the footage keeps drifting after the pinned intro instead of freezing) into `video.currentTime`. It only runs while the value is still catching up, skips seeks queued behind an in-flight one, and stops when settled. `Stage`'s `<video>` registers via `scene.videoRef` and calls `scene.kick()` on metadata load. Native scrolling throughout — the pinned intro is CSS `position: sticky`, not scroll-jacking.
- **`Stage`** — a `position: fixed` layered environment behind all content (sections have transparent backgrounds; `main`/`.footer` are `z-index: 1`). Back to front: faint grid (bg) → haze (atmosphere) → **video plane** (main visual, right-weighted, keyed per chapter via `chapterS`: position/scale/opacity) → hairline geometry (secondary) → glare streak (foreground) → cursor light. Each layer is two nested elements: outer = scroll/chapter state, inner = mouse offset, so they never fight over one transform. A vertical chapter marker cross-fades with `chapterS`.
- **Hero (`Hero.tsx`)** — a 420svh section (`.hero`) with a sticky 100svh frame. Four one-at-a-time "thoughts" (BACKEND/ENGINEER → / APPLIED AI → SYSTEMS → selected work) each own a window on `intro`; lines are masked and slide in/out. Every string is resume-backed (About copy / project titles from `data/projects.ts`). `.hero` has `margin-top: -var(--nav-height)` so the sticky frame starts at viewport top under the transparent nav.
- **Project field** — see the dedicated section below.
- **Chapter transitions** — `About` uses `.chapter-overlap` (`margin-top: -50svh`) so its heading rises while the intro resolves. `ChapterHeading` (used by About/Projects/Skills/Contact) is a scroll-linked masked title (reverses on scroll-up), not a one-shot reveal. `Projects.tsx` supplies only the heading and the scroll span for the constellation (desktop/tablet) or a vertical `ProjectScene` list (mobile). `Nav` stays minimal while `intro < 0.96` (no backdrop, links dimmed) and resolves into the normal bar; active-link highlighting is still the shared IntersectionObserver.
- **`useActiveInView(ids, rootMargin)`** (`utils/scroll.ts`) — one `IntersectionObserver` per caller for "active section" state (Nav highlighting, project rail). Don't replace it with scroll-position math.
- **Responsive:** desktop gets mouse depth + plane sliding between chapters; ≤900px the plane becomes a top band that fades into the page, mouse motion is inert, scroll-driven transitions and scrubbing remain, project scenes stack. **Reduced motion:** no video (static poster `<img>`), no cursor light, scroll offsets collapse to zero, thoughts cross-fade by opacity only.

Rules when extending: drive properties by transform/opacity only (never `top/left/width/height/box-shadow`); add new effects as motion values derived from the scene (`intro`, `chapterS`, `mouse*`), not new `scroll`/`mousemove` listeners; never log or do heavy work inside a `useTransform` callback (a `console.log` firing every scroll frame was the cause of past jank); no `setState` on scroll frames (Nav's `inIntro` only flips on a threshold).

The earlier "deliberately avoided" list (pinned multi-`100vh` chapters, a `<canvas>`/WebGL background) is **superseded for the hero only**: the hero is now an intentional sticky sequence at the user's request. Still avoided: WebGL/canvas, scroll-jacking, and more sticky pinned sections beyond the hero.

**Video asset:** `public/media/hero-scrub.mp4` (+ `hero-poster.jpg`). It is *scrub-encoded*: H.264, no B-frames, keyframe every 4 frames (`-g 4 -bf 0`), no audio, `+faststart`, cropped to drop a generator watermark in the bottom-right of the original. **Scrubbing needs this** — the original `hero-background.mp4` has a single keyframe, so every seek would decode from frame 0. If the footage is replaced, re-encode the same way (ffmpeg is not installed; `npm i ffmpeg-static` in a scratch dir works): `ffmpeg -i in.mp4 -an -c:v libx264 -crf 24 -g 4 -keyint_min 4 -sc_threshold 0 -bf 0 -pix_fmt yuv420p -movflags +faststart hero-scrub.mp4`. `hero-background.mp4` is no longer referenced. If the video is missing/blocked the stage falls back to its ambient gradient plane.

### Project field (`src/components/ProjectField.tsx`, rendered inside `Stage`)

The Work chapter is a piece of 2.5D space the cursor flies a camera through — not a list and not a fixed arrangement with emphasis. It lives **inside the fixed Stage** (between the geometry and glare layers), so it shares the world, depth and mouse with the video plane. The header comment in the file is the model; summary:

- **Project space** — `LAYOUTS` (keyed by project id) holds each project's deterministic *home* `{ x, y, scale, depth, aspect, rotation?, featured? }` in % of the viewport; homes may lie outside it (at rest two projects are half out of frame). `depth` 0.4–1.5 is the per-project camera coefficient. `scale` × a 22vw base is the visual hierarchy (composition only, no claim about the projects). A project without a slot gets a deterministic index-based fallback. No `Math.random()` anywhere: the same camera position always gives the same composition.
- **Camera** — camera = spring mouse (`scene.mouseX/Y`, no listener of its own) + scroll progress (`scene.work`, carried as `progX/progY`). For any camera position, `pose` (one `useTransform` returning an array) deforms every home: (1) *parallax* `-cam × SHIFT × depth` — nearer projects travel further, so the field shears; (2) *orbit* — rotation about the view centre by `(ORBIT_X·cx + ORBIT_Y·cy)·(depth − 0.95)`, near and far layers opposite, so it twists; (3) *swirl* — a small per-project sinusoidal curve (deterministic phase), zero when centred, so paths bend; (4) *attraction* — the project whose home the cursor is nearest is drawn toward `FOCUS_POINT`, grows, straightens, comes to the front. Tuning knobs are the constants above `Pose`.
- **Focus** — never-zero falloff from the cursor to each project's *home region* (not its deformed position, so cursor-left always means the left-side projects lead), normalised to the nearest project, so there is always exactly one leader and the rest ease back (opacity .36→1, scale, z-index). Each object then runs its own springs (stiffer for higher depth, so near layers lead and far ones trail). React state changes only when the leader changes (with hysteresis) — it drives the rail highlight.
- **Information follows the visual** — a project's title fades in as it becomes dominant, tagline + stack a beat later, and both recede when the camera moves on (solid label backing so text stays legible over neighbours). There is no permanent description. The full write-up (summary, tags, Architecture toggle) is a **detail sheet opened by click / keyboard focus / rail**, with a close button.
- **Holding** — `lock` freezes the camera at `hold`; `pinIndex` also forces one project into focus (attraction ×, scale up). Hovering the rail or the sheet freezes the camera so reaching a corner UI doesn't fly the field there; click/rail/keyboard also opens the sheet. A hold releases when the raw pointer (`rawX/rawY` from `useMousePosition`, same single listener) travels >0.4 (normalised) from where it left the UI/click point, via the close button, or when the field leaves its live window.
- **Scroll** — `scene.work` (0..1) is measured from `#project-field-spacer` (a 260svh spacer rendered by `Projects.tsx`; that height is the field's scroll distance). It fades the field in/out, is the camera's progress through the space, and gates `live` (~0.18–0.85).
- **Pointer events** — `<main>` is `pointer-events: none` (it sits above the Stage and would swallow clicks meant for the field); each `main > section` opts back in, except `.projects-constellation`. Don't add a full-width element above the Stage in the Work range without doing the same.
- **Responsive** — ≤1100px: homes pulled toward the centre (`useSpread`), objects shrunk, tiles show only their numeral. ≤768px: no field (`Stage` skips it; `Projects` renders the vertical `ProjectScene` list; no spacer, so `work` stays 0). Reduced motion: mouse and scroll camera are inert (static home composition, default leader = featured project); rail/click/sheet still work.
- **Stage a11y** — decorative Stage layers are wrapped in `.stage-decor[aria-hidden]`; the field is real content (buttons, `inert` when not live).

### Content components

Each of `Hero.tsx`, `About.tsx`, `TechStack.tsx`, `Contact.tsx` owns its own content as a typed array/object at the top of the file (e.g. `TechStack.tsx`'s `GROUPS: SkillGroup[]`, `Hero.tsx`'s `THOUGHTS`). The one exception is projects: `PROJECTS` lives in `src/data/projects.ts` because both `Projects.tsx` and the hero's selected-work beat read it followed by the render. When resume content changes, edit these arrays — the JSX below them is generic rendering logic and shouldn't need to change for a content update.

`Nav.tsx` tracks scroll position (for its backdrop) and active section (via a single shared `IntersectionObserver` over each section's `id`) — don't replace the observer with a scroll-position recompute, that was a deliberate perf choice.

### Contact

`Contact.tsx`'s form has no backend — its submit handler builds a `mailto:` link from the field values and opens the user's mail client. Don't reintroduce a fake `setTimeout`-simulated submission; if a real backend is added later, replace the `mailto:` construction with an actual request.

### Static assets

Images referenced by components live under `public/` and `public/assets/images/` (served at root, e.g. `/assets/images/craftymind.jpg`, `/raahat_interface.jpg`). There is no `src/assets/` directory — all image assets are public-served, not bundler-processed.

### Other structural notes

- `SocialIcons.tsx` — hand-rolled GitHub/LinkedIn SVG icon components, used by `Nav`, `Hero`, `Contact`, `Footer`.
- `CustomCursor.tsx` — global cursor-follow effect; mounts its `mousemove` listener only when `(pointer: fine)` matches and reduced-motion is off.
- Loose top-level `dom.html`, `dom2.html`, `dom3.html`, `check_errors.js`, and `scratch/` are exploratory/debug artifacts, not part of the built app (the app entry is `index.html` → `src/main.tsx`).
