import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { GithubIcon as Github, LinkedinIcon as Linkedin } from './SocialIcons';
import { useActiveInView } from '../utils/scroll';
import { useScene } from '../utils/sceneContext';

const LINKS = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Work' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
];

const SECTION_IDS = LINKS.map(l => l.id);

export const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inIntro, setInIntro] = useState(true);
  const activeId = useActiveInView(SECTION_IDS);
  const { intro } = useScene();

  const { scrollYProgress } = useScroll();
  const progressWidth = useSpring(scrollYProgress, { stiffness: 300, damping: 40, mass: 0.2 });

  // The nav stays minimal (no backdrop, links receded) while the pinned intro
  // plays, then resolves into the regular bar as About takes over. setState
  // only fires when the boolean actually flips.
  const linksOpacity = useTransform(intro, [0.6, 0.95], [0.4, 1]);
  useEffect(() => {
    const update = (v: number) => setInIntro(v < 0.96);
    update(intro.get());
    return intro.on('change', update);
  }, [intro]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className={`nav ${scrolled && !inIntro ? 'nav-scrolled' : ''}`}>
      <motion.div className="nav-progress" style={{ scaleX: progressWidth }} aria-hidden="true" />
      <div className="nav-inner container">
        <button className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">
          AM
        </button>

        <motion.nav className="nav-links" aria-label="Primary" style={{ opacity: linksOpacity }}>
          {LINKS.map(link => (
            <button
              key={link.id}
              className={`nav-link ${activeId === link.id ? 'active' : ''}`}
              onClick={() => handleNavClick(link.id)}
            >
              {link.label}
            </button>
          ))}
        </motion.nav>

        <div className="nav-actions">
          <a href="https://github.com/animeshmudit" target="_blank" rel="noopener noreferrer" aria-label="GitHub profile" className="nav-icon-link">
            <Github size={17} />
          </a>
          <a href="https://linkedin.com/in/animeshmudit" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile" className="nav-icon-link">
            <Linkedin size={17} />
          </a>
          <button
            className="nav-toggle"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="nav-mobile-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {LINKS.map(link => (
              <button
                key={link.id}
                className={`nav-mobile-link ${activeId === link.id ? 'active' : ''}`}
                onClick={() => handleNavClick(link.id)}
              >
                {link.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
