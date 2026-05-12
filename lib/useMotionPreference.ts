'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect and respect user's motion preferences.
 * Returns true if the user prefers reduced motion.
 * Safe for SSR - returns false (animations enabled) on the server.
 */
export function usePrefersReducedMotion(): boolean {
  // Default to false (animations enabled) for initial render
  // This is safe on the server and will be updated on the client
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Only run on client
    if (typeof window === 'undefined') return;

    // Check initial preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Return false during SSR and initial hydration to allow animations
  // This prevents hydration mismatches
  return isMounted ? prefersReducedMotion : false;
}

/**
 * Get animation variants that respect prefers-reduced-motion.
 * If motion is reduced, returns no-op variants.
 */
export function getAnimationVariants(prefersReducedMotion: boolean) {
  if (prefersReducedMotion) {
    return {
      initial: { opacity: 1, y: 0, x: 0, scale: 1 },
      animate: { opacity: 1, y: 0, x: 0, scale: 1 },
      exit: { opacity: 1, y: 0, x: 0, scale: 1 }
    };
  }
  return null; // Use default animations
}
