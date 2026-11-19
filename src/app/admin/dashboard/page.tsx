// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Users,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  ArrowUpRight,
  Activity,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSuloStore } from "@/store/use-sulo-store";
import { TildGlassCard } from "@/components/motion/tild-glass-card";
import {
  KineticCounter,
  LivePulseBeacon,
  MagneticAction,
  SULO_SPRING,
  SpatialBackdrop,
  WaterfallContainer,
  WaterfallItem,
} from "@/components/motion/motion-primitives";

const DEPT_COLORS: Record<string, string> = {
  Engineering: "#1D4ED8", // Cobalt Blue
  "Product & Design": "#0EA5E9", // Azure Sky
  Marketing: "#F97316", // Solar Orange
  Finance: "#F59E0B", // Warm Amber
  HR: "#10B981", // Emerald Mint
};

interface WeeklyDayStat {
  day: string;
  dateLabel: string;
  onTime: number;
  late: number;
  leave: number;
}

export default function AdminDashboardPage() {
  const { employees, attendance, leaves, reviewLeaveRequest } = useSuloStore();
  const [hoveredDay, setHoveredDay] = useState<WeeklyDayStat | null>(null);
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);
  const [clientNowMs, setClientNowMs] = useState<number | null>(null);

  useEffect(() => {
    setClientNowMs(Date.now());
  }, []);

  const totalEmployees = employees.length || 48;
  const onTimeCount = attendance.filter(
    (a) => a.status === "TEPAT_WAKTU",
  ).length;
  const lateCount = attendance.filter((a) => a.status === "TERLAMBAT").length;
  const leaveCount = attendance.filter((a) => a.status === "CUTI_IZIN").length;
  const presentCount = onTimeCount + lateCount;

  const attendanceRate =
    employees.length > 0 ? (presentCount / employees.length) * 100 : 0;

  const pendingLeaves = leaves.filter((l) => l.status === "PENDING");

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const expiringContracts =
    clientNowMs === null
      ? []
      : employees.filter((e) => {
          if (!e.contractEndDate) return false;
          const endMs = new Date(e.contractEndDate).getTime();
          return endMs >= clientNowMs && endMs - clientNowMs <= thirtyDaysMs;
        });

  const weeklyStats: WeeklyDayStat[] = [
    { day: "Rab", dateLabel: "11 Nov", onTime: 42, late: 4, leave: 2 },
    { day: "Kam", dateLabel: "12 Nov", onTime: 44, late: 3, leave: 1 },
    { day: "Jum", dateLabel: "13 Nov", onTime: 40, late: 5, leave: 3 },
    { day: "Sen", dateLabel: "16 Nov", onTime: 43, late: 3, leave: 2 },
    { day: "Sel", dateLabel: "17 Nov", onTime: 45, late: 2, leave: 1 },
    { day: "Rab", dateLabel: "18 Nov", onTime: 44, late: 2, leave: 2 },
    {
      day: "Hari Ini",
      dateLabel: "19 Nov",
      onTime: onTimeCount,
      late: lateCount,
      leave: leaveCount,
    },
  ];

  const departmentCounts = [
    "Engineering",
    "Product & Design",
    "Marketing",
    "Finance",
    "HR",
  ].map((dept) => ({
    name: dept,
    count: employees.filter((e) => e.department === dept).length,
    color: DEPT_COLORS[dept],
  }));

  const donutRadius = 56;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let cumulativePercent = 0;

  const ringRadius = 20;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (attendanceRate / 100) * ringCircumference;

  return (
    <div className="relative flex flex-col gap-6">
      <SpatialBackdrop />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-gradient-to-r from-white/90 via-blue-50/70 to-orange-50/80 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs">
            <LivePulseBeacon colorClass="bg-orange-500" />
            <span>
              SuloHR Spatial Telemetry •{" "}
              <span className="text-blue-600">Live</span>
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Executive <span className="text-sulo-gradient">Command Center</span>
          </h1>
          <p className="text-sm text-slate-600">
            Ringkasan operasional SDM PT Sulo dalam arsitektur kaca spasial
            real-time.
          </p>
        </div>

        <MagneticAction>
          <Button
            render={<Link href="/admin/payroll" />}
            nativeButton={false}
            className="bg-sulo-cta border-0 px-5 font-semibold text-white active:scale-[0.98]"
          >
            <Sparkles data-icon="inline-start" />
            Proses Payroll Bulanan
            <ArrowUpRight data-icon="inline-end" />
          </Button>
        </MagneticAction>
      </div>

      {/* 4 KPI 3D Glass Cards dengan Hierarki Warna Terkalibrasi */}
      <WaterfallContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* KPI 1: Cobalt Blue Core */}
        <WaterfallItem>
          <TildGlassCard className="relative overflow-hidden">
            <div className="bg-sulo-blue-pill absolute inset-x-0 top-0 h-0.5 opacity-80" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Total Karyawan Aktif
              </span>
              <div className="bg-sulo-blue-pill flex size-8 items-center justify-center rounded-xl text-white">
                <Users className="size-4" />
              </div>
            </div>
            <p className="mt-2.5 text-3xl font-bold text-slate-900">
              <KineticCounter value={employees.length} suffix=" Staf" />
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              +2 bergabung bulan ini
            </p>
          </TildGlassCard>
        </WaterfallItem>

        {/* KPI 2: Dual-Spectrum Cobalt -> Sky -> Solar Orange Ring */}
        <WaterfallItem>
          <TildGlassCard className="relative overflow-hidden">
            <div className="bg-sulo-dual-gradient absolute inset-x-0 top-0 h-0.5 opacity-80" />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">
                  Kehadiran Hari Ini
                </span>
                <p className="mt-2.5 text-3xl font-bold text-slate-900">
                  <KineticCounter
                    value={attendanceRate}
                    decimals={1}
                    suffix="%"
                  />
                </p>
                <p className="mt-1 font-mono text-xs text-slate-600 tabular-nums">
                  <span className="font-semibold text-blue-600">
                    {presentCount}
                  </span>
                  /{employees.length} Hadir
                </p>
              </div>

              {/* Radial Progress Ring: Cobalt Blue -> Sky -> Solar Orange */}
              <div className="relative flex size-14 items-center justify-center">
                <svg className="size-14 -rotate-90" viewBox="0 0 48 48">
                  <defs>
                    <linearGradient
                      id="sulo-dual-ring"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#1D4ED8" />
                      <stop offset="52%" stopColor="#0EA5E9" />
                      <stop offset="100%" stopColor="#F97316" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="24"
                    cy="24"
                    r={ringRadius}
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.25)"
                    strokeWidth="4.5"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r={ringRadius}
                    fill="none"
                    stroke="url(#sulo-dual-ring)"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    className="transition-all duration-700"
                  />
                </svg>
                <CheckCircle2 className="absolute size-4 text-blue-600" />
              </div>
            </div>
          </TildGlassCard>
        </WaterfallItem>

        {/* KPI 3: Solar Orange Energy Accent (Action Required) */}
        <WaterfallItem>
          <TildGlassCard className="glass-sulo-orange relative overflow-hidden">
            <div className="bg-sulo-cta absolute inset-x-0 top-0 h-0.5" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Menunggu Persetujuan
              </span>
              <LivePulseBeacon
                active={pendingLeaves.length > 0}
                colorClass="bg-orange-500"
              />
            </div>
            <p className="text-sulo-orange-gradient mt-2.5 text-3xl font-bold">
              <KineticCounter
                value={pendingLeaves.length}
                suffix=" Pengajuan"
              />
            </p>
            <Link
              href="/admin/approvals"
              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-orange-700 underline decoration-orange-400 underline-offset-4 transition-colors hover:text-orange-800"
            >
              <Clock3 className="size-3 text-orange-600" />
              Tinjau antrean sekarang
            </Link>
          </TildGlassCard>
        </WaterfallItem>

        {/* KPI 4: Rose/Amber Risk Alert */}
        <WaterfallItem>
          <TildGlassCard className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-orange-500 to-rose-500 opacity-80" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Kontrak Segera Berakhir
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200/80">
                <AlertTriangle className="size-4" />
              </div>
            </div>
            <p className="mt-2.5 text-3xl font-bold text-rose-600">
              <KineticCounter value={expiringContracts.length} suffix=" PKWT" />
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Berakhir &lt; 30 hari ke depan
            </p>
          </TildGlassCard>
        </WaterfallItem>
      </WaterfallContainer>

      {/* Visualisasi Data: Stacked Bar Chart & Donut Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="glass-sulo-card border-0 text-slate-900 lg:col-span-7">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="font-display flex items-center gap-2 text-base text-slate-900">
                <Activity className="size-4 text-orange-500" />
                Tren Kehadiran 7 Hari Kerja Terakhir
              </CardTitle>
              <p className="text-xs text-slate-500">
                Sorot batang grafik untuk membedah rasio kehadiran harian
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs bg-blue-600" />
                Tepat Waktu
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs bg-orange-500" />
                Terlambat
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs bg-slate-300" />
                Cuti/Izin
              </span>
            </div>
          </CardHeader>

          <CardContent className="relative">
            {/* Motion Graphic SVG Telemetry Pulse Line (Cobalt -> Azure -> Solar Orange) */}
            <svg
              aria-hidden="true"
              viewBox="0 0 420 36"
              className="mb-2 h-8 w-full overflow-visible"
            >
              <defs>
                <linearGradient
                  id="sulo-pulse-stroke"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#0EA5E9" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#FA4D09" stopOpacity="0.95" />
                </linearGradient>
              </defs>
              <motion.path
                d="M 4 24 Q 65 8, 120 20 T 240 14 T 350 18 T 416 9"
                fill="none"
                stroke="url(#sulo-pulse-stroke)"
                strokeWidth="2.4"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.4, ease: "easeOut" }}
              />
            </svg>

            {/* Frosted Glass Hover Tooltip */}
            <div className="mb-3 min-h-[34px]">
              {hoveredDay ? (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-sulo-elevated inline-flex flex-wrap items-center gap-3 rounded-xl px-3.5 py-1.5 font-mono text-xs tabular-nums"
                >
                  <span className="font-semibold text-slate-900">
                    {hoveredDay.day} ({hoveredDay.dateLabel}):
                  </span>
                  <span className="font-semibold text-blue-700">
                    Tepat Waktu {hoveredDay.onTime}
                  </span>
                  <span className="font-semibold text-orange-600">
                    Terlambat {hoveredDay.late}
                  </span>
                  <span className="text-slate-600">
                    Cuti/Izin {hoveredDay.leave}
                  </span>
                </motion.div>
              ) : (
                <p className="text-xs text-slate-500">
                  Hari ini ({weeklyStats[6].dateLabel}):{" "}
                  <span className="font-mono font-semibold text-blue-700 tabular-nums">
                    {onTimeCount} Tepat Waktu
                  </span>
                  ,{" "}
                  <span className="font-mono font-semibold text-orange-600 tabular-nums">
                    {lateCount} Terlambat
                  </span>
                  ,{" "}
                  <span className="font-mono text-slate-600 tabular-nums">
                    {leaveCount} Cuti/Izin
                  </span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-7 items-end gap-2.5 pt-1 sm:gap-4">
              {weeklyStats.map((stat) => {
                const onTimePct = (stat.onTime / totalEmployees) * 100;
                const latePct = (stat.late / totalEmployees) * 100;
                const leavePct = (stat.leave / totalEmployees) * 100;

                return (
                  <div
                    key={stat.dateLabel}
                    onMouseEnter={() => setHoveredDay(stat)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="group flex cursor-pointer flex-col items-center gap-2"
                  >
                    <div className="flex h-40 w-full max-w-[46px] flex-col-reverse overflow-hidden rounded-xl border border-slate-200/90 bg-slate-100/85 p-1 shadow-inner transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-orange-400 group-hover:shadow-md">
                      <div
                        style={{ height: `${onTimePct}%` }}
                        className="w-full rounded-b-lg bg-gradient-to-t from-blue-700 to-blue-500 transition-all duration-500"
                      />
                      <div
                        style={{ height: `${latePct}%` }}
                        className="w-full bg-gradient-to-t from-orange-600 to-amber-400 transition-all duration-500"
                      />
                      <div
                        style={{ height: `${leavePct}%` }}
                        className="w-full rounded-t-lg bg-slate-300 transition-all duration-500"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-semibold text-slate-700 group-hover:text-orange-600">
                        {stat.day}
                      </p>
                      <p className="font-mono text-[10px] text-slate-500 tabular-nums">
                        {stat.dateLabel}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Donut Chart 5 Departemen (Multi-Spectrum Kontras Tinggi) */}
        <Card className="glass-sulo-card border-0 text-slate-900 lg:col-span-5">
          <CardHeader>
            <CardTitle className="font-display text-base text-slate-900">
              Distribusi 5 Departemen
            </CardTitle>
            <p className="text-xs text-slate-500">
              Komposisi sumber daya manusia per divisi aktif
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
            <div className="relative flex size-40 shrink-0 items-center justify-center">
              <svg className="size-40 -rotate-90" viewBox="0 0 140 140">
                {departmentCounts.map((dept) => {
                  const pct =
                    employees.length > 0 ? dept.count / employees.length : 0;
                  const dashArray = `${pct * donutCircumference} ${donutCircumference}`;
                  const dashOffset = -cumulativePercent * donutCircumference;
                  cumulativePercent += pct;
                  const isDimmed =
                    hoveredDept !== null && hoveredDept !== dept.name;

                  return (
                    <circle
                      key={dept.name}
                      cx="70"
                      cy="70"
                      r={donutRadius}
                      fill="none"
                      stroke={dept.color}
                      strokeWidth={hoveredDept === dept.name ? "19" : "16"}
                      strokeDasharray={dashArray}
                      strokeDashoffset={dashOffset}
                      style={{ opacity: isDimmed ? 0.35 : 1 }}
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>
              <div className="absolute flex size-24 flex-col items-center justify-center rounded-full bg-white/95 shadow-xs">
                <p className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                  {employees.length}
                </p>
                <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                  Karyawan
                </p>
              </div>
            </div>

            <div className="flex w-full flex-1 flex-col gap-2">
              {departmentCounts.map((dept) => {
                const pct =
                  employees.length > 0
                    ? Math.round((dept.count / employees.length) * 100)
                    : 0;
                const isSelected = hoveredDept === dept.name;

                return (
                  <div
                    key={dept.name}
                    onMouseEnter={() => setHoveredDept(dept.name)}
                    onMouseLeave={() => setHoveredDept(null)}
                    className={`flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                      isSelected ? "bg-white/90 shadow-2xs" : "hover:bg-white/60"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-medium text-slate-700">
                      <span
                        style={{ backgroundColor: dept.color }}
                        className="size-2.5 rounded-full shadow-2xs"
                      />
                      {dept.name}
                    </span>
                    <span className="font-mono font-semibold text-slate-800 tabular-nums">
                      {dept.count}{" "}
                      <span className="text-slate-500">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Approval Stream */}
      <Card className="glass-sulo-card border-0 text-slate-900">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display text-base text-slate-900">
              Quick Approval Stream (5 Pengajuan Terbaru)
            </CardTitle>
            <p className="text-xs text-slate-500">
              Persetujuan instan memotong kuota cuti &amp; mencatat log audit
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-orange-300 bg-orange-50 font-semibold text-orange-700"
          >
            {pendingLeaves.length} Pending
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {pendingLeaves.length === 0 ? (
            <p className="rounded-xl border border-slate-200/80 bg-white/75 py-6 text-center text-sm text-slate-500">
              Seluruh pengajuan cuti dan izin telah diproses.
            </p>
          ) : (
            <AnimatePresence mode="popLayout">
              {pendingLeaves.slice(0, 5).map((item) => {
                const emp = employees.find((e) => e.id === item.employeeId);
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                    transition={SULO_SPRING}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white/85 p-3.5 shadow-2xs transition-colors hover:border-orange-300"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {emp?.fullName}
                        </span>
                        <span className="rounded-md border border-orange-200/80 bg-orange-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-orange-700">
                          {item.type}
                        </span>
                      </div>
                      <span className="text-xs text-slate-600">
                        {item.startDate} s.d. {item.endDate} (
                        <strong className="font-mono font-semibold text-slate-800 tabular-nums">
                          {item.effectiveDays} hari kerja
                        </strong>
                        )
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const res = reviewLeaveRequest(item.id, "APPROVED");
                          if (res.ok) toast.success(res.message);
                        }}
                        className="bg-sulo-blue-pill border-0 font-semibold text-white active:scale-[0.98]"
                      >
                        <Check data-icon="inline-start" />
                        Setujui
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const res = reviewLeaveRequest(
                            item.id,
                            "REJECTED",
                            "Jadwal bertabrakan dengan rilis sprint tim.",
                          );
                          if (res.ok) toast.info(res.message);
                        }}
                        className="border-rose-200 bg-rose-50/80 text-rose-700 hover:bg-rose-100 active:scale-[0.98]"
                      >
                        <X data-icon="inline-start" />
                        Tolak
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </CardContent>
      </Card>
    </div>
  );
}