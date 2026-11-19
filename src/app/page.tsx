// src/app/page.tsx
"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Users,
  Clock,
  Wallet,
  Lock,
  Sparkles,
  CheckCircle2,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSuloStore } from "@/store/use-sulo-store";
import {
  KineticCounter,
  LivePulseBeacon,
  MagneticAction,
  SULO_SPRING,
} from "@/components/motion/motion-primitives";

export default function SpatialGatewayPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const switchRole = useSuloStore((s) => s.switchRole);
  const employees = useSuloStore((s) => s.employees);
  const attendance = useSuloStore((s) => s.attendance);

  const stageRef = useRef<HTMLDivElement>(null);
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const smoothX = useSpring(pointerX, { stiffness: 180, damping: 24 });
  const smoothY = useSpring(pointerY, { stiffness: 180, damping: 24 });

  // Rotasi 3D berbeda tiap kedalaman layer (Parallax Depth)
  const backRotateX = useTransform(smoothY, [0, 1], [11, 3]);
  const backRotateY = useTransform(smoothX, [0, 1], [-16, -6]);

  const midRotateX = useTransform(smoothY, [0, 1], [8, 1]);
  const midRotateY = useTransform(smoothX, [0, 1], [-12, -3]);

  const frontRotateX = useTransform(smoothY, [0, 1], [6, -1]);
  const frontRotateY = useTransform(smoothX, [0, 1], [-9, -1]);

  const stageGlow = useMotionTemplate`radial-gradient(360px circle at ${glareX}% ${glareY}%, rgba(249, 115, 22, 0.14), rgba(14, 165, 233, 0.12) 46%, transparent 76%)`;

  function handleStageMove(e: React.PointerEvent<HTMLDivElement>) {
    if (shouldReduceMotion) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    pointerX.set(nx);
    pointerY.set(ny);
    glareX.set(nx * 100);
    glareY.set(ny * 100);
  }

  function handleStageLeave() {
    pointerX.set(0.5);
    pointerY.set(0.5);
    glareX.set(50);
    glareY.set(50);
  }

  function enterAs(role: "HR_ADMIN" | "EMPLOYEE") {
    switchRole(role);
    router.push(role === "HR_ADMIN" ? "/admin/dashboard" : "/ess/home");
  }

  const totalStaff = employees.length || 48;
  const presentToday = attendance.filter(
    (a) => a.status === "TEPAT_WAKTU" || a.status === "TERLAMBAT",
  ).length;
  const displayPresent = presentToday > 0 ? presentToday : 45;
  const attendancePct =
    totalStaff > 0 ? (displayPresent / totalStaff) * 100 : 93.7;

  return (
    <section className="mx-auto flex min-h-[100dvh] w-full max-w-[1720px] items-center px-4 pt-28 pb-16 sm:px-6 md:pt-24 lg:px-10">
      <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
        {/* Kiri: Tipografi Kontras Tinggi & Dual Role Gateway */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={SULO_SPRING}
          className="flex flex-col gap-6 lg:col-span-6"
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge className="border-orange-300/90 bg-gradient-to-r from-orange-500/15 via-amber-400/15 to-orange-500/10 px-3 py-1 font-semibold text-orange-700 shadow-2xs">
              <Sparkles className="mr-1.5 size-3.5 text-orange-500" />
              Enterprise HRIS v3.0
            </Badge>
            <Badge
              variant="outline"
              className="border-blue-200/90 bg-white/85 px-3 py-1 text-slate-700 shadow-2xs"
            >
              <Lock className="mr-1.5 size-3.5 text-blue-600" />
              RBAC &amp; UU PDP Ready
            </Badge>
          </div>

          <h1 className="font-display text-4xl leading-[1.12] font-bold tracking-tight text-slate-900 sm:text-5xl xl:text-6xl">
            Kendali SDM Otomatis dalam Ruang{" "}
            <span className="text-sulo-gradient">Spatial 3D</span>
          </h1>

          <p className="max-w-[62ch] text-base leading-relaxed text-slate-600 sm:text-lg">
            Platform HRIS &amp; Employee Self-Service terpadu untuk{" "}
            <strong className="font-semibold text-slate-900">
              PT Sulo ({totalStaff} Karyawan Aktif)
            </strong>
            . Dilengkapi proteksi PII masking, alur persetujuan cuti berantai,
            dan mesin penggajian otomatis siap cetak A4.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <MagneticAction>
              <Button
                type="button"
                size="lg"
                onClick={() => enterAs("HR_ADMIN")}
                className="bg-sulo-cta border-0 px-6 font-semibold text-white active:scale-[0.98]"
              >
                Masuk sebagai HR Admin
                <ArrowRight data-icon="inline-end" />
              </Button>
            </MagneticAction>

            <MagneticAction>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => enterAs("EMPLOYEE")}
                className="border-blue-200 bg-white/90 px-6 text-slate-800 shadow-xs transition-colors hover:border-orange-300 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-orange-50/70 hover:text-slate-900 active:scale-[0.98]"
              >
                <UserCheck data-icon="inline-start" className="text-blue-600" />
                Masuk sebagai Karyawan
              </Button>
            </MagneticAction>
          </div>

          {/* Metrics Strip dengan Kontras Tajam & Aksen Gradasi Orange */}
          <div className="relative mt-2 grid grid-cols-3 gap-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/80 p-4 backdrop-blur-md sm:p-5">
            <div className="bg-sulo-dual-gradient absolute inset-x-0 top-0 h-0.5 opacity-80" />
            <div>
              <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums sm:text-3xl">
                <KineticCounter value={totalStaff} />
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Karyawan Aktif
              </p>
            </div>
            <div className="border-x border-slate-200/80 px-3 sm:px-5">
              <p className="font-mono text-2xl font-bold text-blue-600 tabular-nums sm:text-3xl">
                <KineticCounter
                  value={attendancePct}
                  decimals={1}
                  suffix="%"
                />
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Kehadiran Harian
              </p>
            </div>
            <div>
              <p className="text-sulo-orange-gradient font-mono text-2xl font-bold tabular-nums sm:text-3xl">
                Zero-Trust
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                RBAC Route Guard
              </p>
            </div>
          </div>
        </motion.div>

        {/* Kanan: Interactive 3D Spatial Glass Card Stack & Orbital Telemetry */}
        <div
          ref={stageRef}
          onPointerMove={handleStageMove}
          onPointerLeave={handleStageLeave}
          style={{ perspective: 1300 }}
          className="relative flex min-h-[430px] items-center justify-center sm:min-h-[470px] lg:col-span-6"
        >
          {/* Interactive Pointer Spotlight (Dual Orange & Azure) */}
          <motion.div
            aria-hidden="true"
            style={{ background: stageGlow }}
            className="pointer-events-none absolute inset-0 rounded-3xl"
          />

          {/* Motion Graphic SVG Orbital Rings (Cobalt Blue & Solar Orange) */}
          <svg
            aria-hidden="true"
            viewBox="0 0 500 500"
            className="pointer-events-none absolute size-[360px] opacity-80 sm:size-[450px]"
          >
            <defs>
              <linearGradient
                id="sulo-orbit-grad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.45" />
                <stop offset="48%" stopColor="#0EA5E9" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#FA4D09" stopOpacity="0.55" />
              </linearGradient>
            </defs>
            <motion.circle
              cx="250"
              cy="250"
              r="210"
              fill="none"
              stroke="url(#sulo-orbit-grad)"
              strokeWidth="1.5"
              strokeDasharray="8 10"
              animate={shouldReduceMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "250px 250px" }}
            />
            <motion.circle
              cx="250"
              cy="250"
              r="155"
              fill="none"
              stroke="rgba(249, 115, 22, 0.24)"
              strokeWidth="1.2"
              strokeDasharray="4 8"
              animate={shouldReduceMotion ? undefined : { rotate: -360 }}
              transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "250px 250px" }}
            />
          </svg>

          {/* Layer 1 (Belakang): Automated Payroll Card dengan Gradasi Orange */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={
              shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -7, 0] }
            }
            transition={{
              opacity: { duration: 0.5, delay: 0.1 },
              y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            }}
            style={{
              rotateX: backRotateX,
              rotateY: backRotateY,
              transformStyle: "preserve-3d",
            }}
            className="glass-sulo-orange absolute top-2 right-1 w-72 overflow-hidden rounded-2xl p-4 sm:right-6 sm:w-80"
          >
            <div className="bg-sulo-cta absolute inset-x-0 top-0 h-1" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Automated Payroll Engine
              </span>
              <div className="bg-sulo-cta flex size-7 items-center justify-center rounded-lg text-white">
                <Wallet className="size-3.5" />
              </div>
            </div>
            <p className="text-sulo-orange-gradient mt-2 font-mono text-xl font-bold tabular-nums">
              Rp 498.450.000
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              PPh 21 TER &amp; BPJS Terkalkulasi Otomatis
            </p>
          </motion.div>

          {/* Layer 2 (Tengah): SuloHR Security Core Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...SULO_SPRING, delay: 0.18 }}
            style={{
              rotateX: midRotateX,
              rotateY: midRotateY,
              transformStyle: "preserve-3d",
            }}
            className="glass-sulo-elevated relative z-10 w-80 overflow-hidden rounded-2xl p-5 sm:w-[400px]"
          >
            {/* Animated Top Spectrum Bar (Cobalt -> Sky -> Solar Orange) */}
            <div className="bg-sulo-dual-gradient absolute inset-x-0 top-0 h-1" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-sulo-blue-pill flex size-8 items-center justify-center rounded-xl text-white">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <span className="font-display block text-sm font-bold text-slate-900">
                    SuloHR Security Core
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Zero-Trust Enterprise Vault
                  </span>
                </div>
              </div>
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                <LivePulseBeacon colorClass="bg-emerald-500" />
                <span className="ml-1.5">ACTIVE</span>
              </Badge>
            </div>

            <div className="mt-4 flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-orange-200/70 bg-gradient-to-r from-slate-100/90 to-orange-50/70 px-3.5 py-2.5">
                <span className="font-medium text-slate-700">
                  PII Data Masking
                </span>
                <span className="text-sulo-orange-gradient font-mono font-bold tabular-nums">
                  ****-****-4910
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-blue-200/70 bg-gradient-to-r from-slate-100/90 to-blue-50/70 px-3.5 py-2.5">
                <span className="font-medium text-slate-700">
                  CSV Formula Guard
                </span>
                <span className="font-mono font-semibold text-blue-700">
                  SANITIZED
                </span>
              </div>
            </div>
          </motion.div>

          {/* Layer 3 (Depan): Real-Time Attendance Card */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={
              shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, 6, 0] }
            }
            transition={{
              opacity: { duration: 0.5, delay: 0.25 },
              y: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
            }}
            style={{
              rotateX: frontRotateX,
              rotateY: frontRotateY,
              transformStyle: "preserve-3d",
            }}
            className="glass-sulo-elevated absolute bottom-1 left-1 z-20 w-72 overflow-hidden rounded-2xl p-4 sm:left-6 sm:w-80"
          >
            <div className="bg-sulo-dual-gradient absolute inset-x-0 bottom-0 h-0.5 opacity-75" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Presensi Real-Time
              </span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-orange-50 text-orange-600 ring-1 ring-orange-200/80">
                <Clock className="size-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                {displayPresent} / {totalStaff} Hadir
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-200/70 bg-gradient-to-r from-blue-50 to-orange-50 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                <Users className="size-3.5 text-orange-500" /> 5 Divisi
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}