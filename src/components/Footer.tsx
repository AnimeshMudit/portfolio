import { GithubIcon as Github, LinkedinIcon as Linkedin } from './SocialIcons';
import { Mail, ArrowUp } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span className="footer-name">Animesh Mudit</span>
        <div className="footer-links">
          <a href="mailto:animeshmudit@gmail.com" aria-label="Email"><Mail size={16} /></a>
          <a href="https://github.com/animeshmudit" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><Github size={16} /></a>
          <a href="https://linkedin.com/in/animeshmudit" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><Linkedin size={16} /></a>
        </div>
        <button className="footer-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">
          <ArrowUp size={14} />
          Top
        </button>
      </div>
    </footer>
  );
};
