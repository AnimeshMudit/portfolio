import React from 'react';
import { Reveal } from '../utils/reveal';
import { ChapterHeading } from './ChapterHeading';
import { Server, Cpu, ShieldCheck, Layers } from 'lucide-react';

const STRENGTHS = [
  {
    icon: Server,
    title: 'Backend ownership',
    desc: 'APIs, persistence, business rules, state transitions, and third-party integrations.',
  },
  {
    icon: Cpu,
    title: 'Applied AI',
    desc: 'Retrieval, embeddings, multi-agent orchestration, memory, safety boundaries, fallbacks, and evaluation.',
  },
  {
    icon: ShieldCheck,
    title: 'Security-minded development',
    desc: 'IDOR prevention, server-authoritative values, HMAC verification, idempotency, session management, and row-level security.',
  },
  {
    icon: Layers,
    title: 'Full-stack execution',
    desc: 'Frontend interaction through backend logic, database state, integrations, and deployment concerns.',
  },
];

const CREDENTIALS = [
  {
    label: 'Education',
    title: 'B.Tech, Computer Science & Engineering',
    detail: 'Pranveer Singh Institute of Technology (PSIT), Kanpur — 2024–2028 — CGPA 7.59/10',
  },
  {
    label: 'Certifications',
    title: 'Infosys Springboard, KnowledgeGate',
    detail: 'HTML / CSS / Bootstrap and Python (Infosys Springboard) · Java (KnowledgeGate)',
  },
  {
    label: 'Practice',
    title: 'DSA & systems',
    detail: 'Continuous C++ practice on LeetCode and HackerRank (graph theory, DP, tree traversal); CachyOS/Arch Linux power user.',
  },
];

export const About: React.FC = () => {
  return (
    // Overlaps the tail of the pinned hero (see .chapter-overlap) so About's
    // heading is already rising while the intro resolves.
    <section id="about" className="section container chapter-overlap">
      <ChapterHeading
        eyebrow="01 — About"
        title="Systems-first engineering, applied to AI."
        lead="Computer Science undergraduate (B.Tech, PSIT Kanpur) building production-oriented full-stack and applied-AI systems. My strongest work sits at the intersection of backend engineering, application architecture, LLM orchestration, retrieval systems, databases, payments, and security — end to end, from product requirements through frontend, backend, persistence, integrations, and operational concerns."
      />

      <div className="strengths-grid">
        {STRENGTHS.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.05} className="strength-card">
            <s.icon size={18} className="strength-icon" />
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </Reveal>
        ))}
      </div>

      <div className="credentials-row">
        {CREDENTIALS.map((c, i) => (
          <Reveal key={c.label} delay={i * 0.05} className="credential-card">
            <span className="credential-label">{c.label}</span>
            <h4>{c.title}</h4>
            <p>{c.detail}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
};
