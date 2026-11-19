// src/app/admin/payroll/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calculator,
  Lock,
  FileText,
  Wallet,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Clock,
  Search,
  RotateCcw,
  FileSpreadsheet,
  Eye,
  EyeOff,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { DepartmentName, Employee, PayrollItem } from "@/lib/types";
import { exportPayrollToCsv } from "@/lib/export-utils";
import { PayslipPreviewModal } from "@/components/admin/payslip-preview-modal";
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

const STATUS_FILTERS: { value: "ALL" | "DRAFT" | "PAID"; label: string }[] = [
  { value: "ALL", label: "Semua Status" },
  { value: "DRAFT", label: "Draft Kalkulasi" },
  { value: "PAID", label: "Sudah Dibayar (PAID)" },
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

export default function AdminPayrollPage() {
  const {
    employees,
    payrolls,
    privacyShield,
    runPayrollCalculation,
    lockAndPayPeriod,
    logSecurityEvent,
  } = useSuloStore();

  const [period, setPeriod] = useState("2026-11");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DRAFT" | "PAID">(
    "ALL",
  );
  const [localMaskOverride, setLocalMaskOverride] = useState<boolean | null>(
    null,
  );
  const [selectedSlip, setSelectedSlip] = useState<PayrollItem | null>(null);

  // Reset override lokal bila toggle global privacyShield berubah
  useEffect(() => {
    setLocalMaskOverride(null);
  }, [privacyShield]);

  const isMasked = localMaskOverride ?? privacyShield;

  // Gabungkan PayrollItem dengan data Employee yang valid
  const periodRows = useMemo(() => {
    return payrolls
      .filter((p) => p.period === period)
      .map((item) => {
        const emp = employees.find((e) => e.id === item.employeeId);
        if (!emp) return null;
        return { item, employee: emp };
      })
      .filter(
        (row): row is { item: PayrollItem; employee: Employee } => row !== null,
      );
  }, [payrolls, employees, period]);

  const filteredRows = periodRows.filter(({ item, employee }) => {
    const q = search.trim().toLowerCase();
    const matchQuery =
      q === "" ||
      employee.fullName.toLowerCase().includes(q) ||
      employee.nip.toLowerCase().includes(q) ||
      employee.department.toLowerCase().includes(q) ||
      employee.position.toLowerCase().includes(q);
    const matchDept =
      deptFilter === "ALL" || employee.department === deptFilter;
    const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchQuery && matchDept && matchStatus;
  });

  const isPeriodPaid =
    periodRows.length > 0 && periodRows.every((r) => r.item.status === "PAID");

  // Agregasi KPI Keuangan Periode Aktif
  const totalTakeHomePay = periodRows.reduce(
    (acc, r) => acc + r.item.takeHomePay,
    0,
  );
  const totalGrossEarnings = periodRows.reduce(
    (acc, r) => acc + r.item.totalEarnings,
    0,
  );
  const totalAllDeductions = periodRows.reduce(
    (acc, r) => acc + r.item.totalDeductions,
    0,
  );
  const paidCount = periodRows.filter((r) => r.item.status === "PAID").length;

  const hasActiveFilters =
    search.trim() !== "" || deptFilter !== "ALL" || statusFilter !== "ALL";

  function handleResetFilters() {
    setSearch("");
    setDeptFilter("ALL");
    setStatusFilter("ALL");
  }

  function handleToggleMask() {
    const nextMasked = !isMasked;
    setLocalMaskOverride(nextMasked);
    logSecurityEvent(
      nextMasked ? "PAYROLL_PII_MASKED" : "PAYROLL_PII_UNMASKED",
      nextMasked ? "INFO" : "WARNING",
      nextMasked
        ? `Mengaktifkan masking nominal gaji pada halaman Payroll (${period}).`
        : `Membuka masking nominal gaji karyawan periode ${period} (UU PDP Audit).`,
    );
  }

  function handleRunCalculation() {
    const res = runPayrollCalculation(period);
    if (res.ok) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  }

  function handleLockAndPay() {
    const res = lockAndPayPeriod(period);
    if (res.ok) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  }

  function handleOpenPayslip(item: PayrollItem, emp: Employee) {
    setSelectedSlip(item);
    logSecurityEvent(
      "PAYSLIP_OPENED",
      "INFO",
      `Membuka pratinjau slip gaji ${emp.fullName} (${emp.nip}) periode ${item.period}.`,
    );
  }

  function handlePrintSlipAudit(item: PayrollItem, emp: Employee) {
    logSecurityEvent(
      "PAYSLIP_PRINTED",
      "WARNING",
      `Mencetak / menyimpan PDF slip gaji ${emp.fullName} (${emp.nip}) periode ${item.period} (Hash: ${item.verificationHash}).`,
    );
  }

  function handleExportCsv() {
    if (filteredRows.length === 0) {
      toast.warning("Tidak ada data payroll pada periode/filter aktif.");
      return;
    }
    if (isMasked) {
      toast.warning(
        "Nonaktifkan Privacy Shield (klik 'Tampilkan Nominal') sebelum mengekspor CSV payroll.",
      );
      return;
    }

    const filename = exportPayrollToCsv(filteredRows, period);
    logSecurityEvent(
      "PAYROLL_CSV_EXPORT",
      "WARNING",
      `Mengekspor ${filteredRows.length} baris rekap gaji periode ${period} ke ${filename}.`,
    );
    toast.success(`Rekap payroll diunduh: ${filename}`);
  }

  const selectedEmployee = selectedSlip
    ? employees.find((e) => e.id === selectedSlip.employeeId) ?? null
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Halaman */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-gradient-to-r from-white/90 via-blue-50/70 to-orange-50/80 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs">
            <LivePulseBeacon
              colorClass={isPeriodPaid ? "bg-emerald-500" : "bg-orange-500"}
            />
            <span>
              Automated Payroll Engine •{" "}
              <span className="font-mono text-blue-700">
                BPJS (1% + 2%) &amp; PPh 21 TER
              </span>
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Manajemen{" "}
            <span className="text-sulo-gradient">Payroll &amp; Slip Gaji</span>
          </h1>
          <p className="text-sm text-slate-600">
            Sinkronisasi otomatis keterlambatan, uang lembur, potongan BPJS,
            dan penerbitan slip gaji A4 terverifikasi.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pemilih Periode */}
          <Select
            value={period}
            onValueChange={(val) => {
              if (val) setPeriod(val);
            }}
          >
            <SelectTrigger className="w-[215px] border-slate-200/90 bg-white/95 font-mono text-xs font-semibold text-slate-800 shadow-2xs">
              <SelectValue placeholder="Pilih periode payroll" />
            </SelectTrigger>
            <SelectContent className="border-slate-200 bg-white text-slate-900">
              <SelectGroup>
                <SelectItem value="2026-11">
                  Periode 2026-11 (Nov 2026)
                </SelectItem>
                <SelectItem value="2026-10">
                  Periode 2026-10 (Okt 2026)
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Toggle Privacy Shield */}
          <Button
            type="button"
            variant="outline"
            onClick={handleToggleMask}
            className={`font-semibold shadow-2xs active:scale-[0.98] ${
              isMasked
                ? "border-blue-200/90 bg-blue-50/70 text-blue-700 hover:bg-blue-100/80"
                : "border-amber-300 bg-amber-50/80 text-amber-800 hover:bg-amber-100/80"
            }`}
          >
            {isMasked ? (
              <>
                <Eye data-icon="inline-start" />
                Tampilkan Nominal
              </>
            ) : (
              <>
                <EyeOff data-icon="inline-start" />
                Sembunyikan PII
              </>
            )}
          </Button>

          {/* Ekspor CSV */}
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

          {/* Hitung Otomatis */}
          <Button
            type="button"
            variant="outline"
            disabled={isPeriodPaid}
            onClick={handleRunCalculation}
            className="border-blue-200/90 bg-white/90 font-semibold text-blue-700 shadow-2xs hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50"
          >
            <Calculator data-icon="inline-start" />
            Hitung Otomatis
          </Button>

          {/* Kunci & Tandai Dibayar */}
          <MagneticAction>
            <Button
              type="button"
              disabled={isPeriodPaid || periodRows.length === 0}
              onClick={handleLockAndPay}
              className="bg-sulo-cta border-0 font-semibold text-white active:scale-[0.98] disabled:opacity-60"
            >
              <Lock data-icon="inline-start" />
              {isPeriodPaid
                ? "Periode Terkunci (PAID)"
                : "Tandai Semua Dibayar"}
            </Button>
          </MagneticAction>
        </div>
      </div>

      {/* Banner Peringatan UU PDP saat Privacy Shield dibuka */}
      {!isMasked && (
        <div className="no-print flex items-center justify-between gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/85 px-4 py-2.5 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 shrink-0 text-amber-600" />
            <span>
              <strong>Mode Inspeksi Finansial Aktif:</strong> Nominal gaji dan
              potongan pajak sedang ditampilkan terbuka. Aktivitas ini tercatat
              pada Security Audit Log.
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleMask}
            className="shrink-0 font-semibold text-amber-800 underline hover:text-amber-950"
          >
            Aktifkan Masking
          </button>
        </div>
      )}

      {/* 4 KPI Strip */}
      <WaterfallContainer className="no-print grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WaterfallItem>
          <div className="glass-sulo-orange relative overflow-hidden rounded-2xl p-4">
            <div className="bg-sulo-cta absolute inset-x-0 top-0 h-0.5" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Total Take Home Pay
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-orange-100/80 text-orange-600 ring-1 ring-orange-200/80">
                <Wallet className="size-4" />
              </div>
            </div>
            <p
              className={`text-sulo-orange-gradient mt-2 font-mono text-xl font-bold tabular-nums transition-all ${
                isMasked ? "blur-xs select-none" : ""
              }`}
            >
              {formatRupiah(totalTakeHomePay)}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              Netto dibayarkan periode {period}
            </p>
          </div>
        </WaterfallItem>

        <WaterfallItem>
          <div className="glass-sulo-card relative overflow-hidden rounded-2xl p-4">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500 opacity-85" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Total Penerimaan Bruto
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/80">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <p
              className={`mt-2 font-mono text-xl font-bold text-slate-900 tabular-nums transition-all ${
                isMasked ? "blur-xs select-none" : ""
              }`}
            >
              {formatRupiah(totalGrossEarnings)}
            </p>
            <p className="mt-0.5 text-xs font-medium text-emerald-700">
              Gaji pokok + tunjangan + lembur
            </p>
          </div>
        </WaterfallItem>

        <WaterfallItem>
          <div className="glass-sulo-card relative overflow-hidden rounded-2xl p-4">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-rose-500 opacity-80" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Total Potongan &amp; Pajak
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200/80">
                <Receipt className="size-4" />
              </div>
            </div>
            <p
              className={`mt-2 font-mono text-xl font-bold text-rose-600 tabular-nums transition-all ${
                isMasked ? "blur-xs select-none" : ""
              }`}
            >
              -{formatRupiah(totalAllDeductions)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              BPJS Kes/TK, PPh 21 TER &amp; telat
            </p>
          </div>
        </WaterfallItem>

        <WaterfallItem>
          <div className="glass-sulo-card relative overflow-hidden rounded-2xl p-4">
            <div className="bg-sulo-blue-pill absolute inset-x-0 top-0 h-0.5 opacity-85" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Slip Gaji Terbit
              </span>
              <div className="bg-sulo-blue-pill flex size-8 items-center justify-center rounded-xl text-white">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              <KineticCounter value={periodRows.length} suffix=" Slip" />
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {paidCount} dari {periodRows.length} berstatus PAID
            </p>
          </div>
        </WaterfallItem>
      </WaterfallContainer>

      {/* Filter Bar */}
      <div className="no-print glass-sulo-card flex flex-col gap-3.5 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute top-2.5 left-3.5 size-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama karyawan, NIP, atau jabatan..."
              className="border-slate-200/90 bg-white/90 pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-500"
            />
          </div>

          {/* Filter Status Pembayaran */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1">
            {STATUS_FILTERS.map((tab) => {
              const active = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
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
                    layoutId="payroll-dept-pill"
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

      {/* Tabel Rekap Payroll */}
      <div className="no-print glass-sulo-card overflow-hidden rounded-2xl">
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
                <TableHead className="text-right font-semibold text-slate-700">
                  Penerimaan
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700">
                  Potongan
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700">
                  Take Home Pay
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Status
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700">
                  Slip Gaji
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow className="border-slate-200/80 hover:bg-transparent">
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">
                        {periodRows.length === 0
                          ? `Belum ada data kalkulasi payroll untuk periode ${period}`
                          : "Tidak ada data payroll yang cocok dengan filter"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {periodRows.length === 0
                          ? "Klik tombol 'Hitung Otomatis' di kanan atas untuk menghitung gaji seluruh karyawan aktif."
                          : "Coba ubah kata kunci pencarian atau reset filter departemen."}
                      </p>
                      {periodRows.length === 0 ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleRunCalculation}
                          className="bg-sulo-cta mt-2 border-0 font-semibold text-white"
                        >
                          <Calculator data-icon="inline-start" />
                          Hitung Payroll {period}
                        </Button>
                      ) : (
                        hasActiveFilters && (
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
                        )
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map(({ item, employee }) => {
                  const deptStyle = DEPT_BADGE_STYLES[employee.department];

                  return (
                    <TableRow
                      key={item.id}
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

                      <TableCell className="text-right font-mono text-xs font-semibold text-slate-800 tabular-nums">
                        <span
                          className={
                            isMasked
                              ? "blur-xs select-none"
                              : "transition-all"
                          }
                        >
                          {formatRupiah(item.totalEarnings)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs font-semibold text-rose-600 tabular-nums">
                        <span
                          className={
                            isMasked
                              ? "blur-xs select-none"
                              : "transition-all"
                          }
                        >
                          -{formatRupiah(item.totalDeductions)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right font-mono text-sm font-bold text-orange-600 tabular-nums">
                        <span
                          className={
                            isMasked
                              ? "blur-xs select-none"
                              : "transition-all"
                          }
                        >
                          {formatRupiah(item.takeHomePay)}
                        </span>
                      </TableCell>

                      <TableCell>
                        {item.status === "PAID" ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"
                          >
                            <CheckCircle2 className="mr-1 size-3" />
                            PAID
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-50 font-semibold text-amber-800"
                          >
                            <Clock className="mr-1 size-3" />
                            DRAFT
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenPayslip(item, employee)}
                          className="h-7 border-slate-200/90 bg-white/90 px-2.5 text-[11px] font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <FileText className="mr-1 size-3 text-blue-600" />
                          Slip A4
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Terpisah untuk Pratinjau Slip Gaji A4 */}
      <PayslipPreviewModal
        slip={selectedSlip}
        employee={selectedEmployee}
        onClose={() => setSelectedSlip(null)}
        onPrintSlip={handlePrintSlipAudit}
      />
    </div>
  );
}