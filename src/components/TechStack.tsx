import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Reveal } from '../utils/reveal';
import { ChapterHeading } from './ChapterHeading';

interface SkillItem {
  name: string;
  desc: string;
}

interface SkillGroup {
  category: string;
  items: SkillItem[];
}

const GROUPS: SkillGroup[] = [
  {
    category: 'Languages',
    items: [
      { name: 'Python', desc: 'Primary language for backend services, RAG pipelines, and ETL tooling.' },
      { name: 'TypeScript', desc: 'Used across React/Vite frontends and Node-side tooling.' },
      { name: 'JavaScript', desc: 'Client-side interactivity and Node-based build tooling.' },
      { name: 'C++', desc: 'Continuous DSA practice — graph theory, dynamic programming, tree traversal.' },
      { name: 'Java', desc: 'Coursework and KnowledgeGate certification track.' },
      { name: 'SQL', desc: 'Relational schema design and query optimization.' },
      { name: 'Bash', desc: 'Automation and Linux environment scripting.' },
    ],
  },
  {
    category: 'Backend & APIs',
    items: [
      { name: 'FastAPI', desc: 'Primary framework for async API services and orchestration layers.' },
      { name: 'Flask', desc: 'Used for The Huddle’s RESTful API with SQLAlchemy ORM.' },
      { name: 'Pydantic', desc: 'Schema validation across agent and API boundaries.' },
      { name: 'asyncio', desc: 'Asynchronous I/O for concurrent request handling.' },
      { name: 'RESTful API design', desc: 'Resource modeling, pagination, and role-based access control.' },
    ],
  },
  {
    category: 'Frontend',
    items: [
      { name: 'React', desc: 'Component architecture for interactive product UIs.' },
      { name: 'Next.js', desc: 'Server-side routes and actions for Crafty Mind Studio.' },
      { name: 'Vite', desc: 'Build tooling for this portfolio and other React apps.' },
      { name: 'Tailwind CSS', desc: 'Utility-first styling for storefront and admin UI.' },
      { name: 'Framer Motion', desc: 'Scroll-aware, reduced-motion-aware interface animation.' },
    ],
  },
  {
    category: 'Databases & Storage',
    items: [
      { name: 'PostgreSQL / Supabase', desc: 'Row-level security and session-aware access control.' },
      { name: 'MongoDB', desc: 'Session history and persistent dialogue storage for RAAHAT.' },
      { name: 'Firebase / Firestore', desc: 'Real-time document sync with optimistic client updates.' },
      { name: 'SQLite', desc: 'Relational storage for The Huddle.' },
      { name: 'MySQL', desc: 'Relational database experience.' },
    ],
  },
  {
    category: 'AI Systems & Retrieval',
    items: [
      { name: 'RAG', desc: 'Multi-tiered retrieval-augmented generation over curated knowledge bases.' },
      { name: 'FAISS', desc: 'Vector indexing for semantic/metadata-aware retrieval.' },
      { name: 'SentenceTransformers', desc: 'Dense embedding generation for retrieval pipelines.' },
      { name: 'Groq API', desc: 'Primary inference provider, with local-model fallback routing.' },
      { name: 'Ollama / LM Studio / FastFlowLM', desc: 'Local LLM runtimes for fully offline inference.' },
      { name: 'Multi-agent orchestration', desc: 'Auditor/Synthesizer/Verifier-style agent boundaries governed by schemas.' },
    ],
  },
  {
    category: 'Engineering & Systems',
    items: [
      { name: 'Git / GitHub', desc: 'Version control and collaborative workflows.' },
      { name: 'Docker & Docker Compose', desc: 'Containerized deployment for RAAHAT and related services.' },
      { name: 'Pytest', desc: 'Evaluation and testing support for backend services.' },
      { name: 'Linux (CachyOS/Arch)', desc: 'Kernel-level tuning, package orchestration, terminal telemetry.' },
      { name: 'Security practices', desc: 'IDOR prevention, HMAC verification, idempotency, RLS.' },
    ],
  },
];

export const TechStack: React.FC = () => {
  const [selected, setSelected] = useState<SkillItem>(GROUPS[1].items[0]);

  return (
    <section id="skills" className="section container">
      <ChapterHeading
        eyebrow="03 — Skills"
        title="Technical toolbelt."
        lead="Grouped by where I actually apply them, not a wall of logos. Select a tag for a short note on how I use it."
      />

      <div className="skills-grid">
        <div className="skills-categories">
          {GROUPS.map((group, i) => (
            <Reveal key={group.category} delay={Math.min(i * 0.05, 0.2)} className="skill-group">
              <h3 className="skill-group-title">{group.category}</h3>
              <div className="skill-tags">
                {group.items.map(item => (
                  <button
                    key={item.name}
                    className={`skill-tag ${selected.name === item.name ? 'selected' : ''}`}
                    onClick={() => setSelected(item)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </Reveal>
          ))}
        </div>

        <div className="skill-detail-panel">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <h4>{selected.name}</h4>
              <p>{selected.desc}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
