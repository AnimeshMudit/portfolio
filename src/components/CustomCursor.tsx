import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

export const CustomCursor: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 600, mass: 0.3 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    setEnabled(mq.matches);
    const onChange = () => setEnabled(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!enabled || shouldReduceMotion) return;

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!visible) setVisible(true);

      const target = e.target as HTMLElement;
      if (target) {
        const isInteractive = target.closest('a, button, [role="button"], input, textarea, select');
        setHovered(!!isInteractive);
      }
    };

    const handleMouseLeave = () => setVisible(false);
    const handleMouseEnter = () => setVisible(true);

    window.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [visible, enabled, shouldReduceMotion, cursorX, cursorY]);

  if (!enabled || shouldReduceMotion || !visible) return null;

  return (
    <motion.div
      className="custom-cursor"
      style={{
        x: cursorXSpring,
        y: cursorYSpring,
        translateX: '-50%',
        translateY: '-50%',
      }}
      animate={{
        scale: hovered ? 1.6 : 1,
        borderColor: hovered ? 'var(--accent-blue)' : 'var(--text-primary)',
        backgroundColor: hovered ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
      }}
      transition={{ type: 'spring', stiffness: 600, damping: 25 }}
    />
  );
};
