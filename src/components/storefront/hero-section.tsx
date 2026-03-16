"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { EffectChip } from "./effect-chip";
import type { EffectKey } from "./effect-colors";

const ROTATING_PHRASES = [
  "relaxation?",
  "better sleep?",
  "pain relief?",
  "creative energy?",
  "sharp focus?",
  "a good time?",
] as const;

const EFFECT_CHIPS: EffectKey[] = [
  "RELAXATION",
  "FOCUS",
  "PAIN_RELIEF",
  "ENERGY",
  "SLEEP",
  "CREATIVITY",
];

export function HeroSection() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion.current) return;

    const interval = setInterval(() => {
      // Fade out
      setVisible(false);
      setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % ROTATING_PHRASES.length);
        setVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section
      aria-label="Hero — shop introduction"
      className="relative flex min-h-[90svh] flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-indigo-50 px-4 py-20 text-center"
    >
      {/* Dot grid texture overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, #6b7280 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          opacity: 0.03,
        }}
      />

      {/* Floating gradient blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-emerald-300 opacity-20 blur-3xl motion-safe:animate-pulse"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-indigo-300 opacity-20 blur-3xl motion-safe:animate-pulse [animation-delay:1s]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-200 opacity-15 blur-3xl motion-safe:animate-pulse [animation-delay:2s]"
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl space-y-8">
        {/* Status badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-800 shadow-sm backdrop-blur-sm">
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 rounded-full bg-emerald-500 motion-safe:animate-pulse"
          />
          Open Now &middot; Pickup &amp; Delivery Available
        </div>

        {/* Animated heading */}
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
          Looking for{" "}
          <span
            aria-live="polite"
            aria-atomic="true"
            className="inline-block bg-gradient-to-r from-emerald-600 via-teal-500 to-indigo-600 bg-clip-text text-transparent transition-all duration-300"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(8px)",
            }}
          >
            {ROTATING_PHRASES[phraseIndex]}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto max-w-xl text-lg text-neutral-600">
          Shop our fully licensed, lab-tested menu. Order online for same-day
          pickup or delivery in Southern California.
        </p>

        {/* Effect chips */}
        <div
          className="flex flex-wrap items-center justify-center gap-2"
          aria-label="Shop by effect"
        >
          {EFFECT_CHIPS.map((effect) => (
            <EffectChip key={effect} effect={effect} />
          ))}
        </div>

        {/* Search bar placeholder */}
        <div className="mx-auto w-full max-w-lg">
          <div
            role="search"
            aria-label="Search products (not yet active)"
            className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white/90 px-5 py-4 shadow-md backdrop-blur-sm"
          >
            <Search
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-neutral-400"
            />
            <span className="flex-1 text-left text-neutral-400">
              Search flower, edibles, vapes&hellip;
            </span>
            <kbd className="hidden rounded-lg border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-xs font-mono text-neutral-500 sm:inline-block">
              /
            </kbd>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        aria-hidden="true"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-neutral-400 motion-safe:animate-bounce"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </section>
  );
}
