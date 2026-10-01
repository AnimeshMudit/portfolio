import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Mail, MapPin } from 'lucide-react';
import { GithubIcon as Github, LinkedinIcon as Linkedin } from './SocialIcons';
import { Reveal } from '../utils/reveal';
import { ChapterHeading } from './ChapterHeading';

export const Contact: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const shouldReduceMotion = useReducedMotion();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Portfolio contact from ${form.name || 'a visitor'}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:animeshmudit@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <section id="contact" className="section container">
      <ChapterHeading
        eyebrow="04 — Contact"
        title="Let's build something."
        lead="Open to backend, applied-AI, and full-stack engineering work. The fastest way to reach me is email."
      />

      <motion.div
        className="contact-divider"
        initial={{ scaleX: shouldReduceMotion ? 1 : 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        aria-hidden="true"
      />

      <div className="contact-grid">
        <Reveal className="contact-info">
          <a href="mailto:animeshmudit@gmail.com" className="contact-link">
            <Mail size={16} />
            animeshmudit@gmail.com
          </a>
          <a href="https://github.com/animeshmudit" target="_blank" rel="noopener noreferrer" className="contact-link">
            <Github size={16} />
            github.com/animeshmudit
          </a>
          <a href="https://linkedin.com/in/animeshmudit" target="_blank" rel="noopener noreferrer" className="contact-link">
            <Linkedin size={16} />
            linkedin.com/in/animeshmudit
          </a>
          <span className="contact-link contact-location">
            <MapPin size={16} />
            Kanpur, India
          </span>
        </Reveal>

        <Reveal delay={0.08} className="contact-form-wrap">
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                required
                rows={4}
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary">
              Open in email client
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
};
