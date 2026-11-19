// src/app/admin/attendance/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock,
  UserCheck,
  AlertCircle,
  MapPin,
  Search,
  RotateCcw,
  FileSpreadsheet,
  PlusCircle,
  LogOut,
  CheckCircle2,
  Building2,
  Laptop,
  CalendarDays,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSuloStore } from "@/store/use-sulo-store";
import { DepartmentName, Employee } from "@/lib/types";
import {
  AttendanceRecord,
  AttendanceStatus,
  DEFAULT_ATTENDANCE_DATE,
  buildInitialAttendance,
  formatWorkDuration,
  getLateMinutes,
} from "@/lib/attendance-utils";
import { exportAttendanceToCsv } from "@/lib/export-utils";
import { AttendanceCorrectionModal } from "@/components/admin/attendance-correction-modal";
import {
  KineticCounter,
  LivePulseBeacon,
  MagneticAction,
  SULO_SPRING,
  WaterfallContainer,
  WaterfallItem,
} from "@/components/motion/motion-primitives";

const DEPARTMENTS = [
  "ALL",
  "Engineering",
  "Product & Design",
  "Marketing",
  "Finance",
  "HR",
] as const;

const ATTENDANCE_FILTERS: { value: "ALL" | AttendanceStatus; label: string }[] =
  [
    { value: "ALL", label: "Semua" },
    { value: "TEPAT_WAKTU", label: "Tepat Waktu" },
    { value: "TERLAMBAT", label: "Terlambat" },
    { value: "WFH", label: "WFH" },
    { value: "IZIN_CUTI", label: "Izin / Cuti" },
  ];

const DEPT_BADGE_STYLES: Record<
  DepartmentName,
  { dot: string; avatar: string; pill: string }
> = {
  Engineering: {
    dot: "bg-blue-600",
    avatar: "from-blue-700 to-blue-500 text-white",
    pill: "border-blue-200/80 bg-blue-50/80 text-blue-700",
  },
  "Product & Design": {
    dot: "bg-sky-500",
    avatar: "from-sky-600 to-cyan-500 text-white",
    pill: "border-sky-200/80 bg-sky-50/80 text-sky-700",
  },
  Marketing: {
    dot: "bg-orange-500",
    avatar: "from-orange-600 to-amber-500 text-white",
    pill: "border-orange-200/80 bg-orange-50/80 text-orange-700",
  },
  Finance: {
    dot: "bg-amber-500",
    avatar: "from-amber-600 to-yellow-500 text-white",
    pill: "border-amber-200/80 bg-amber-50/80 text-amber-800",
  },
  HR: {
    dot: "bg-emerald-500",
    avatar: "from-emerald-600 to-teal-500 text-white",
    pill: "border-emerald-200/80 bg-emerald-50/80 text-emerald-700",
  },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AttendanceManagementPage() {
  const { employees, logSecurityEvent } = useSuloStore();

  const [mounted, setMounted] = useState(false);
  const [liveClock, setLiveClock] = useState("13:45:00 WITA");
  const [selectedDate, setSelectedDate] = useState(DEFAULT_ATTENDANCE_DATE);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | AttendanceStatus>(
    "ALL",
  );

  // Override manual presensi per employeeId_date
  const [manualOverrides, setManualOverrides] = useState<
    Record<string, AttendanceRecord>
  >({});

  // State target modal koreksi
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<{
    employee: Employee | null;
    record?: AttendanceRecord;
  }>({ employee: null });

  useEffect(() => {
    setMounted(true);
    const updateClock = () => {
      const nowStr = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Makassar",
      });
      setLiveClock(`${nowStr} WITA`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const attendanceRows = useMemo(() => {
    const baseRecords = buildInitialAttendance(employees, selectedDate);
    return baseRecords.map((rec) => {
      const overrideKey = `${rec.employeeId}_${selectedDate}`;
      const activeRecord = manualOverrides[overrideKey] ?? rec;
      const employee = employees.find((e) => e.id === rec.employeeId)!;
      return {
        record: activeRecord,
        employee,
      };
    });
  }, [employees, selectedDate, manualOverrides]);

  const filteredRows = attendanceRows.filter(({ employee, record }) => {
    const q = search.trim().toLowerCase();
    const matchQuery =
      q === "" ||
      employee.fullName.toLowerCase().includes(q) ||
      employee.nip.toLowerCase().includes(q) ||
      employee.department.toLowerCase().includes(q) ||
      record.location.toLowerCase().includes(q);
    const matchDept =
      deptFilter === "ALL" || employee.department === deptFilter;
    const matchStatus =
      statusFilter === "ALL" || record.status === statusFilter;
    return matchQuery && matchDept && matchStatus;
  });

  // Statistik KPI
  const onTimeCount = attendanceRows.filter(
    (r) => r.record.status === "TEPAT_WAKTU",
  ).length;
  const lateRows = attendanceRows.filter(
    (r) => r.record.status === "TERLAMBAT",
  );
  const wfhCount = attendanceRows.filter(
    (r) => r.record.workMode === "WFH" && r.record.status !== "IZIN_CUTI",
  ).length;
  const leaveCount = attendanceRows.filter(
    (r) => r.record.status === "IZIN_CUTI",
  ).length;

  const avgLateMinutes =
    lateRows.length > 0
      ? Math.round(
          lateRows.reduce(
            (acc, cur) => acc + getLateMinutes(cur.record.checkIn),
            0,
          ) / lateRows.length,
        )
      : 0;

  const attendanceRate =
    attendanceRows.length > 0
      ? Math.round(
          ((attendanceRows.length - leaveCount) / attendanceRows.length) * 100,
        )
      : 0;

  const hasActiveFilters =
    search.trim() !== "" || deptFilter !== "ALL" || statusFilter !== "ALL";

  function handleResetFilters() {
    setSearch("");
    setDeptFilter("ALL");
    setStatusFilter("ALL");
  }

  function handleOpenCorrection(
    targetEmp?: Employee,
    existingRec?: AttendanceRecord,
  ) {
    const fallbackEmp = targetEmp ?? employees[0] ?? null;
    if (!fallbackEmp) {
      toast.warning("Belum ada data karyawan di dalam sistem.");
      return;
    }
    const matchedRec =
      existingRec ??
      attendanceRows.find((r) => r.employee.id === fallbackEmp.id)?.record;

    setSelectedTarget({ employee: fallbackEmp, record: matchedRec });
    setModalOpen(true);
  }

  function handleSaveCorrection(
    targetEmp: Employee,
    updatedRecord: AttendanceRecord,
  ) {
    setManualOverrides((prev) => ({
      ...prev,
      [`${targetEmp.id}_${selectedDate}`]: updatedRecord,
    }));

    logSecurityEvent(
      "ATTENDANCE_OVERRIDE",
      "WARNING",
      `Memperbarui presensi ${targetEmp.fullName} (${targetEmp.nip}) tanggal ${selectedDate} -> ${updatedRecord.status} (${updatedRecord.checkIn ?? "—"} - ${updatedRecord.checkOut ?? "Aktif"}).`,
    );

    toast.success(`Presensi ${targetEmp.fullName} berhasil diperbarui.`);
  }

  function handleQuickClockOut(emp: Employee, rec: AttendanceRecord) {
    const nowTime = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Makassar",
    });

    const updated: AttendanceRecord = {
      ...rec,
      checkOut: nowTime,
      notes: `${rec.notes} • Check-out admin (${nowTime} WITA)`,
    };

    setManualOverrides((prev) => ({
      ...prev,
      [`${emp.id}_${selectedDate}`]: updated,
    }));

    logSecurityEvent(
      "ATTENDANCE_CHECKOUT",
      "INFO",
      `Mencatat jam pulang ${emp.fullName} (${emp.nip}) pukul ${nowTime} WITA.`,
    );
    toast.success(`Jam pulang ${emp.fullName} tercatat (${nowTime} WITA).`);
  }

  function handleExportCsv() {
    if (filteredRows.length === 0) {
      toast.warning("Tidak ada data presensi pada filter aktif.");
      return;
    }

    const filename = exportAttendanceToCsv(filteredRows, {
      date: selectedDate,
      department: deptFilter,
      status: statusFilter,
    });

    logSecurityEvent(
      "ATTENDANCE_CSV_EXPORT",
      "INFO",
      `Mengekspor ${filteredRows.length} baris log presensi tanggal ${selectedDate} ke ${filename}.`,
    );
    toast.success(`Laporan presensi diunduh: ${filename}`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Halaman */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-gradient-to-r from-white/90 via-blue-50/70 to-orange-50/80 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs">
            <LivePulseBeacon colorClass="bg-emerald-500" />
            <span>
              Geo-Fence Makassar HQ •{" "}
              <span className="font-mono text-blue-700 tabular-nums">
                {mounted ? liveClock : "Shift 08:30 WITA"}
              </span>
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Presensi &amp;{" "}
            <span className="text-sulo-gradient">Log Kehadiran</span>
          </h1>
          <p className="text-sm text-slate-600">
            Pemantauan jam masuk, keterlambatan shift, mode WFO/WFH, dan audit
            koreksi kehadiran karyawan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCsv}
            className="border-emerald-200/90 bg-white/90 font-semibold text-slate-700 shadow-2xs hover:border-emerald-400 hover:bg-emerald-50/70 hover:text-emerald-800 active:scale-[0.98]"
          >
            <FileSpreadsheet
              data-icon="inline-start"
              className="text-emerald-600"
            />
            Ekspor CSV
          </Button>

          <MagneticAction>
            <Button
              type="button"
              onClick={() => handleOpenCorrection()}
              className="bg-sulo-cta border-0 font-semibold text-white active:scale-[0.98]"
            >
              <PlusCircle data-icon="inline-start" />
              Catat / Koreksi Presensi
            </Button>
          </MagneticAction>
        </div>
      </div>

      {/* 4 KPI Strip */}
      <WaterfallContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WaterfallItem>
          <div className="glass-sulo-card relative overflow-hidden rounded-2xl p-4">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500 opacity-85" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Hadir Tepat Waktu
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/80">
                <UserCheck className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              <KineticCounter value={onTimeCount} suffix=" Staf" />
            </p>
            <p className="mt-0.5 text-xs font-medium text-emerald-700">
              Tingkat kehadiran aktif {attendanceRate}% hari ini
            </p>
          </div>
        </WaterfallItem>

        <WaterfallItem>
          <div className="glass-sulo-orange relative overflow-hidden rounded-2xl p-4">
            <div className="bg-sulo-cta absolute inset-x-0 top-0 h-0.5" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Terlambat (&gt; 08:30)
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-orange-100/80 text-orange-600 ring-1 ring-orange-200/80">
                <AlertCircle className="size-4" />
              </div>
            </div>
            <p className="text-sulo-orange-gradient mt-2 text-2xl font-bold">
              <KineticCounter value={lateRows.length} suffix=" Staf" />
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              {lateRows.length > 0
                ? `Rata-rata keterlambatan ${avgLateMinutes} menit`
                : "Nihil keterlambatan pada tanggal ini"}
            </p>
          </div>
        </WaterfallItem>

        <WaterfallItem>
          <div className="glass-sulo-card relative overflow-hidden rounded-2xl p-4">
            <div className="bg-sulo-blue-pill absolute inset-x-0 top-0 h-0.5 opacity-85" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Remote / WFH Verified
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-200/80">
                <Laptop className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              <KineticCounter value={wfhCount} suffix=" Staf" />
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Terverifikasi via IP Whitelist &amp; VPN
            </p>
          </div>
        </WaterfallItem>

        <WaterfallItem>
          <div className="glass-sulo-card relative overflow-hidden rounded-2xl p-4">
            <div className="bg-sulo-dual-gradient absolute inset-x-0 top-0 h-0.5 opacity-85" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Izin / Cuti Terjadwal
              </span>
              <div className="bg-sulo-blue-pill flex size-8 items-center justify-center rounded-xl text-white">
                <CalendarDays className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              <KineticCounter value={leaveCount} suffix=" Staf" />
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Tersinkron dengan saldo cuti tahunan
            </p>
          </div>
        </WaterfallItem>
      </WaterfallContainer>

      {/* Filter Bar */}
      <div className="glass-sulo-card flex flex-col gap-3.5 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Pemilih Tanggal */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/90 px-3 py-1.5 shadow-2xs">
            <CalendarDays className="size-4 text-blue-600" />
            <input
              type="date"
              aria-label="Pilih tanggal presensi"
              value={selectedDate}
              onChange={(e) =>
                setSelectedDate(e.target.value || DEFAULT_ATTENDANCE_DATE)
              }
              className="bg-transparent font-mono text-xs font-semibold text-slate-800 outline-none tabular-nums"
            />
          </div>

          {/* Pencarian */}
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute top-2.5 left-3.5 size-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama karyawan, NIP, atau lokasi check-in..."
              className="border-slate-200/90 bg-white/90 pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-500"
            />
          </div>

          {/* Filter Status Kehadiran */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1">
            {ATTENDANCE_FILTERS.map((item) => {
              const active = statusFilter === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setStatusFilter(item.value)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    active
                      ? "bg-sulo-cta text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-orange-600 hover:bg-orange-50 hover:text-orange-700"
            >
              <RotateCcw data-icon="inline-start" />
              Reset
            </Button>
          )}
        </div>

        {/* Filter Departemen */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-200/70 pt-3">
          <span className="mr-1.5 text-xs font-semibold text-slate-500">
            Departemen:
          </span>
          {DEPARTMENTS.map((dept) => {
            const isActive = deptFilter === dept;
            return (
              <button
                key={dept}
                type="button"
                onClick={() => setDeptFilter(dept)}
                className="relative rounded-full px-3 py-1 text-xs font-semibold transition-colors"
              >
                {isActive && (
                  <motion.span
                    layoutId="attendance-dept-pill"
                    transition={SULO_SPRING}
                    className="bg-sulo-blue-pill absolute inset-0 rounded-full"
                  />
                )}
                <span
                  className={`relative z-10 ${
                    isActive
                      ? "text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {dept}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabel Log Presensi */}
      <div className="glass-sulo-card overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100/75">
              <TableRow className="border-slate-200/90 hover:bg-transparent">
                <TableHead className="font-semibold text-slate-700">
                  Karyawan &amp; NIP
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Departemen
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Masuk / Pulang
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Durasi
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Mode &amp; Lokasi
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Status
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow className="border-slate-200/80 hover:bg-transparent">
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">
                        Tidak ada catatan presensi yang cocok
                      </p>
                      <p className="text-xs text-slate-500">
                        Ubah kata kunci pencarian atau atur ulang filter status
                        dan departemen.
                      </p>
                      {hasActiveFilters && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleResetFilters}
                          className="mt-2 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                        >
                          <RotateCcw data-icon="inline-start" />
                          Tampilkan Semua
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map(({ employee, record }) => {
                  const deptStyle = DEPT_BADGE_STYLES[employee.department];
                  const lateMins =
                    record.status === "TERLAMBAT"
                      ? getLateMinutes(record.checkIn)
                      : 0;
                  const canQuickCheckout =
                    record.checkIn !== null &&
                    record.checkOut === null &&
                    record.status !== "IZIN_CUTI";

                  return (
                    <TableRow
                      key={record.id}
                      className="group border-slate-200/75 bg-white/40 transition-colors hover:bg-blue-50/45"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold shadow-2xs ${deptStyle.avatar}`}
                          >
                            {getInitials(employee.fullName)}
                          </div>
                          <div className="flex flex-col">
                            <Link
                              href={`/admin/employees/${employee.id}`}
                              className="font-semibold text-slate-900 transition-colors group-hover:text-blue-700 hover:underline"
                            >
                              {employee.fullName}
                            </Link>
                            <span className="font-mono text-xs text-slate-500 tabular-nums">
                              {employee.nip} • {employee.position}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${deptStyle.pill}`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${deptStyle.dot}`}
                          />
                          {employee.department}
                        </span>
                      </TableCell>

                      <TableCell>
                        {record.status === "IZIN_CUTI" ? (
                          <span className="text-xs font-medium text-slate-400">
                            Tidak wajib tap
                          </span>
                        ) : (
                          <div className="flex items-center gap-2 font-mono text-xs tabular-nums">
                            <span className="rounded-md border border-slate-200/90 bg-white px-2 py-0.5 font-bold text-slate-800">
                              {record.checkIn ?? "—"}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span
                              className={`rounded-md border px-2 py-0.5 font-semibold ${
                                record.checkOut
                                  ? "border-slate-200/90 bg-white text-slate-800"
                                  : "border-blue-200 bg-blue-50/80 text-blue-700"
                              }`}
                            >
                              {record.checkOut ?? "Aktif"}
                            </span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                          {formatWorkDuration(record.checkIn, record.checkOut)}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                            {record.workMode === "WFH" ? (
                              <Laptop className="size-3.5 text-sky-600" />
                            ) : record.workMode === "DINAS_LUAR" ? (
                              <MapPin className="size-3.5 text-orange-600" />
                            ) : (
                              <Building2 className="size-3.5 text-blue-600" />
                            )}
                            {record.workMode === "DINAS_LUAR"
                              ? "Dinas Luar"
                              : record.workMode}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {record.location}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {record.status === "TEPAT_WAKTU" && (
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"
                          >
                            <CheckCircle2 className="mr-1 size-3" />
                            Tepat Waktu
                          </Badge>
                        )}
                        {record.status === "TERLAMBAT" && (
                          <Badge
                            variant="outline"
                            className="border-orange-200 bg-orange-50 font-semibold text-orange-700"
                          >
                            <Clock className="mr-1 size-3" />
                            Terlambat {lateMins > 0 ? `+${lateMins}m` : ""}
                          </Badge>
                        )}
                        {record.status === "WFH" && (
                          <Badge
                            variant="outline"
                            className="border-sky-200 bg-sky-50 font-semibold text-sky-700"
                          >
                            Remote WFH
                          </Badge>
                        )}
                        {record.status === "IZIN_CUTI" && (
                          <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-50 font-semibold text-amber-800"
                          >
                            Izin / Cuti
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {canQuickCheckout && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleQuickClockOut(employee, record)
                              }
                              className="h-7 border-emerald-200 bg-emerald-50/70 px-2.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              <LogOut className="mr-1 size-3" />
                              Pulang
                            </Button>
                          )}

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleOpenCorrection(employee, record)
                            }
                            className="h-7 border-slate-200/90 bg-white/90 px-2.5 text-[11px] font-semibold text-slate-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                          >
                            <Edit3 className="mr-1 size-3" />
                            Koreksi
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Terpisah untuk Catat / Koreksi Presensi */}
      <AttendanceCorrectionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        employees={employees}
        selectedDate={selectedDate}
        targetEmployee={selectedTarget.employee}
        existingRecord={selectedTarget.record}
        onSave={handleSaveCorrection}
      />
    </div>
  );
}