'use client';

import { useEffect, useRef } from 'react';

type ScrollRevealOptions = {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
};

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const ref = useRef<T>(null);
  const { threshold = 0.15, rootMargin = '0px 0px -50px 0px', once = true } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed');
          if (once) observer.unobserve(el);
        } else if (!once) {
          el.classList.remove('revealed');
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return ref;
}

export function useScrollRevealGroup(
  options: ScrollRevealOptions = {}
) {
  const ref = useRef<HTMLDivElement>(null);
  const { threshold = 0.1, rootMargin = '0px 0px -50px 0px', once = true } = options;

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const children = container.querySelectorAll('.reveal-item');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove('revealed');
          }
        });
      },
      { threshold, rootMargin }
    );

    children.forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return ref;
}
