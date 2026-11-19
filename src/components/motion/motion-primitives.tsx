// src/components/motion/motion-primitives.tsx
"use client";

import React, { useEffect, useRef } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

export const SULO_SPRING = {
  type: "spring" as const,
  stiffness: 280,
  damping: 26,
  mass: 0.85,
};

/**
 * Latar belakang motion graphics berlapis: grid arsitektural & orb cahaya biru-perak melayang
 * Menggunakan properti GPU (transform & opacity) agar stabil 60fps.
 */
export const SpatialBackdrop = React.memo(function SpatialBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="no-print bg-sulo-grid pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <motion.div
        animate={{
          x: [0, 32, -16, 0],
          y: [0, -24, 18, 0],
          scale: [1, 1.06, 0.97, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-28 right-[8%] size-[460px] rounded-full bg-blue-500/12 blur-3xl"
      />
      <motion.div
        animate={{
          x: [0, -28, 20, 0],
          y: [0, 26, -18, 0],
          scale: [1, 0.95, 1.05, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[38%] -left-24 size-[420px] rounded-full bg-sky-400/12 blur-3xl"
      />
      <motion.div
        animate={{
          x: [0, 22, -24, 0],
          y: [0, -18, 14, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute right-[18%] -bottom-32 size-[500px] rounded-full bg-slate-300/35 blur-3xl"
      />
    </div>
  );
});

interface KineticCounterProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export function KineticCounter({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
}: KineticCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, {
    stiffness: 120,
    damping: 22,
    mass: 0.8,
  });

  useEffect(() => {
    if (isInView) {
      motionVal.set(value);
    }
  }, [isInView, value, motionVal]);

  useEffect(() => {
    const unsubscribe = springVal.on("change", (latest) => {
      if (ref.current) {
        const formatted = latest.toLocaleString("id-ID", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
        ref.current.textContent = `${prefix}${formatted}${suffix}`;
      }
    });
    return () => unsubscribe();
  }, [springVal, decimals, prefix, suffix]);

  const initialFormatted = value.toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className="font-mono tabular-nums">
      {prefix}
      {initialFormatted}
      {suffix}
    </span>
  );
}

export function WaterfallContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.055 },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function WaterfallItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16, scale: 0.98 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: SULO_SPRING,
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Wrapper interaktif dengan efek tarik magnetik ringan saat kursor mendekat
 */
export function MagneticAction({
  children,
  className,
  strength = 0.22,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 320, damping: 22 });
  const springY = useSpring(y, { stiffness: 320, damping: 22 });

  const scale = useTransform(springX, [-20, 0, 20], [1.01, 1, 1.01]);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * strength);
    y.set((e.clientY - centerY) * strength);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{ x: springX, y: springY, scale }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Indikator sinyal hidup berdenyut (Motion Graphic Beacon)
 */
export function LivePulseBeacon({
  active = true,
  colorClass = "bg-blue-600",
}: {
  active?: boolean;
  colorClass?: string;
}) {
  return (
    <span className="relative flex size-2.5">
      {active && (
        <span
          className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 ${colorClass}`}
        />
      )}
      <span
        className={`relative inline-flex size-2.5 rounded-full ${colorClass}`}
      />
    </span>
  );
}