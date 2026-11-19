// src/components/motion/tilt-glass-card.tsx
"use client";

import React, { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface TildGlassCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}

export function TildGlassCard({
  children,
  className,
  maxTilt = 6,
}: TildGlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const springConfig = { stiffness: 260, damping: 24, mass: 0.6 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [0, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(smoothX, [0, 1], [-maxTilt, maxTilt]);

  const specularSheen = useMotionTemplate`radial-gradient(280px circle at ${glareX}% ${glareY}%, rgba(56, 189, 248, 0.16), rgba(255, 255, 255, 0.65) 35%, transparent 75%)`;

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;

    mouseX.set(normX);
    mouseY.set(normY);
    glareX.set(normX * 100);
    glareY.set(normY * 100);
  }

  function handlePointerLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
    glareX.set(50);
    glareY.set(50);
  }

  return (
    <div style={{ perspective: 1100 }} className="h-full">
      <motion.div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={cn(
          "glass-sulo-card group relative h-full overflow-hidden rounded-2xl p-5 transition-colors duration-300 hover:outline-blue-500/35",
          className,
        )}
      >
        {/* Specular Crystal Glare Layer */}
        <motion.div
          aria-hidden="true"
          style={{ background: specularSheen }}
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        {/* 3D Floating Content Layer */}
        <div
          style={{ transform: "translateZ(14px)" }}
          className="relative z-10 h-full"
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}