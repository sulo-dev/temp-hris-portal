// src/app/ess/home/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock,
  CalendarCheck,
  FileSpreadsheet,
  LogIn,
  LogOut,
  Building2,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Wallet,
  CalendarDays,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSuloStore } from "@/store/use-sulo-store";
import { formatRupiah } from "@/lib/business-rules";
import { WorkMode } from "@/lib/types";
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

function formatElapsedDuration(clockIn: string, nowTime: string): string {
  const [inH, inM, inS] = clockIn.split(":").map(Number);
  const [nowH, nowM, nowS] = nowTime.split(":").map(Number);
  if ([inH, inM, nowH, nowM].some(Number.isNaN)) return "00:00:00";

  const startSec = inH * 3600 + inM * 60 + (inS || 0);
  const currentSec = nowH * 3600 + nowM * 60 + (nowS || 0);
  const diff = Math.max(0, currentSec - startSec);

  const h = String(Math.floor(diff / 3600)).padStart(2, "0");
  const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
  const s = String(diff % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatIndoFullDate(isoDate: string): string {
  if (!isoDate) return "Memuat tanggal...";
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export default function EssHomePage() {
  const {
    activeUserId,
    employees,
    attendance,
    leaves,
    payrolls,
    privacyShield,
    clockInToday,
    clockOutToday,
  } = useSuloStore();

  const [nowClock, setNowClock] = useState("");
  const [todayIso, setTodayIso] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("WFO");

  useEffect(() => {
    const syncClock = () => {
      const now = new Date();
      setNowClock(now.toTimeString().slice(0, 8));
      setTodayIso(now.toISOString().slice(0, 10));
    };
    syncClock();
    const id = window.setInterval(syncClock, 1000);
    return () => window.clearInterval(id);
  }, []);

  const currentUser = employees.find((e) => e.id === activeUserId);

  const todayRecord = useMemo(() => {
    if (!todayIso) return undefined;
    return attendance.find(
      (a) => a.employeeId === activeUserId && a.date === todayIso,
    );
  }, [attendance, activeUserId, todayIso]);

  const myAttendanceHistory = useMemo(() => {
    return attendance
      .filter((a) => a.employeeId === activeUserId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, activeUserId]);

  const myLeaves = useMemo(() => {
    return leaves
      .filter((l) => l.employeeId === activeUserId)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [leaves, activeUserId]);

  const latestPayslip = useMemo(() => {
    const userSlips = payrolls
      .filter((p) => p.employeeId === activeUserId)
      .sort((a, b) => b.period.localeCompare(a.period));
    return userSlips[0] ?? null;
  }, [payrolls, activeUserId]);

  // Statistik Pribadi
  const annualQuota = currentUser?.annualLeaveQuota ?? 12;
  const remainingQuota = currentUser?.remainingLeaveQuota ?? 12;
  const usedQuota = Math.max(0, annualQuota - remainingQuota);
  const quotaPercentage =
    annualQuota > 0
      ? Math.min(100, Math.round((remainingQuota / annualQuota) * 100))
      : 100;

  const pendingLeavesCount = myLeaves.filter(
    (l) => l.status === "PENDING",
  ).length;
  const presentDaysCount = myAttendanceHistory.filter(
    (a) => a.status === "TEPAT_WAKTU" || a.status === "TERLAMBAT",
  ).length;
  const onTimeDaysCount = myAttendanceHistory.filter(
    (a) => a.status === "TEPAT_WAKTU",
  ).length;
  const punctualityPct =
    presentDaysCount > 0
      ? Math.round((onTimeDaysCount / presentDaysCount) * 100)
      : 100;

  const isClockedIn = Boolean(todayRecord?.clockIn);
  const isClockedOut = Boolean(todayRecord?.clockOut);

  return (
    <div className="relative mx-auto flex max-w-[1400px] flex-col gap-6 px-4 pt-24 pb-12 sm:px-6 md:pt-28">
      <SpatialBackdrop />

      {/* Header Identitas Karyawan (diturunkan agar aman dari floating topbar) */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/70 pb-5">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-gradient-to-r from-white/90 via-blue-50/70 to-orange-50/80 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs">
            <LivePulseBeacon
              colorClass={
                isClockedIn && !isClockedOut
                  ? "bg-emerald-500"
                  : "bg-orange-500"
              }
            />
            <span>
              Employee Self-Service •{" "}
              <span className="text-blue-700">
                {currentUser?.department ?? "PT Sulo Indonesia"}
              </span>
            </span>
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Halo,{" "}
            <span className="text-sulo-gradient">
              {currentUser?.fullName ?? "Karyawan"}
            </span>
          </h1>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="rounded-md border border-slate-200/90 bg-white/85 px-2 py-0.5 font-mono font-semibold text-slate-800">
              {currentUser?.nip ?? "SL-EMP"}
            </span>
            <span>•</span>
            <span className="font-medium text-slate-700">
              {currentUser?.position ?? "Staff"}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              {currentUser?.contractEndDate ? "PKWT Aktif" : "PKWTT Tetap"}
            </span>
          </div>
        </div>

        <div className="glass-sulo-card flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs">
          <Clock className="size-4 text-blue-600" />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800">
              {formatIndoFullDate(todayIso)}
            </span>
            <span className="font-mono text-[11px] text-slate-500 tabular-nums">
              Waktu Sistem: {nowClock || "08:55:00"} WITA
            </span>
          </div>
        </div>
      </div>

      {/* Fitur Utama Terpisah: Modul Cuti & Modul Slip Gaji */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Kartu Fitur 1: Ajukan Cuti & Izin */}
        <div className="glass-sulo-orange relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl p-5">
          <div className="bg-sulo-cta absolute inset-x-0 top-0 h-1" />
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100/90 text-orange-600 ring-1 ring-orange-200">
              <CalendarCheck className="size-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-base font-bold text-slate-900">
                  Pengajuan Cuti &amp; Izin
                </h2>
                <Badge
                  variant="outline"
                  className="border-orange-300/80 bg-white/90 font-mono text-[11px] font-semibold text-orange-700"
                >
                  Sisa {remainingQuota} Hari
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Ajukan cuti tahunan, izin sakit, atau keperluan keluarga dengan
                kalkulasi otomatis hari kerja efektif.
              </p>
            </div>
          </div>

          <div className="flex justify-end border-t border-orange-200/60 pt-3">
            <MagneticAction>
              <Button
                render={<Link href="/ess/leaves" />}
                nativeButton={false}
                className="bg-sulo-cta border-0 px-5 font-semibold text-white active:scale-[0.98]"
              >
                <CalendarCheck data-icon="inline-start" />
                Ajukan Cuti / Izin
                <ArrowUpRight data-icon="inline-end" />
              </Button>
            </MagneticAction>
          </div>
        </div>

        {/* Kartu Fitur 2: Slip Gaji & Kompensasi */}
        <div className="glass-sulo-card relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl p-5">
          <div className="bg-sulo-blue-pill absolute inset-x-0 top-0 h-1" />
          <div className="flex items-start gap-3.5">
            <div className="bg-sulo-blue-pill flex size-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-xs">
              <FileSpreadsheet className="size-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-base font-bold text-slate-900">
                  Slip Gaji &amp; Kompensasi
                </h2>
                <Badge
                  variant="outline"
                  className="border-blue-200 bg-blue-50/80 font-mono text-[11px] font-semibold text-blue-700"
                >
                  {latestPayslip ? `Periode ${latestPayslip.period}` : "E-Payslip"}
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Lihat rincian penerimaan bulanan, potongan BPJS &amp; PPh 21
                TER, serta cetak slip gaji resmi format A4.
              </p>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-200/75 pt-3">
            <MagneticAction>
              <Button
                render={<Link href="/ess/payslips" />}
                nativeButton={false}
                className="bg-sulo-blue-pill border-0 px-5 font-semibold text-white shadow-xs hover:opacity-95 active:scale-[0.98]"
              >
                <FileSpreadsheet data-icon="inline-start" />
                Buka Slip Gaji Saya
                <ArrowUpRight data-icon="inline-end" />
              </Button>
            </MagneticAction>
          </div>
        </div>
      </div>

      {/* 4 Kartu Ringkasan KPI Personal */}
      <WaterfallContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* KPI 1: Status Shift Hari Ini */}
        <WaterfallItem>
          <TildGlassCard className="relative overflow-hidden">
            <div className="bg-sulo-blue-pill absolute inset-x-0 top-0 h-0.5 opacity-80" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Status Shift Hari Ini
              </span>
              <div className="bg-sulo-blue-pill flex size-8 items-center justify-center rounded-xl text-white">
                <Clock className="size-4" />
              </div>
            </div>
            <p className="mt-2.5 text-xl font-bold text-slate-900">
              {!isClockedIn
                ? "Belum Clock-In"
                : isClockedOut
                  ? "Shift Selesai"
                  : `Aktif (${todayRecord?.workMode})`}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-600 tabular-nums">
              {isClockedIn
                ? `Masuk ${todayRecord?.clockIn}${
                    todayRecord?.clockOut
                      ? ` • Pulang ${todayRecord.clockOut}`
                      : ""
                  }`
                : "Jadwal standar 09:00 – 17:00"}
            </p>
          </TildGlassCard>
        </WaterfallItem>

        {/* KPI 2: Sisa Kuota Cuti */}
        <WaterfallItem>
          <TildGlassCard className="glass-sulo-orange relative overflow-hidden">
            <div className="bg-sulo-cta absolute inset-x-0 top-0 h-0.5" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Sisa Cuti Tahunan
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-orange-100/80 text-orange-600 ring-1 ring-orange-200/80">
                <CalendarDays className="size-4" />
              </div>
            </div>
            <p className="text-sulo-orange-gradient mt-2.5 text-2xl font-bold">
              <KineticCounter value={remainingQuota} suffix=" Hari" />
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Terpakai{" "}
              <strong className="font-mono text-slate-800">{usedQuota}</strong>{" "}
              dari {annualQuota} hari kerja
            </p>
          </TildGlassCard>
        </WaterfallItem>

        {/* KPI 3: Kedisiplinan Presensi */}
        <WaterfallItem>
          <TildGlassCard className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500 opacity-85" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Kedisiplinan Presensi
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/80">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <p className="mt-2.5 text-2xl font-bold text-slate-900">
              <KineticCounter value={punctualityPct} suffix="%" />
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-700">
              {onTimeDaysCount} tepat waktu dari {presentDaysCount} hari hadir
            </p>
          </TildGlassCard>
        </WaterfallItem>

        {/* KPI 4: Slip Gaji Terakhir */}
        <WaterfallItem>
          <TildGlassCard className="relative overflow-hidden">
            <div className="bg-sulo-dual-gradient absolute inset-x-0 top-0 h-0.5 opacity-80" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Take Home Pay Terakhir
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-200/80">
                <Wallet className="size-4" />
              </div>
            </div>
            <p
              className={`mt-2.5 font-mono text-xl font-bold text-slate-900 tabular-nums transition-all ${
                privacyShield ? "blur-xs select-none" : ""
              }`}
            >
              {latestPayslip
                ? formatRupiah(latestPayslip.takeHomePay)
                : "Belum Terbit"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {latestPayslip
                ? `Periode ${latestPayslip.period} (${latestPayslip.status})`
                : "Menunggu rilis payroll bulanan"}
            </p>
          </TildGlassCard>
        </WaterfallItem>
      </WaterfallContainer>

      {/* Baris Utama: Terminal Presensi Real-Time & Ringkasan Kuota Cuti */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Widget Clock-In / Clock-Out Interaktif */}
        <div className="lg:col-span-6">
          <TildGlassCard className="relative flex h-full flex-col justify-between overflow-hidden">
            <div className="bg-sulo-dual-gradient absolute inset-x-0 top-0 h-1" />

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <span className="bg-sulo-blue-pill flex size-7 items-center justify-center rounded-lg text-white">
                    <Clock className="size-4" />
                  </span>
                  Terminal Presensi Harian
                </span>
                <Badge
                  variant="outline"
                  className="border-blue-200 bg-blue-50/80 font-mono text-xs font-semibold text-blue-700"
                >
                  {todayIso || "Hari Ini"}
                </Badge>
              </div>

              {/* Jam Digital Real-Time */}
              <div className="mt-5 rounded-2xl border border-slate-200/90 bg-gradient-to-r from-blue-50/70 via-white to-orange-50/70 p-4 shadow-inner">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-mono text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums sm:text-5xl">
                    {nowClock || "08:55:00"}
                  </p>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                    WITA • UTC+8
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600">
                  Jam kerja standar{" "}
                  <strong className="font-mono text-slate-800">
                    09:00 – 17:00
                  </strong>{" "}
                  (Toleransi keterlambatan 5 menit)
                </p>
              </div>
            </div>

            {/* Kontrol Clock-In / Clock-Out */}
            <div className="mt-5">
              {!isClockedIn ? (
                <div className="flex flex-col gap-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-600">
                      Pilih Lokasi Kerja Hari Ini:
                    </span>
                    <div className="flex rounded-xl border border-slate-200/90 bg-slate-100/90 p-1">
                      {(
                        [
                          { value: "WFO", label: "WFO (Kantor)", icon: Building2 },
                          { value: "WFH", label: "WFH (Remote)", icon: Laptop },
                        ] as const
                      ).map((item) => {
                        const active = workMode === item.value;
                        const IconComp = item.icon;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setWorkMode(item.value)}
                            className="relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                          >
                            {active && (
                              <motion.span
                                layoutId="ess-workmode-pill"
                                transition={SULO_SPRING}
                                className="bg-sulo-blue-pill absolute inset-0 rounded-lg"
                              />
                            )}
                            <span
                              className={`relative z-10 flex items-center gap-1.5 ${
                                active
                                  ? "text-white"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              <IconComp className="size-3.5" />
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="lg"
                    onClick={() => {
                      const res = clockInToday(workMode);
                      if (res.ok) toast.success(res.message);
                      else toast.error(res.message);
                    }}
                    className="bg-sulo-cta w-full border-0 font-semibold text-white active:scale-[0.99]"
                  >
                    <LogIn data-icon="inline-start" />
                    Clock-In Sekarang ({workMode})
                  </Button>
                </div>
              ) : (
                <div
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${
                    isClockedOut
                      ? "border-blue-200/90 bg-blue-50/70"
                      : "border-emerald-200/90 bg-emerald-50/75"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          isClockedOut
                            ? "border-blue-300 bg-white font-semibold text-blue-700"
                            : "border-emerald-300 bg-white font-semibold text-emerald-700"
                        }
                      >
                        {todayRecord?.workMode} •{" "}
                        {todayRecord?.status === "TERLAMBAT"
                          ? "Terlambat"
                          : "Tepat Waktu"}
                      </Badge>
                      <span className="font-mono text-xs font-bold text-slate-800 tabular-nums">
                        Masuk: {todayRecord?.clockIn}
                      </span>
                    </div>

                    <p className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                      {isClockedOut
                        ? `Pulang: ${todayRecord?.clockOut} • Sesi hari ini selesai`
                        : `Durasi Kerja Berjalan: ${formatElapsedDuration(
                            todayRecord?.clockIn ?? "09:00:00",
                            nowClock || todayRecord?.clockIn || "09:00:00",
                          )}`}
                    </p>
                  </div>

                  {!isClockedOut && (
                    <Button
                      type="button"
                      onClick={() => {
                        const res = clockOutToday();
                        if (res.ok) toast.success(res.message);
                        else toast.error(res.message);
                      }}
                      className="border-0 bg-rose-600 font-semibold text-white shadow-xs hover:bg-rose-700 active:scale-[0.98]"
                    >
                      <LogOut data-icon="inline-start" />
                      Clock-Out
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TildGlassCard>
        </div>

        {/* Kartu Saldo Cuti & Status Pengajuan Terbaru */}
        <div className="lg:col-span-6">
          <TildGlassCard className="flex h-full flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Saldo Cuti &amp; Riwayat Pengajuan
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pemantauan hak cuti tahunan dan status persetujuan HR
                  </p>
                </div>
                {pendingLeavesCount > 0 && (
                  <Badge
                    variant="outline"
                    className="border-orange-300 bg-orange-50 font-semibold text-orange-700"
                  >
                    {pendingLeavesCount} Menunggu Review
                  </Badge>
                )}
              </div>

              {/* Visual Progress Bar Kuota Cuti */}
              <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-sulo-orange-gradient font-mono text-3xl font-extrabold tabular-nums">
                    {remainingQuota}{" "}
                    <span className="font-sans text-sm font-semibold text-slate-600">
                      / {annualQuota} Hari Tersedia
                    </span>
                  </p>
                  <span className="font-mono text-xs font-bold text-blue-700">
                    {quotaPercentage}%
                  </span>
                </div>

                <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 ring-1 ring-slate-200/80">
                  <div
                    style={{ width: `${quotaPercentage}%` }}
                    className="bg-sulo-dual-gradient h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Daftar 3 Pengajuan Terbaru */}
              <div className="mt-4 flex flex-col gap-2.5">
                {myLeaves.length === 0 ? (
                  <div className="rounded-xl border border-slate-200/80 bg-white/75 px-4 py-5 text-center">
                    <p className="text-xs font-semibold text-slate-700">
                      Belum ada riwayat pengajuan cuti atau izin.
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Gunakan modul Pengajuan Cuti &amp; Izin di atas bila
                      merencanakan cuti tahunan atau izin sakit.
                    </p>
                  </div>
                ) : (
                  myLeaves.slice(0, 3).map((lv) => (
                    <div
                      key={lv.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/85 bg-white/85 px-3.5 py-2.5 text-xs shadow-2xs"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-900">
                          {lv.type} •{" "}
                          <span className="font-mono text-blue-700">
                            {lv.effectiveDays} hari kerja
                          </span>
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {lv.startDate} s.d. {lv.endDate}
                        </span>
                      </div>

                      {lv.status === "APPROVED" && (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"
                        >
                          <CheckCircle2 className="mr-1 size-3" />
                          Disetujui
                        </Badge>
                      )}
                      {lv.status === "PENDING" && (
                        <Badge
                          variant="outline"
                          className="border-orange-200 bg-orange-50 font-semibold text-orange-700"
                        >
                          <Clock3 className="mr-1 size-3" />
                          Pending
                        </Badge>
                      )}
                      {lv.status === "REJECTED" && (
                        <Badge
                          variant="outline"
                          className="border-rose-200 bg-rose-50 font-semibold text-rose-700"
                        >
                          <AlertCircle className="mr-1 size-3" />
                          Ditolak
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end border-t border-slate-200/70 pt-3">
              <Link
                href="/ess/leaves"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-orange-600 hover:underline"
              >
                Kelola semua riwayat cuti
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </TildGlassCard>
        </div>
      </div>

      {/* Baris Bawah: Log Presensi Terakhir & Ringkasan Kompensasi */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Tabel Riwayat Presensi Pribadi */}
        <Card className="glass-sulo-card border-0 text-slate-900 lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-base text-slate-900">
                Log Presensi Terbaru Anda
              </CardTitle>
              <p className="text-xs text-slate-500">
                Catatan kehadiran harian yang tersinkronisasi ke perhitungan
                payroll
              </p>
            </div>
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50/80 font-mono text-xs font-semibold text-blue-700"
            >
              {myAttendanceHistory.length} Catatan
            </Badge>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/75">
                <TableRow className="border-slate-200/90 hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-700">
                    Tanggal
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Mode
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Jam Masuk
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Jam Pulang
                  </TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAttendanceHistory.length === 0 ? (
                  <TableRow className="border-slate-200/80 hover:bg-transparent">
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-xs text-slate-500"
                    >
                      Belum ada riwayat presensi tercatat untuk akun Anda.
                    </TableCell>
                  </TableRow>
                ) : (
                  myAttendanceHistory.slice(0, 5).map((rec) => (
                    <TableRow
                      key={rec.id}
                      className="border-slate-200/75 bg-white/40 hover:bg-blue-50/45"
                    >
                      <TableCell className="font-mono text-xs font-semibold text-slate-800">
                        {rec.date}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                            rec.workMode === "WFO"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-orange-200 bg-orange-50 text-orange-700"
                          }`}
                        >
                          {rec.workMode}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-700 tabular-nums">
                        {rec.clockIn || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-700 tabular-nums">
                        {rec.clockOut || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {rec.status === "TEPAT_WAKTU" && (
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"
                          >
                            Tepat Waktu
                          </Badge>
                        )}
                        {rec.status === "TERLAMBAT" && (
                          <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-50 font-semibold text-amber-800"
                          >
                            Terlambat
                          </Badge>
                        )}
                        {rec.status === "CUTI_IZIN" && (
                          <Badge
                            variant="outline"
                            className="border-sky-200 bg-sky-50 font-semibold text-sky-700"
                          >
                            Cuti / Izin
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Ringkasan Slip Gaji Periode Terakhir */}
        <Card className="glass-sulo-card border-0 text-slate-900 lg:col-span-5">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-base text-slate-900">
              <Sparkles className="size-4 text-orange-500" />
              Ringkasan Kompensasi Terakhir
            </CardTitle>
            <p className="text-xs text-slate-500">
              Rincian cepat penerimaan bersih dan potongan wajib bulanan
            </p>
          </CardHeader>
          <CardContent className="flex flex-col justify-between gap-4">
            {latestPayslip ? (
              <div className="rounded-2xl border border-slate-200/85 bg-white/85 p-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 text-xs">
                  <span className="font-semibold text-slate-600">
                    Periode Penggajian
                  </span>
                  <span className="font-mono font-bold text-blue-700">
                    {latestPayslip.period}
                  </span>
                </div>

                <div className="mt-3 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="font-sans text-slate-600">
                      Total Penerimaan Bruto
                    </span>
                    <span
                      className={`font-semibold text-slate-900 ${
                        privacyShield ? "blur-xs select-none" : ""
                      }`}
                    >
                      {formatRupiah(latestPayslip.totalEarnings)}
                    </span>
                  </div>
                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="font-sans text-slate-600">
                      BPJS &amp; PPh 21 TER
                    </span>
                    <span
                      className={`font-semibold text-rose-600 ${
                        privacyShield ? "blur-xs select-none" : ""
                      }`}
                    >
                      -{formatRupiah(latestPayslip.totalDeductions)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between border-t border-slate-200/80 pt-2.5">
                    <span className="font-bold text-slate-900">
                      Take Home Pay
                    </span>
                    <span
                      className={`text-sulo-orange-gradient font-mono text-base font-extrabold tabular-nums ${
                        privacyShield ? "blur-xs select-none" : ""
                      }`}
                    >
                      {formatRupiah(latestPayslip.takeHomePay)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 text-center">
                <p className="text-xs font-semibold text-slate-700">
                  Belum ada slip gaji yang diterbitkan untuk periode ini.
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Slip gaji elektronik akan muncul otomatis setelah tim HR
                  menjalankan kalkulasi payroll bulanan.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}