// src/app/admin/employees/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  FileText,
  Search,
  ShieldCheck,
  Users,
  Briefcase,
  CalendarClock,
  ArrowUpRight,
  RotateCcw,
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
import { PiiMask } from "@/components/security/pii-mask";
import { AddEmployeeModal } from "@/components/admin/add-employee-modal";
import {
  exportEmployeesToCsv,
  exportEmployeesToPdf,
} from "@/lib/export-utils";
import { formatRupiah } from "@/lib/business-rules";
import { DepartmentName } from "@/lib/types";
import {
  KineticCounter,
  LivePulseBeacon,
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

const STATUS_FILTERS = ["ALL", "PKWTT", "PKWT", "MAGANG"] as const;

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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function EmployeesDirectoryPage() {
  const { employees, logSecurityEvent } = useSuloStore();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered = employees.filter((e) => {
    const q = search.trim().toLowerCase();
    const matchQuery =
      q === "" ||
      e.fullName.toLowerCase().includes(q) ||
      e.nip.toLowerCase().includes(q) ||
      e.position.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q);
    const matchDept = deptFilter === "ALL" || e.department === deptFilter;
    const matchStatus = statusFilter === "ALL" || e.status === statusFilter;
    return matchQuery && matchDept && matchStatus;
  });

  const pkwttCount = employees.filter((e) => e.status === "PKWTT").length;
  const contractCount = employees.filter(
    (e) => e.status === "PKWT" || e.status === "MAGANG",
  ).length;
  const avgLeaveQuota =
    employees.length > 0
      ? employees.reduce((acc, cur) => acc + cur.remainingLeaveQuota, 0) /
        employees.length
      : 0;

  const hasActiveFilters =
    search.trim() !== "" || deptFilter !== "ALL" || statusFilter !== "ALL";

  function handleResetFilters() {
    setSearch("");
    setDeptFilter("ALL");
    setStatusFilter("ALL");
  }

  function handleExportCsv() {
    if (filtered.length === 0) {
      toast.warning("Tidak ada data karyawan pada filter aktif untuk diekspor.");
      return;
    }
    const filename = exportEmployeesToCsv(filtered, {
      search,
      department: deptFilter,
      status: statusFilter,
    });
    logSecurityEvent(
      "CSV_SAFE_EXPORT",
      "INFO",
      `Mengekspor ${filtered.length} baris direktori karyawan ke ${filename} (UTF-8 BOM + PII Masked).`,
    );
    toast.success(`CSV berhasil diunduh: ${filename}`);
  }

  function handleExportPdf() {
    if (filtered.length === 0) {
      toast.warning("Tidak ada data karyawan pada filter aktif untuk diekspor.");
      return;
    }
    const filename = exportEmployeesToPdf(filtered, {
      search,
      department: deptFilter,
      status: statusFilter,
    });
    logSecurityEvent(
      "PDF_SAFE_EXPORT",
      "INFO",
      `Mengekspor laporan direktori ${filtered.length} karyawan ke ${filename} (A4 Landscape + PII Masked).`,
    );
    toast.success(`Laporan PDF berhasil diunduh: ${filename}`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Utama */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-gradient-to-r from-white/90 via-blue-50/70 to-orange-50/80 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs">
            <LivePulseBeacon colorClass="bg-blue-600" />
            <span>
              UU PDP Vault •{" "}
              <span className="text-orange-600">Auto-Relock 30s</span>
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Direktori &amp;{" "}
            <span className="text-sulo-gradient">Vault Karyawan</span>
          </h1>
          <p className="text-sm text-slate-600">
            Data sensitif disamarkan secara default dengan pencatatan audit
            setiap kali identitas dibuka.
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

          <Button
            type="button"
            variant="outline"
            onClick={handleExportPdf}
            className="border-blue-200/90 bg-white/90 font-semibold text-slate-700 shadow-2xs hover:border-blue-400 hover:bg-blue-50/70 hover:text-blue-800 active:scale-[0.98]"
          >
            <FileText data-icon="inline-start" className="text-blue-600" />
            Ekspor PDF
          </Button>

          <AddEmployeeModal />
        </div>
      </div>

      {/* Ringkasan Statistik Vault (4 KPI Strip) */}
      <WaterfallContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WaterfallItem>
          <div className="glass-sulo-card relative overflow-hidden rounded-2xl p-4">
            <div className="bg-sulo-blue-pill absolute inset-x-0 top-0 h-0.5 opacity-80" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Total Database Vault
              </span>
              <div className="bg-sulo-blue-pill flex size-8 items-center justify-center rounded-xl text-white">
                <Users className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              <KineticCounter value={employees.length} suffix=" Karyawan" />
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Menampilkan{" "}
              <strong className="font-mono text-blue-700">
                {filtered.length}
              </strong>{" "}
              hasil terfilter
            </p>
          </div>
        </WaterfallItem>

        <WaterfallItem>
          <div className="glass-sulo-card relative overflow-hidden rounded-2xl p-4">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500 opacity-80" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Karyawan Tetap (PKWTT)
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/80">
                <ShieldCheck className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              <KineticCounter value={pkwttCount} suffix=" Staf" />
            </p>
            <p className="mt-0.5 text-xs font-medium text-emerald-700">
              {employees.length > 0
                ? Math.round((pkwttCount / employees.length) * 100)
                : 0}
              % dari total tenaga kerja
            </p>
          </div>
        </WaterfallItem>

        <WaterfallItem>
          <div className="glass-sulo-orange relative overflow-hidden rounded-2xl p-4">
            <div className="bg-sulo-cta absolute inset-x-0 top-0 h-0.5" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Kontrak &amp; Magang
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-orange-100/80 text-orange-600 ring-1 ring-orange-200/80">
                <Briefcase className="size-4" />
              </div>
            </div>
            <p className="text-sulo-orange-gradient mt-2 text-2xl font-bold">
              <KineticCounter value={contractCount} suffix=" Staf" />
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              PKWT &amp; program internship aktif
            </p>
          </div>
        </WaterfallItem>

        <WaterfallItem>
          <div className="glass-sulo-card relative overflow-hidden rounded-2xl p-4">
            <div className="bg-sulo-dual-gradient absolute inset-x-0 top-0 h-0.5 opacity-80" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Rata-Rata Kuota Cuti
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-200/80">
                <CalendarClock className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              <KineticCounter
                value={avgLeaveQuota}
                decimals={1}
                suffix=" Hari"
              />
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Saldo cuti tahunan berjalan
            </p>
          </div>
        </WaterfallItem>
      </WaterfallContainer>

      {/* Filter Bar Dual-Tone */}
      <div className="glass-sulo-card flex flex-col gap-3.5 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute top-2.5 left-3.5 size-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari NIP, nama lengkap, divisi, atau jabatan..."
              className="border-slate-200/90 bg-white/90 pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-500"
            />
          </div>

          {/* Filter Status Kerja */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1">
            {STATUS_FILTERS.map((status) => {
              const active = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    active
                      ? "bg-sulo-cta text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {status}
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
              Reset Filter
            </Button>
          )}
        </div>

        {/* Filter Departemen dengan Sliding Pill */}
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
                    layoutId="employees-dept-pill"
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

      {/* Tabel Direktori & Vault Karyawan */}
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
                  Status
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Rekening (PII)
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Gaji Pokok (PII)
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700">
                  Sisa Cuti
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700">
                  Vault
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="border-slate-200/80 hover:bg-transparent">
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">
                        Tidak ada karyawan yang sesuai filter
                      </p>
                      <p className="text-xs text-slate-500">
                        Coba ubah kata kunci pencarian NIP/nama atau kembalikan
                        filter departemen dan status kerja.
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
                          Tampilkan Semua Karyawan
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((emp) => {
                  const deptStyle = DEPT_BADGE_STYLES[emp.department];
                  const isLowLeave = emp.remainingLeaveQuota <= 3;

                  return (
                    <TableRow
                      key={emp.id}
                      className="group border-slate-200/75 bg-white/40 transition-colors hover:bg-blue-50/45"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold shadow-2xs ${deptStyle.avatar}`}
                          >
                            {getInitials(emp.fullName)}
                          </div>
                          <div className="flex flex-col">
                            <Link
                              href={`/admin/employees/${emp.id}`}
                              className="font-semibold text-slate-900 transition-colors group-hover:text-blue-700 hover:underline"
                            >
                              {emp.fullName}
                            </Link>
                            <span className="font-mono text-xs text-slate-500 tabular-nums">
                              {emp.nip} • {emp.position}
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
                          {emp.department}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            emp.status === "PKWTT"
                              ? "border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"
                              : emp.status === "PKWT"
                                ? "border-orange-200 bg-orange-50 font-semibold text-orange-700"
                                : "border-sky-200 bg-sky-50 font-semibold text-sky-700"
                          }
                        >
                          {emp.status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <PiiMask
                          value={emp.bankAccount}
                          formattedDisplay={`${emp.bankName} ${emp.bankAccount}`}
                          label={`Rekening ${emp.fullName}`}
                        />
                      </TableCell>

                      <TableCell>
                        <PiiMask
                          value={String(emp.baseSalary)}
                          formattedDisplay={formatRupiah(emp.baseSalary)}
                          label={`Gaji ${emp.fullName}`}
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        <span
                          className={`inline-flex items-center rounded-lg px-2.5 py-1 font-mono text-xs font-bold tabular-nums ${
                            isLowLeave
                              ? "border border-orange-200 bg-orange-50 text-orange-700"
                              : "border border-slate-200/80 bg-white/80 text-slate-800"
                          }`}
                        >
                          {emp.remainingLeaveQuota} Hari
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <Link
                          href={`/admin/employees/${emp.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white/85 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                        >
                          Detail
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}