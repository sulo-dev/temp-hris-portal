// src/app/ess/home/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, CalendarCheck, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSuloStore } from "@/store/use-sulo-store";
import { TildGlassCard } from "@/components/motion/tild-glass-card";
import { WorkMode } from "@/lib/types";

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

export default function EssHomePage() {
  const {
    activeUserId,
    employees,
    attendance,
    leaves,
    clockInToday,
    clockOutToday,
  } = useSuloStore();

  const [nowClock, setNowClock] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("WFO");

  useEffect(() => {
    const update = () => setNowClock(new Date().toTimeString().slice(0, 8));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  const currentUser = employees.find((e) => e.id === activeUserId);
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayRecord = attendance.find(
    (a) => a.employeeId === activeUserId && a.date === todayIso,
  );
  const myLeaves = leaves.filter((l) => l.employeeId === activeUserId);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white md:text-3xl">
            Halo, {currentUser?.fullName ?? "Karyawan"}
          </h1>
          <p className="font-mono text-xs text-slate-300">
            {currentUser?.nip} • {currentUser?.position} (
            {currentUser?.department})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            render={<Link href="/ess/leaves" />}
            nativeButton={false}
            variant="outline"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            <CalendarCheck data-icon="inline-start" />
            Ajukan Cuti
          </Button>
          <Button
            render={<Link href="/ess/payslips" />}
            nativeButton={false}
            variant="outline"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            <FileSpreadsheet data-icon="inline-start" />
            Slip Gaji Saya
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Widget Clock-In / Clock-Out Interaktif */}
        <div className="lg:col-span-6">
          <TildGlassCard className="border-[#FF9F03]/30">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <Clock className="size-4 text-[#FF9F03]" />
                Presensi Harian Real-Time
              </span>
              <Badge
                variant="outline"
                className="border-white/20 font-mono text-xs text-white"
              >
                {todayIso}
              </Badge>
            </div>

            <p className="mt-4 font-mono text-4xl font-bold tracking-tight text-white tabular-nums">
              {nowClock || "08:55:00"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Jam kerja standar 09:00 – 17:00 (Toleransi keterlambatan 5 menit)
            </p>

            {!todayRecord?.clockIn ? (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="flex rounded-xl border border-white/15 bg-[#020E2B]/70 p-1">
                  {(["WFO", "WFH"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setWorkMode(mode)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        workMode === mode
                          ? "bg-sulo-cta text-white"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <Button
                  type="button"
                  size="lg"
                  onClick={() => {
                    const res = clockInToday(workMode);
                    if (res.ok) toast.success(res.message);
                  }}
                  className="bg-sulo-cta border-0 text-white"
                >
                  Clock-In Sekarang ({workMode})
                </Button>
              </div>
            ) : (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                <div className="flex flex-col gap-0.5">
                  <p className="font-mono text-xs text-emerald-300 tabular-nums">
                    Masuk: {todayRecord.clockIn} ({todayRecord.workMode})
                  </p>
                  <p className="font-mono text-xs text-slate-200 tabular-nums">
                    {todayRecord.clockOut
                      ? `Pulang: ${todayRecord.clockOut}`
                      : `Durasi Aktif: ${formatElapsedDuration(
                          todayRecord.clockIn,
                          nowClock || todayRecord.clockIn,
                        )}`}
                  </p>
                </div>
                {!todayRecord.clockOut && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      const res = clockOutToday();
                      if (res.ok) toast.success(res.message);
                    }}
                  >
                    Clock-Out
                  </Button>
                )}
              </div>
            )}
          </TildGlassCard>
        </div>

        {/* Kartu Kuota Cuti & Riwayat */}
        <div className="lg:col-span-6">
          <TildGlassCard>
            <h2 className="font-display text-base font-semibold text-white">
              Sisa Kuota Cuti Tahunan
            </h2>
            <p className="mt-2 font-mono text-4xl font-bold text-[#FF9F03] tabular-nums">
              {currentUser?.remainingLeaveQuota ?? 12}{" "}
              <span className="text-base font-normal text-slate-300">
                / {currentUser?.annualLeaveQuota ?? 12} Hari Kerja
              </span>
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {myLeaves.length === 0 ? (
                <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-400">
                  Belum ada riwayat pengajuan cuti atau izin.
                </p>
              ) : (
                myLeaves.slice(0, 3).map((lv) => (
                  <div
                    key={lv.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs"
                  >
                    <span>
                      {lv.type} ({lv.effectiveDays} hari)
                    </span>
                    <Badge
                      variant="outline"
                      className="border-white/20 text-slate-200"
                    >
                      {lv.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </TildGlassCard>
        </div>
      </div>
    </div>
  );
}
