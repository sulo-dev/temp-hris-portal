// src/app/admin/employees/[id]/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShieldCheck,
  UserRound,
  Briefcase,
  Wallet,
  CalendarClock,
  Mail,
  Phone,
  Building2,
  CreditCard,
  Copy,
  Check,
  Lock,
  FileText,
  BadgeCheck,
  Clock,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSuloStore } from "@/store/use-sulo-store";
import { PiiMask } from "@/components/security/pii-mask";
import { exportEmployeesToPdf } from "@/lib/export-utils";
import { formatRupiah } from "@/lib/business-rules";
import { maskSensitiveValue } from "@/lib/security-utils";
import { DepartmentName, EmploymentStatus } from "@/lib/types";
import {
  KineticCounter,
  LivePulseBeacon,
  SULO_SPRING,
  WaterfallContainer,
  WaterfallItem,
} from "@/components/motion/motion-primitives";

const DEPT_THEME: Record<
  DepartmentName,
  { avatar: string; pill: string; dot: string; accentBar: string }
> = {
  Engineering: {
    avatar: "from-blue-700 to-blue-500 text-white",
    pill: "border-blue-200/80 bg-blue-50/85 text-blue-700",
    dot: "bg-blue-600",
    accentBar: "bg-sulo-blue-pill",
  },
  "Product & Design": {
    avatar: "from-sky-600 to-cyan-500 text-white",
    pill: "border-sky-200/80 bg-sky-50/85 text-sky-700",
    dot: "bg-sky-500",
    accentBar: "bg-sky-500",
  },
  Marketing: {
    avatar: "from-orange-600 to-amber-500 text-white",
    pill: "border-orange-200/80 bg-orange-50/85 text-orange-700",
    dot: "bg-orange-500",
    accentBar: "bg-sulo-cta",
  },
  Finance: {
    avatar: "from-amber-600 to-yellow-500 text-white",
    pill: "border-amber-200/80 bg-amber-50/85 text-amber-800",
    dot: "bg-amber-500",
    accentBar: "bg-amber-500",
  },
  HR: {
    avatar: "from-emerald-600 to-teal-500 text-white",
    pill: "border-emerald-200/80 bg-emerald-50/85 text-emerald-700",
    dot: "bg-emerald-500",
    accentBar: "bg-emerald-500",
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

function formatStatusFull(status: EmploymentStatus): string {
  switch (status) {
    case "PKWTT":
      return "PKWTT — Karyawan Tetap";
    case "PKWT":
      return "PKWT — Perjanjian Kerja Waktu Tertentu";
    case "MAGANG":
      return "Program Magang / Internship";
    default:
      return status;
  }
}

function formatTanggalIndo(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPhoneReadable(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  return phone;
}

function hitungMasaKerja(isoDate: string): { label: string; months: number } {
  const start = new Date(`${isoDate}T00:00:00`);
  const now = new Date();
  if (Number.isNaN(start.getTime()) || start > now) {
    return { label: "Baru Bergabung", months: 0 };
  }
  const totalMonths =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0 && months === 0) {
    return { label: "Kurang dari 1 Bln", months: 0 };
  }
  if (years === 0) {
    return { label: `${months} Bulan`, months: totalMonths };
  }
  if (months === 0) {
    return { label: `${years} Tahun`, months: totalMonths };
  }
  return { label: `${years} Thn ${months} Bln`, months: totalMonths };
}

type DetailTab = "overview" | "compensation";

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const employeeId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { employees, logSecurityEvent } = useSuloStore();
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [copiedField, setCopiedField] = useState<"nip" | "email" | null>(null);

  const employee = employees.find((item) => item.id === employeeId);

  if (!employee) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center py-16 text-center">
        <div className="glass-sulo-card relative w-full overflow-hidden rounded-3xl p-8">
          <div className="bg-sulo-dual-gradient absolute inset-x-0 top-0 h-1" />
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 ring-1 ring-orange-200/80">
            <AlertTriangle className="size-7" />
          </div>
          <h1 className="font-display mt-4 text-xl font-bold text-slate-900">
            Data Karyawan Tidak Ditemukan
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            ID rekaman{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
              {employeeId ?? "unknown"}
            </code>{" "}
            tidak tersedia di dalam Vault PT Sulo atau telah dipindahkan.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/admin/employees"
              className="bg-sulo-cta inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-transform active:scale-[0.98]"
            >
              <ArrowLeft className="size-4" />
              Kembali ke Direktori Karyawan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const theme = DEPT_THEME[employee.department];
  const tenure = hitungMasaKerja(employee.joinDate);
  const totalBruto = employee.baseSalary + employee.fixedAllowance;
  const isLowLeave = employee.remainingLeaveQuota <= 3;

  function handleCopy(field: "nip" | "email", value: string, label: string) {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast.success(`${label} disalin ke clipboard.`);
    setTimeout(() => {
      setCopiedField((prev) => (prev === field ? null : prev));
    }, 1800);
  }

  function handleExportSinglePdf() {
    if (!employee) return;
    const filename = exportEmployeesToPdf([employee], {
      search: employee.nip,
      department: employee.department,
      status: employee.status,
    });
    logSecurityEvent(
      "PDF_EMPLOYEE_DOSSIER",
      "INFO",
      `Mengekspor dossier individu ${employee.fullName} (${employee.nip}) ke ${filename} (PII Masked).`,
    );
    toast.success(`Dossier PDF diunduh: ${filename}`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Bar Navigasi Atas */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke Direktori
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs">
            <LivePulseBeacon colorClass="bg-emerald-500" />
            <span>
              Vault Aktif •{" "}
              <span className="text-orange-600">Auto-Relock 30s</span>
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleExportSinglePdf}
            className="border-blue-200/90 bg-white/90 font-semibold text-slate-700 shadow-2xs hover:border-blue-400 hover:bg-blue-50/70 hover:text-blue-800 active:scale-[0.98]"
          >
            <FileText data-icon="inline-start" className="text-blue-600" />
            Ekspor Dossier PDF
          </Button>
        </div>
      </div>

      {/* Hero Profile Card */}
      <div className="glass-sulo-card relative overflow-hidden rounded-3xl p-6 sm:p-7">
        <div className="bg-sulo-dual-gradient absolute inset-x-0 top-0 h-1.5" />

        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Avatar Besar */}
            <div
              className={`flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xl font-bold shadow-md sm:size-20 sm:text-2xl ${theme.avatar}`}
            >
              {getInitials(employee.fullName)}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${theme.pill}`}
                >
                  <span className={`size-1.5 rounded-full ${theme.dot}`} />
                  {employee.department}
                </span>

                <Badge
                  variant="outline"
                  className={
                    employee.status === "PKWTT"
                      ? "border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"
                      : employee.status === "PKWT"
                        ? "border-orange-200 bg-orange-50 font-semibold text-orange-700"
                        : "border-sky-200 bg-sky-50 font-semibold text-sky-700"
                  }
                >
                  {employee.status}
                </Badge>

                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/80 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700 tabular-nums">
                  <Lock className="size-3 text-blue-600" />
                  UU PDP Protected
                </span>
              </div>

              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {employee.fullName}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 sm:text-sm">
                <span className="font-medium text-slate-800">
                  {employee.position}
                </span>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => handleCopy("nip", employee.nip, "NIP")}
                  className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-blue-700 hover:underline"
                  title="Salin NIP"
                >
                  {employee.nip}
                  {copiedField === "nip" ? (
                    <Check className="size-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="size-3.5 text-slate-400" />
                  )}
                </button>
                <span className="text-slate-300">•</span>
                <span>Bergabung {formatTanggalIndo(employee.joinDate)}</span>
              </div>
            </div>
          </div>

          {/* Quick Contact Pills */}
          <div className="flex flex-wrap items-center gap-2.5 lg:flex-col lg:items-end">
            <button
              type="button"
              onClick={() =>
                handleCopy("email", employee.email, "Email kantor")
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:border-blue-300 hover:bg-blue-50/50"
            >
              <Mail className="size-3.5 text-blue-600" />
              <span>{employee.email}</span>
              {copiedField === "email" ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <Copy className="size-3.5 text-slate-400" />
              )}
            </button>

            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <BadgeCheck className="size-3.5 text-emerald-600" />
              Rekaman terverifikasi di SuloHR Vault
            </span>
          </div>
        </div>
      </div>

      {/* 4 KPI Strip */}
      <WaterfallContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WaterfallItem>
          <div className="glass-sulo-card relative overflow-hidden rounded-2xl p-4">
            <div className="bg-sulo-blue-pill absolute inset-x-0 top-0 h-0.5 opacity-85" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Saldo Cuti Tahunan
              </span>
              <div
                className={`flex size-8 items-center justify-center rounded-xl ${
                  isLowLeave
                    ? "bg-orange-50 text-orange-600 ring-1 ring-orange-200/80"
                    : "bg-blue-50 text-blue-600 ring-1 ring-blue-200/80"
                }`}
              >
                <CalendarClock className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              <KineticCounter
                value={employee.remainingLeaveQuota}
                suffix=" Hari"
              />
            </p>
            <p
              className={`mt-0.5 text-xs font-medium ${
                isLowLeave ? "text-orange-600" : "text-slate-500"
              }`}
            >
              {isLowLeave
                ? "Kuota cuti menipis (<= 3 hari)"
                : "Tersedia untuk pengajuan"}
            </p>
          </div>
        </WaterfallItem>

        <WaterfallItem>
          <div className="glass-sulo-card relative overflow-hidden rounded-2xl p-4">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500 opacity-85" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Masa Kerja Aktif
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/80">
                <Clock className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {tenure.label}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Sejak {formatTanggalIndo(employee.joinDate)}
            </p>
          </div>
        </WaterfallItem>

        <WaterfallItem>
          <div className="glass-sulo-orange relative overflow-hidden rounded-2xl p-4">
            <div className="bg-sulo-cta absolute inset-x-0 top-0 h-0.5" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Rekening Payroll
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-orange-100/80 text-orange-600 ring-1 ring-orange-200/80">
                <CreditCard className="size-4" />
              </div>
            </div>
            <p className="mt-2 font-mono text-lg font-bold text-slate-900 tabular-nums">
              {employee.bankName} {maskSensitiveValue(employee.bankAccount)}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              Buka penuh di tab Kompensasi
            </p>
          </div>
        </WaterfallItem>

        <WaterfallItem>
          <div className="glass-sulo-card relative overflow-hidden rounded-2xl p-4">
            <div className="bg-sulo-dual-gradient absolute inset-x-0 top-0 h-0.5 opacity-85" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Status Kepatuhan PII
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-200/80">
                <ShieldCheck className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">Terenkripsi</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Setiap akses dicatat di Audit Log
            </p>
          </div>
        </WaterfallItem>
      </WaterfallContainer>

      {/* Switcher Tab Detail */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/75 p-1.5 shadow-2xs sm:w-fit">
        {(
          [
            {
              id: "overview",
              label: "Identitas & Kepegawaian",
              icon: UserRound,
            },
            {
              id: "compensation",
              label: "Rekening & Kompensasi (PII)",
              icon: Wallet,
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors"
            >
              {isActive && (
                <motion.span
                  layoutId="employee-detail-tab"
                  transition={SULO_SPRING}
                  className="bg-sulo-blue-pill absolute inset-0 rounded-xl"
                />
              )}
              <Icon
                className={`relative z-10 size-3.5 ${
                  isActive ? "text-white" : "text-slate-500"
                }`}
              />
              <span
                className={`relative z-10 ${
                  isActive
                    ? "text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Konten Tab */}
      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Kartu 1: Identitas Pribadi & Kontak */}
          <section className="glass-sulo-card rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="bg-sulo-blue-pill flex size-8 items-center justify-center rounded-xl text-white">
                  <UserRound className="size-4" />
                </span>
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Identitas &amp; Kontak Pribadi
                  </h2>
                  <p className="text-xs text-slate-500">
                    Klik ikon mata untuk membuka data sensitif selama 30 detik
                  </p>
                </div>
              </div>
            </div>

            <dl className="mt-4 divide-y divide-slate-200/70 text-sm">
              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="text-xs font-semibold text-slate-500">
                  Nama Lengkap Sesuai KTP
                </dt>
                <dd className="font-semibold text-slate-900">
                  {employee.fullName}
                </dd>
              </div>

              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="text-xs font-semibold text-slate-500">
                  Nomor Induk Kependudukan (NIK)
                </dt>
                <dd>
                  <PiiMask
                    value={employee.nik}
                    formattedDisplay={employee.nik}
                    label={`NIK ${employee.fullName}`}
                  />
                </dd>
              </div>

              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="text-xs font-semibold text-slate-500">
                  Nomor Telepon / WhatsApp
                </dt>
                <dd className="flex items-center gap-2">
                  <Phone className="size-3.5 text-slate-400" />
                  <PiiMask
                    value={employee.phone}
                    formattedDisplay={formatPhoneReadable(employee.phone)}
                    label={`Nomor HP ${employee.fullName}`}
                  />
                </dd>
              </div>

              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="text-xs font-semibold text-slate-500">
                  Email Korporat
                </dt>
                <dd className="font-mono text-xs font-medium text-slate-800">
                  {employee.email}
                </dd>
              </div>
            </dl>
          </section>

          {/* Kartu 2: Penempatan & Status Kepegawaian */}
          <section className="glass-sulo-card rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="bg-sulo-cta flex size-8 items-center justify-center rounded-xl text-white">
                  <Briefcase className="size-4" />
                </span>
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Struktur &amp; Penempatan Kerja
                  </h2>
                  <p className="text-xs text-slate-500">
                    Posisi struktural dan masa berlaku kontrak aktif
                  </p>
                </div>
              </div>
            </div>

            <dl className="mt-4 divide-y divide-slate-200/70 text-sm">
              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="text-xs font-semibold text-slate-500">
                  Nomor Induk Pegawai (NIP)
                </dt>
                <dd className="font-mono text-xs font-bold text-blue-700">
                  {employee.nip}
                </dd>
              </div>

              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="text-xs font-semibold text-slate-500">
                  Departemen / Divisi
                </dt>
                <dd className="flex items-center gap-2">
                  <Building2 className="size-3.5 text-slate-400" />
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${theme.pill}`}
                  >
                    <span className={`size-1.5 rounded-full ${theme.dot}`} />
                    {employee.department}
                  </span>
                </dd>
              </div>

              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="text-xs font-semibold text-slate-500">
                  Jabatan Fungsional
                </dt>
                <dd className="font-semibold text-slate-900">
                  {employee.position}
                </dd>
              </div>

              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="text-xs font-semibold text-slate-500">
                  Status Hubungan Kerja
                </dt>
                <dd className="text-xs font-semibold text-slate-800">
                  {formatStatusFull(employee.status)}
                </dd>
              </div>

              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="text-xs font-semibold text-slate-500">
                  Tanggal Mulai Bekerja
                </dt>
                <dd className="text-xs font-medium text-slate-800">
                  {formatTanggalIndo(employee.joinDate)} ({tenure.label})
                </dd>
              </div>
            </dl>
          </section>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Kartu Kompensasi & Rekening Bank */}
          <section className="glass-sulo-card rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Wallet className="size-4" />
                </span>
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Rincian Payroll &amp; Rekening Bank
                  </h2>
                  <p className="text-xs text-slate-500">
                    Nominal kompensasi bulanan terlindungi PII Masking
                  </p>
                </div>
              </div>
            </div>

            <dl className="mt-4 divide-y divide-slate-200/70 text-sm">
              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="text-xs font-semibold text-slate-500">
                  Bank Tujuan Transfer
                </dt>
                <dd className="font-semibold text-slate-900">
                  {employee.bankName.toUpperCase()}
                </dd>
              </div>

              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="text-xs font-semibold text-slate-500">
                  Nomor Rekening Payroll
                </dt>
                <dd>
                  <PiiMask
                    value={employee.bankAccount}
                    formattedDisplay={`${employee.bankName} • ${employee.bankAccount}`}
                    label={`Rekening ${employee.fullName}`}
                  />
                </dd>
              </div>

              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="text-xs font-semibold text-slate-500">
                  Gaji Pokok Bulanan
                </dt>
                <dd>
                  <PiiMask
                    value={String(employee.baseSalary)}
                    formattedDisplay={formatRupiah(employee.baseSalary)}
                    label={`Gaji Pokok ${employee.fullName}`}
                  />
                </dd>
              </div>

              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="text-xs font-semibold text-slate-500">
                  Tunjangan Tetap
                </dt>
                <dd>
                  <PiiMask
                    value={String(employee.fixedAllowance)}
                    formattedDisplay={formatRupiah(employee.fixedAllowance)}
                    label={`Tunjangan Tetap ${employee.fullName}`}
                  />
                </dd>
              </div>

              <div className="flex flex-col justify-between gap-1 rounded-xl bg-blue-50/70 px-3 py-3 sm:flex-row sm:items-center">
                <dt className="text-xs font-bold text-blue-900">
                  Total Kompensasi Bruto / Bulan
                </dt>
                <dd>
                  <PiiMask
                    value={String(totalBruto)}
                    formattedDisplay={formatRupiah(totalBruto)}
                    label={`Total Bruto ${employee.fullName}`}
                  />
                </dd>
              </div>
            </dl>
          </section>

          {/* Kartu Catatan Tata Kelola & Tata Tertib Vault */}
          <section className="glass-sulo-orange flex flex-col justify-between rounded-2xl p-5 sm:p-6">
            <div>
              <div className="flex items-center gap-2.5 border-b border-orange-200/70 pb-3.5">
                <span className="bg-sulo-cta flex size-8 items-center justify-center rounded-xl text-white">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Tata Kelola Data Sensitif (UU PDP)
                  </h2>
                  <p className="text-xs text-slate-600">
                    Standar keamanan akses informasi kepegawaian PT Sulo
                  </p>
                </div>
              </div>

              <ul className="mt-4 flex flex-col gap-3 text-xs leading-relaxed text-slate-700">
                <li className="flex items-start gap-2.5 rounded-xl border border-white/80 bg-white/75 p-3">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-blue-600" />
                  <span>
                    <strong>Auto-Relock 30 Detik:</strong> Setiap bidang NIK,
                    nomor telepon, rekening bank, maupun nominal gaji otomatis
                    terkunci kembali setelah 30 detik dibuka.
                  </span>
                </li>
                <li className="flex items-start gap-2.5 rounded-xl border border-white/80 bg-white/75 p-3">
                  <Lock className="mt-0.5 size-4 shrink-0 text-orange-600" />
                  <span>
                    <strong>Jejak Audit Tak Terhapus:</strong> Pembukaan nilai
                    PII maupun pengunduhan dossier PDF tercatat langsung ke{" "}
                    <em>Security Audit Log</em> beserta stempel waktu.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl border border-orange-200/80 bg-white/85 px-4 py-3 text-xs">
              <span className="font-medium text-slate-600">
                ID Internal Rekaman
              </span>
              <code className="font-mono font-bold text-slate-900">
                {employee.id}
              </code>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}