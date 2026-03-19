export const durations = {
  micro: 0.12,
  fast: 0.18,
  base: 0.28,
  slow: 0.42,
} as const;

export const easing = {
  smooth: [0.22, 0.61, 0.36, 1] as const,
  springOut: [0.34, 1.56, 0.64, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
} as const;

export const routeTransition = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,

    transition: { duration: durations.base, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    y: -8,

    transition: { duration: durations.fast, ease: easing.exit },
  },
};

export const routeTransitionReduced = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: durations.fast, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.micro, ease: easing.exit },
  },
};

export const directionalRouteTransition = {
  initial: { opacity: 0, scale: 0.96, y: 15 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: durations.fast, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: durations.fast, ease: easing.exit },
  },
};

export const directionalRouteTransitionReduced = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: durations.fast, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.micro, ease: easing.exit },
  },
};

export const sectionStagger = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      when: "beforeChildren" as const,
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

export const itemRise = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.base, ease: easing.smooth },
  },
};
