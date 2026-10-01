export interface ProjectData {
  id: string;
  title: string;
  tagline: string;
  image?: string;
  tech: string[];
  summary: string;
  architecture: string;
  metric?: string;
}

export const PROJECTS: ProjectData[] = [
  {
    id: 'raahat',
    title: 'RAAHAT',
    tagline: 'Emotionally aligned conversational AI (hybrid RAG)',
    image: '/raahat_interface.jpg',
    tech: ['Python', 'FastAPI', 'Groq API', 'FAISS', 'Supabase', 'MongoDB', 'Telegram', 'Docker Compose'],
    summary:
      'A supportive conversational AI — explicitly not a therapy, diagnosis, or medical assistant. A multi-tiered RAG pipeline runs over curated CBT/ACT/DBT, WHO stress, and psychological-first-aid material, indexed via FAISS. Safety is separated from generation with deterministic crisis detection, so the LLM is never the sole safety gate; crisis responses use a backend-controlled resource card rather than model-invented helpline information.',
    architecture:
      'Web / Telegram / CLI clients → FastAPI → session/memory orchestration → multi-query semantic + metadata retrieval (normalized embeddings, keyword expansion, dedup) → prompt construction → Groq LLM, with a circuit-breaker fallback to local Ollama models when Groq is rate-limited or degraded.',
  },
  {
    id: 'setu',
    title: 'SETU',
    tagline: 'AI-assisted emergency response & geospatial disaster relief',
    image: '/setu_interface.jpg',
    tech: ['FastAPI', 'Python', 'Firebase/Firestore', 'Geocoding/Maps APIs'],
    summary:
      'Backend services coordinating emergency incident intake, resource dispatch, and response during active disaster scenarios, with AI treated as one component of the pipeline rather than the whole system. A geospatial volunteer-matching algorithm uses Haversine distance and radial bounding queries to prioritize field responders within critical survival timeframes.',
    architecture:
      'Client → FastAPI → validation/incident creation → AI severity analysis → geospatial volunteer matching (Haversine + radial bounding) → Firestore document streams with optimistic client sync, so dispatch tracking survives degraded connectivity. Built for the Google Solution Challenge.',
  },
  {
    id: 'crafty-mind',
    title: 'Crafty Mind Studio',
    tagline: 'Full-stack e-commerce platform',
    image: '/assets/images/craftymind.jpg',
    tech: ['Next.js 15', 'React 19', 'Supabase/PostgreSQL', 'Razorpay', 'Resend', 'Tailwind CSS'],
    summary:
      'A complete commerce workflow — storefront, cart/checkout, orders, payments, transactional email, admin operations, and analytics — built so the client can never determine the payable amount. Payment processing is hardened with HMAC-verified webhooks and idempotent reconciliation to prevent duplicate charges and inconsistent order states.',
    architecture:
      'Next.js/React storefront → server-side routes own business rules and order/payment orchestration → server-authoritative amount → Razorpay → signed webhook → idempotent reconciliation. Supabase/PostgreSQL with row-level security and session-aware access control; sensitive state transitions are owned by the backend, never trusted to the client.',
  },
  {
    id: 'repoguard',
    title: 'RepoGuard',
    tagline: 'Autonomous multi-agent static application security auditor (SAST)',
    image: '/assets/images/repoguard.jpg',
    tech: ['Python', 'Qwen2.5-Coder', 'Ollama / FastFlowLM', 'Pydantic'],
    summary:
      'A deterministic multi-agent SAST tool for targeted code auditing and vulnerability patching — fully local, with no cloud API exposure or IP leakage. Strict Pydantic schema validation across agent boundaries eliminates hallucinated syntax and guarantees compile-ready remediation.',
    architecture:
      'AST parsing → localized context injection → local LLM inference (Ollama/FastFlowLM) → Auditor Agent → Patch Synthesizer → Verification Agent, each governed by Pydantic JSON schemas. Tuned local Qwen2.5-Coder 7B parameters and streaming inference.',
    metric: '40% reduction in per-file audit turnaround',
  },
  {
    id: 'huddle',
    title: 'The Huddle',
    tagline: 'Academic collaboration & team-formation platform',
    tech: ['Python', 'Flask', 'SQLite', 'SQLAlchemy ORM', 'RESTful API'],
    summary:
      'A team-built (Sept–Oct 2025) modular relational REST API managing high-cardinality student team formation, skill discovery, and academic collaboration workflows, on a clean layered MVC architecture with repository-pattern abstraction.',
    architecture:
      'Third-normal-form relational schema with composite indices and foreign-key cascading constraints for transactional integrity. Structured input validation, role-based access control, and endpoint pagination.',
    metric: 'Sub-50ms API response latency',
  },
  {
    id: 'portfolio',
    title: 'This Portfolio',
    tagline: 'Interactive personal engineering portfolio',
    image: '/assets/images/meta.jpg',
    tech: ['React', 'TypeScript', 'Vite', 'Framer Motion'],
    summary:
      'Built to demonstrate engineering depth through the interface itself rather than a static project list — including this rebuild, which replaced a fabricated-content prototype with resume-accurate copy, a light Apple-inspired design system, and a mobile-first responsive layout.',
    architecture: 'React + TypeScript + Vite UI, Framer Motion for IntersectionObserver-driven reveal animation.',
  },
  {
    id: 'news',
    title: 'Modular News Ingestion Engine',
    tagline: 'Object-oriented ETL for multi-source live news',
    tech: ['Python', 'NewsAPI', 'Structured Logging', 'OOP Design Patterns'],
    summary:
      'An object-oriented Python ETL service that queries, filters, and normalizes multi-source live news feeds, using an extensible producer-consumer model with factory-pattern source handlers.',
    architecture:
      'Producer-consumer ingestion → factory-pattern source handlers → structured JSON logging, including rate-limit backoff logic.',
  },
];
