'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePrefersReducedMotion } from '../lib/useMotionPreference';

interface ListAnimationProps {
  children: React.ReactNode;
  items?: any[];
  staggerDelay?: number;
}

export default function ListAnimation({ children, items = [], staggerDelay = 0.05 }: ListAnimationProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: staggerDelay,
              delayChildren: 0.1
            }
          }
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Wrapper component for individual list items.
 * Automatically applies stagger animation.
 */
export function ListItem({ children, index = 0 }: { children: React.ReactNode; index?: number }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}
