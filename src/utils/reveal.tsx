import React from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';

interface RevealProps extends HTMLMotionProps<'div'> {
  delay?: number;
  as?: React.ElementType;
}

export const Reveal: React.FC<RevealProps> = ({ children, delay = 0, style, ...props }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      style={style}
      {...props}
    >
      {children}
    </motion.div>
  );
};
