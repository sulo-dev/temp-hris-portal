// src/components/admin/dashboard-analytics-charts.tsx
"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  ShieldCheck,
  Briefcase,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DepartmentName, Employee, PayrollItem } from "@/lib/types";
import { formatRupiah } from "@/lib/business-rules";
import { SULO_SPRING } from "@/components/motion/motion-primitives";

interface DashboardAnalyticsChartsProps {
  employees: Employee[];
  payrolls: PayrollItem[];
  privacyShield: boolean;
  attendanceRate: number;
  onTimeRate: number;
}

type PayrollMetricView = "NET" | "GROSS" | "DEDUCTION";

const DEPARTMENTS: DepartmentName[] = [
  "Engineering",
  "Product & Design",
  "Marketing",
  "Finance",
  "HR",
];

const DEPT_META: Record<
  DepartmentName,
  { barGradient: string; badge: string; dot: string; defaultAvgSalary: number }
> = {
  Engineering: {
    barGradient: "from-blue-700 to-blue-500",
    badge: "border-blue-200/80 bg-blue-50/80 text-blue-700",
    dot: "bg-blue-600",
    defaultAvgSalary: 14500000,
  },
  "Product & Design": {
    barGradient: "from-sky-600 to-cyan-400",
    badge: "border-sky-200/80 bg-sky-50/80 text-sky-700",
    dot: "bg-sky-500",
    defaultAvgSalary: 12200000,
  },
  Marketing: {
    barGradient: "from-orange-600 to-amber-400",
    badge: "border-orange-200/80 bg-orange-50/80 text-orange-700",
    dot: "bg-orange-500",
    defaultAvgSalary: 10500000,
  },
  Finance: {
    barGradient: "from-amber-600 to-yellow-400",
    badge: "border-amber-200/80 bg-amber-50/80 text-amber-800",
    dot: "bg-amber-500",
    defaultAvgSalary: 11800000,
  },
  HR: {
    barGradient: "from-emerald-600 to-teal-400",
    badge: "border-emerald-200/80 bg-emerald-50/80 text-emerald-700",
    dot: "bg-emerald-500",
    defaultAvgSalary: 10800000,
  },
};

interface SixMonthTrendPoint {
  month: string;
  headcount: number;
  payrollMillions: number;
  punctualityPct: number;
}

export function DashboardAnalyticsCharts({
  employees,
  payrolls,
  privacyShield,
  attendanceRate,
  onTimeRate,
}: DashboardAnalyticsChartsProps) {
  const [metricView, setMetricView] = useState<PayrollMetricView>("NET");
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number>(5);

  // 1. Agregasi Payroll per Departemen (ambil dari store payrolls 2026-11, fallback estimasi gaji karyawan)
  const deptPayrollStats = useMemo(() => {
    const novPayrolls = payrolls.filter((p) => p.period === "2026-11");

    return DEPARTMENTS.map((dept) => {
      const deptEmployees = employees.filter((e) => e.department === dept);
      const deptEmpIds = new Set(deptEmployees.map((e) => e.id));
      const matchedItems = novPayrolls.filter((p) =>
        deptEmpIds.has(p.employeeId),
      );

      let netTotal = 0;
      let grossTotal = 0;
      let deductionTotal = 0;

      if (matchedItems.length > 0) {
        netTotal = matchedItems.reduce((acc, cur) => acc + cur.takeHomePay, 0);
        grossTotal = matchedItems.reduce(
          (acc, cur) => acc + cur.totalEarnings,
          0,
        );
        deductionTotal = matchedItems.reduce(
          (acc, cur) => acc + cur.totalDeductions,
          0,
        );
      } else {
        const count = deptEmployees.length;
        grossTotal = count * DEPT_META[dept].defaultAvgSalary;
        deductionTotal = Math.round(grossTotal * 0.065);
        netTotal = grossTotal - deductionTotal;
      }

      return {
        department: dept,
        headcount: deptEmployees.length,
        netTotal,
        grossTotal,
        deductionTotal,
      };
    });
  }, [employees, payrolls]);

  const activeMetricValues = deptPayrollStats.map((d) =>
    metricView === "NET"
      ? d.netTotal
      : metricView === "GROSS"
        ? d.grossTotal
        : d.deductionTotal,
  );
  const maxDeptMetric = Math.max(...activeMetricValues, 1);
  const sumDeptMetric = activeMetricValues.reduce((acc, v) => acc + v, 0);

  // 2. Tren Pertumbuhan 6 Bulan (Jun 2026 - Nov 2026)
  const currentHeadcount = employees.length || 12;
  const currentPayrollMillions = Math.max(
    Math.round(
      deptPayrollStats.reduce((acc, d) => acc + d.netTotal, 0) / 1_000_000,
    ),
    85,
  );

  const sixMonthTrend: SixMonthTrendPoint[] = [
    {
      month: "Jun",
      headcount: Math.max(currentHeadcount - 5, 6),
      payrollMillions: Math.round(currentPayrollMillions * 0.82),
      punctualityPct: 91.2,
    },
    {
      month: "Jul",
      headcount: Math.max(currentHeadcount - 4, 7),
      payrollMillions: Math.round(currentPayrollMillions * 0.86),
      punctualityPct: 92.8,
    },
    {
      month: "Agu",
      headcount: Math.max(currentHeadcount - 3, 8),
      payrollMillions: Math.round(currentPayrollMillions * 0.9),
      punctualityPct: 94.1,
    },
    {
      month: "Sep",
      headcount: Math.max(currentHeadcount - 2, 9),
      payrollMillions: Math.round(currentPayrollMillions * 0.94),
      punctualityPct: 93.5,
    },
    {
      month: "Okt",
      headcount: Math.max(currentHeadcount - 1, 10),
      payrollMillions: Math.round(currentPayrollMillions * 0.97),
      punctualityPct: 95.4,
    },
    {
      month: "Nov",
      headcount: currentHeadcount,
      payrollMillions: currentPayrollMillions,
      punctualityPct: Number((onTimeRate || 96.2).toFixed(1)),
    },
  ];

  // Kalkulasi koordinat SVG Area Chart (viewBox 420 x 150)
  const svgWidth = 420;
  const svgHeight = 140;
  const padX = 28;
  const padTop = 18;
  const padBottom = 22;
  const plotW = svgWidth - padX * 2;
  const plotH = svgHeight - padTop - padBottom;

  const maxPayrollM = Math.max(
    ...sixMonthTrend.map((p) => p.payrollMillions),
    1,
  );
  const minPayrollM = Math.min(...sixMonthTrend.map((p) => p.payrollMillions)) * 0.8;

  const chartPoints = sixMonthTrend.map((pt, idx) => {
    const x = padX + (idx / (sixMonthTrend.length - 1)) * plotW;
    const ratio =
      (pt.payrollMillions - minPayrollM) /
      Math.max(maxPayrollM - minPayrollM, 1);
    const y = padTop + plotH - ratio * plotH;
    return { ...pt, x, y };
  });

  const linePath = chartPoints
    .map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L ${chartPoints[chartPoints.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${chartPoints[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;

  // 3. Komposisi Status Kontrak (PKWTT vs PKWT)
  const pkwtCount = employees.filter((e) => Boolean(e.contractEndDate)).length;
  const pkwttCount = Math.max(employees.length - pkwtCount, 0);
  const pkwttPct =
    employees.length > 0 ? Math.round((pkwttCount / employees.length) * 100) : 75;
  const pkwtPct = 100 - pkwttPct;

  const avgLeaveQuota =
    employees.length > 0
      ? (
          employees.reduce((acc, e) => acc + e.remainingLeaveQuota, 0) /
          employees.length
        ).toFixed(1)
      : "10.5";

  const activeMonthPoint = chartPoints[hoveredMonthIdx] ?? chartPoints[5];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Chart A: Alokasi Anggaran Payroll per Departemen */}
      <Card className="glass-sulo-card border-0 text-slate-900 lg:col-span-5">
        <CardHeader className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="font-display flex items-center gap-2 text-base text-slate-900">
                <Wallet className="size-4 text-blue-600" />
                Distribusi Biaya SDM per Divisi
              </CardTitle>
              <p className="text-xs text-slate-500">
                Proporsi anggaran gaji periode November 2026
              </p>
            </div>
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50/80 font-mono text-[11px] font-semibold text-blue-700"
            >
              2026-11
            </Badge>
          </div>

          {/* Switcher Metrik */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1">
            {(
              [
                { key: "NET", label: "Take Home Pay" },
                { key: "GROSS", label: "Bruto" },
                { key: "DEDUCTION", label: "BPJS & PPh21" },
              ] as const
            ).map((tab) => {
              const active = metricView === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setMetricView(tab.key)}
                  className={`flex-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    active
                      ? "bg-sulo-cta text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3.5">
          {deptPayrollStats.map((row) => {
            const val =
              metricView === "NET"
                ? row.netTotal
                : metricView === "GROSS"
                  ? row.grossTotal
                  : row.deductionTotal;
            const widthPct = Math.max(Math.round((val / maxDeptMetric) * 100), 6);
            const sharePct =
              sumDeptMetric > 0 ? Math.round((val / sumDeptMetric) * 100) : 0;
            const style = DEPT_META[row.department];

            return (
              <div key={row.department} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${style.dot}`} />
                    <span className="font-semibold text-slate-800">
                      {row.department}
                    </span>
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
                      {row.headcount} staf
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    <span
                      className={`font-bold text-slate-900 transition-all ${
                        privacyShield ? "blur-xs select-none" : ""
                      }`}
                    >
                      {formatRupiah(val)}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      ({sharePct}%)
                    </span>
                  </div>
                </div>

                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 ring-1 ring-slate-200/70">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={SULO_SPRING}
                    className={`h-full rounded-full bg-gradient-to-r ${style.barGradient}`}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Chart B: Pertumbuhan Headcount & Tren Payroll 6 Bulan */}
      <Card className="glass-sulo-card border-0 text-slate-900 lg:col-span-4">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2 text-base text-slate-900">
            <TrendingUp className="size-4 text-orange-500" />
            Tren Ekspansi 6 Bulan
          </CardTitle>
          <p className="text-xs text-slate-500">
            Sorot titik bulan untuk memeriksa pertumbuhan tim &amp; payroll
          </p>
        </CardHeader>

        <CardContent className="flex flex-col justify-between gap-4">
          {/* Interactive Tooltip Pill */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200/70 bg-gradient-to-r from-blue-50/80 via-white to-orange-50/80 px-3.5 py-2.5 text-xs">
            <div>
              <span className="font-bold text-slate-900">
                {activeMonthPoint.month} 2026
              </span>
              <p className="text-[11px] text-slate-500">
                Disiplin Shift:{" "}
                <strong className="font-mono text-emerald-700">
                  {activeMonthPoint.punctualityPct}%
                </strong>
              </p>
            </div>

            <div className="text-right font-mono tabular-nums">
              <p className="font-bold text-blue-700">
                {activeMonthPoint.headcount} Karyawan
              </p>
              <p
                className={`text-[11px] font-semibold text-orange-600 ${
                  privacyShield ? "blur-xs select-none" : ""
                }`}
              >
                ± Rp {activeMonthPoint.payrollMillions} Jt
              </p>
            </div>
          </div>

          {/* SVG Smooth Gradient Area Chart */}
          <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white/75 p-2">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="h-36 w-full overflow-visible"
            >
              <defs>
                <linearGradient
                  id="sulo-six-month-fill"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.28" />
                  <stop offset="65%" stopColor="#0EA5E9" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient
                  id="sulo-six-month-line"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#1D4ED8" />
                  <stop offset="55%" stopColor="#0EA5E9" />
                  <stop offset="100%" stopColor="#FA4D09" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines */}
              {[0.25, 0.5, 0.75].map((ratio) => {
                const gy = padTop + plotH * ratio;
                return (
                  <line
                    key={ratio}
                    x1={padX}
                    y1={gy}
                    x2={svgWidth - padX}
                    y2={gy}
                    stroke="rgba(148, 163, 184, 0.25)"
                    strokeDasharray="3 3"
                  />
                );
              })}

              {/* Area & Stroke */}
              <motion.path
                d={areaPath}
                fill="url(#sulo-six-month-fill)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7 }}
              />
              <motion.path
                d={linePath}
                fill="none"
                stroke="url(#sulo-six-month-line)"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, ease: "easeOut" }}
              />

              {/* Interactive Data Nodes */}
              {chartPoints.map((pt, idx) => {
                const isSelected = idx === hoveredMonthIdx;
                return (
                  <g
                    key={pt.month}
                    onMouseEnter={() => setHoveredMonthIdx(idx)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 6.5 : 4}
                      fill={isSelected ? "#FA4D09" : "#1D4ED8"}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text
                      x={pt.x}
                      y={svgHeight - 4}
                      textAnchor="middle"
                      className={`font-mono text-[10px] ${
                        isSelected
                          ? "fill-orange-600 font-bold"
                          : "fill-slate-500"
                      }`}
                    >
                      {pt.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Chart C: Komposisi Kontrak & Indeks Kepatuhan Operasional */}
      <Card className="glass-sulo-card border-0 text-slate-900 lg:col-span-3">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2 text-base text-slate-900">
            <Briefcase className="size-4 text-emerald-600" />
            Struktur &amp; SLA SDM
          </CardTitle>
          <p className="text-xs text-slate-500">
            Status ikatan kerja &amp; kesehatan operasional
          </p>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Segmented Bar PKWTT vs PKWT */}
          <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Layers className="size-3.5 text-blue-600" />
                Status Perjanjian Kerja
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {employees.length} Total
              </span>
            </div>

            <div className="mt-2.5 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                style={{ width: `${pkwttPct}%` }}
                className="bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-500"
                title={`PKWTT (Tetap): ${pkwttCount} staf`}
              />
              <div
                style={{ width: `${pkwtPct}%` }}
                className="bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
                title={`PKWT (Kontrak): ${pkwtCount} staf`}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="size-2 rounded-full bg-blue-600" />
                PKWTT: {pkwttCount} ({pkwttPct}%)
              </span>
              <span className="flex items-center gap-1.5 text-orange-600">
                <span className="size-2 rounded-full bg-orange-500" />
                PKWT: {pkwtCount} ({pkwtPct}%)
              </span>
            </div>
          </div>

          {/* Multi-Metric Operational Gauges */}
          <div className="flex flex-col gap-3">
            <div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600">
                  Ketepatan Jam Masuk
                </span>
                <span className="font-mono font-bold text-emerald-700">
                  {onTimeRate.toFixed(1)}%
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  style={{ width: `${Math.min(onTimeRate, 100)}%` }}
                  className="h-full rounded-full bg-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600">
                  Rasio Kehadiran Aktif
                </span>
                <span className="font-mono font-bold text-blue-700">
                  {attendanceRate.toFixed(1)}%
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                  className="h-full rounded-full bg-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-800">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                Rata-rata Sisa Cuti
              </span>
              <span className="font-mono font-bold text-emerald-900">
                {avgLeaveQuota} Hari
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}