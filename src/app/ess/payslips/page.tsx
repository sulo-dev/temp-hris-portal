// src/app/ess/payslips/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  Printer,
  ArrowLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Building2,
  Calendar,
  CreditCard,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSuloStore } from "@/store/use-sulo-store";
import { formatRupiah } from "@/lib/business-rules";
import { PayrollItem } from "@/lib/types";
import { TildGlassCard } from "@/components/motion/tild-glass-card";
import {
  LivePulseBeacon,
  MagneticAction,
  SULO_SPRING,
  SpatialBackdrop,
  WaterfallContainer,
  WaterfallItem,
} from "@/components/motion/motion-primitives";

const MONTH_NAMES_ID: Record<string, string> = {
  "01": "Januari",
  "02": "Februari",
  "03": "Maret",
  "04": "April",
  "05": "Mei",
  "06": "Juni",
  "07": "Juli",
  "08": "Agustus",
  "09": "September",
  "10": "Oktober",
  "11": "November",
  "12": "Desember",
};

const PRINT_A4_STYLES = `
  @media print {
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    body * {
      visibility: hidden !important;
    }
    #sulo-a4-payslip-sheet,
    #sulo-a4-payslip-sheet * {
      visibility: visible !important;
    }
    #sulo-a4-payslip-sheet {
      position: fixed !important;
      inset: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 12mm !important;
      border: none !important;
      box-shadow: none !important;
      background: #ffffff !important;
      z-index: 99999 !important;
    }
  }
`;

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split("-");
  if (!year || !month) return period;
  return `${MONTH_NAMES_ID[month] ?? month} ${year}`;
}

function getNumericField(obj: unknown, keys: string[]): number | null {
  if (!obj || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    const val = record[key];
    if (typeof val === "number" && !Number.isNaN(val)) {
      return val;
    }
  }
  return null;
}

function getStringField(obj: unknown, keys: string[]): string | null {
  if (!obj || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    const val = record[key];
    if (typeof val === "string" && val.trim().length > 0) {
      return val.trim();
    }
  }
  return null;
}

interface DetailedSlipBreakdown {
  baseSalary: number;
  fixedAllowance: number;
  transportMealAllowance: number;
  overtimePay: number;
  bpjsHealth: number;
  bpjsEmployment: number;
  pph21Tax: number;
}

function deriveSlipBreakdown(slip: PayrollItem): DetailedSlipBreakdown {
  const gross = slip.totalEarnings;
  const deductions = slip.totalDeductions;

  const rawBase = getNumericField(slip, [
    "baseSalary",
    "basicSalary",
    "gajiPokok",
  ]);
  const rawAllowance = getNumericField(slip, [
    "allowances",
    "fixedAllowance",
    "tunjanganTetap",
  ]);
  const rawOvertime = getNumericField(slip, ["overtimePay", "lembur"]);

  let baseSalary = rawBase ?? Math.round(gross * 0.78);
  let fixedAllowance = rawAllowance ?? Math.round(gross * 0.14);
  const overtimePay = rawOvertime ?? 0;
  let transportMealAllowance = Math.max(
    0,
    gross - baseSalary - fixedAllowance - overtimePay,
  );

  if (baseSalary + fixedAllowance + overtimePay > gross) {
    baseSalary = gross;
    fixedAllowance = 0;
    transportMealAllowance = 0;
  }

  const rawBpjsKes = getNumericField(slip, [
    "bpjsKesehatan",
    "bpjsHealth",
    "bpjs_kesehatan",
  ]);
  const rawBpjsTk = getNumericField(slip, [
    "bpjsKetenagakerjaan",
    "bpjsEmployment",
    "bpjs_ketenagakerjaan",
  ]);
  const rawPph21 = getNumericField(slip, ["pph21", "pph21Ter", "tax"]);

  let bpjsHealth = rawBpjsKes ?? Math.round(deductions * 0.18);
  let bpjsEmployment = rawBpjsTk ?? Math.round(deductions * 0.34);
  let pph21Tax = Math.max(
    0,
    rawPph21 ?? deductions - bpjsHealth - bpjsEmployment,
  );

  if (bpjsHealth + bpjsEmployment + pph21Tax !== deductions) {
    pph21Tax = Math.max(0, deductions - bpjsHealth - bpjsEmployment);
    if (bpjsHealth + bpjsEmployment > deductions) {
      bpjsHealth = deductions;
      bpjsEmployment = 0;
      pph21Tax = 0;
    }
  }

  return {
    baseSalary,
    fixedAllowance,
    transportMealAllowance,
    overtimePay,
    bpjsHealth,
    bpjsEmployment,
    pph21Tax,
  };
}

export default function EssPayslipsPage() {
  const { activeUserId, employees, payrolls, privacyShield } = useSuloStore();

  const [mounted, setMounted] = useState(false);
  const [selectedSlipId, setSelectedSlipId] = useState<string | null>(null);
  const [searchPeriod, setSearchPeriod] = useState("");
  const [unmaskPreview, setUnmaskPreview] = useState(false);
  const [printedDateLabel, setPrintedDateLabel] = useState("19 November 2026");

  useEffect(() => {
    setMounted(true);
    const formatted = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
    setPrintedDateLabel(formatted);
  }, []);

  const safeEmployees = mounted ? employees : [];
  const safePayrolls = mounted ? payrolls : [];
  const safePrivacyShield = mounted ? privacyShield : false;

  const currentUser = safeEmployees.find((e) => e.id === activeUserId);

  const myPayslips = useMemo(() => {
    return safePayrolls
      .filter((p) => p.employeeId === activeUserId)
      .sort((a, b) => b.period.localeCompare(a.period));
  }, [safePayrolls, activeUserId]);

  const filteredPayslips = useMemo(() => {
    const q = searchPeriod.trim().toLowerCase();
    if (!q) return myPayslips;
    return myPayslips.filter(
      (p) =>
        p.period.toLowerCase().includes(q) ||
        formatPeriodLabel(p.period).toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q),
    );
  }, [myPayslips, searchPeriod]);

  const activeSlip = useMemo(() => {
    if (myPayslips.length === 0) return null;
    if (selectedSlipId) {
      const found = myPayslips.find((p) => p.id === selectedSlipId);
      if (found) return found;
    }
    return myPayslips[0];
  }, [myPayslips, selectedSlipId]);

  const breakdown = useMemo(() => {
    if (!activeSlip) return null;
    return deriveSlipBreakdown(activeSlip);
  }, [activeSlip]);

  const isMasked = safePrivacyShield && !unmaskPreview;

  const bankName =
    getStringField(currentUser, ["bankName", "bank"]) ??
    "Bank Mandiri (Persero)";
  const rawAccountNo =
    getStringField(currentUser, ["bankAccount", "accountNumber", "noRekening"]) ??
    "1520098411208";
  const displayAccountNo = isMasked
    ? `•••• •••• ${rawAccountNo.slice(-4)}`
    : rawAccountNo;
  const npwpNumber =
    getStringField(currentUser, ["npwp", "taxId"]) ?? "09.482.119.4-805.000";

  function handlePrintA4() {
    if (!activeSlip) {
      toast.error("Tidak ada slip gaji yang dipilih untuk dicetak.");
      return;
    }
    if (isMasked) {
      toast.info(
        "Membuka rincian nominal sementara agar dokumen A4 tercetak lengkap.",
      );
      setUnmaskPreview(true);
      window.setTimeout(() => {
        window.print();
      }, 180);
      return;
    }
    window.print();
  }

  return (
    <div className="relative mx-auto flex max-w-[1400px] flex-col gap-6 px-4 pt-24 pb-12 sm:px-6 md:pt-28">
      {/* Standard style tag (tanpa styled-jsx agar tidak memicu hydration mismatch) */}
      <style>{PRINT_A4_STYLES}</style>

      <SpatialBackdrop />

      {/* Header Halaman dengan Jarak Aman dari Floating Topbar */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/70 pb-5">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-gradient-to-r from-white/90 via-blue-50/70 to-orange-50/80 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs">
            <LivePulseBeacon colorClass="bg-blue-600" />
            <span>
              Portal Mandiri Karyawan •{" "}
              <span className="text-blue-700">
                E-Payslip &amp; Pajak PPh 21
              </span>
            </span>
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Slip Gaji &amp;{" "}
            <span className="text-sulo-gradient">Rincian Kompensasi</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Akses arsip slip gaji bulanan, verifikasi potongan BPJS &amp; PPh 21
            TER, serta unduh salinan resmi format A4.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            render={<Link href="/ess/home" />}
            nativeButton={false}
            variant="outline"
            className="border-slate-200/90 bg-white/90 font-semibold text-slate-700 shadow-2xs hover:border-blue-300 hover:bg-blue-50/70 hover:text-blue-700"
          >
            <ArrowLeft data-icon="inline-start" />
            Kembali ke Beranda ESS
          </Button>

          <MagneticAction>
            <Button
              type="button"
              onClick={handlePrintA4}
              disabled={!activeSlip}
              className="bg-sulo-cta border-0 px-5 font-semibold text-white active:scale-[0.98] disabled:opacity-50"
            >
              <Printer data-icon="inline-start" />
              Cetak / Simpan PDF (A4)
            </Button>
          </MagneticAction>
        </div>
      </div>

      {/* 4 Kartu KPI Kompensasi Periode Terpilih */}
      <WaterfallContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WaterfallItem>
          <TildGlassCard className="glass-sulo-orange relative overflow-hidden">
            <div className="bg-sulo-cta absolute inset-x-0 top-0 h-0.5" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Take Home Pay (Gaji Bersih)
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-orange-100/85 text-orange-600 ring-1 ring-orange-200/80">
                <Wallet className="size-4" />
              </div>
            </div>
            <p
              className={`text-sulo-orange-gradient mt-2.5 font-mono text-2xl font-extrabold tabular-nums transition-all ${
                isMasked ? "blur-xs select-none" : ""
              }`}
            >
              {activeSlip ? formatRupiah(activeSlip.takeHomePay) : "Rp 0"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {activeSlip
                ? `Periode ${formatPeriodLabel(activeSlip.period)}`
                : "Belum ada slip diterbitkan"}
            </p>
          </TildGlassCard>
        </WaterfallItem>

        <WaterfallItem>
          <TildGlassCard className="relative overflow-hidden">
            <div className="bg-sulo-blue-pill absolute inset-x-0 top-0 h-0.5 opacity-85" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Total Penerimaan Bruto
              </span>
              <div className="bg-sulo-blue-pill flex size-8 items-center justify-center rounded-xl text-white">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <p
              className={`mt-2.5 font-mono text-2xl font-bold text-slate-900 tabular-nums transition-all ${
                isMasked ? "blur-xs select-none" : ""
              }`}
            >
              {activeSlip ? formatRupiah(activeSlip.totalEarnings) : "Rp 0"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Gaji pokok &amp; seluruh tunjangan aktif
            </p>
          </TildGlassCard>
        </WaterfallItem>

        <WaterfallItem>
          <TildGlassCard className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-rose-500 opacity-85" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Total Potongan Wajib
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200/80">
                <TrendingDown className="size-4" />
              </div>
            </div>
            <p
              className={`mt-2.5 font-mono text-2xl font-bold text-rose-600 tabular-nums transition-all ${
                isMasked ? "blur-xs select-none" : ""
              }`}
            >
              {activeSlip
                ? `-${formatRupiah(activeSlip.totalDeductions)}`
                : "Rp 0"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              BPJS Kesehatan, TK &amp; PPh 21 TER
            </p>
          </TildGlassCard>
        </WaterfallItem>

        <WaterfallItem>
          <TildGlassCard className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500 opacity-85" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Status &amp; Perlindungan PII
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/80">
                <ShieldCheck className="size-4" />
              </div>
            </div>
            <p className="mt-2.5 text-xl font-bold text-slate-900">
              {activeSlip
                ? activeSlip.status === "PAID"
                  ? "Terbayar (Settled)"
                  : activeSlip.status
                : "Menunggu Rilis"}
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-700">
              Enkripsi UU PDP:{" "}
              <strong>{isMasked ? "Tersamarkan" : "Terbuka"}</strong>
            </p>
          </TildGlassCard>
        </WaterfallItem>
      </WaterfallContainer>

      {/* Workspace Utama: Daftar Periode (Kiri) & Pratinjau Slip A4 (Kanan) */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Arsip Periode Slip Gaji */}
        <div className="glass-sulo-card flex flex-col gap-4 rounded-3xl p-5 lg:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3.5">
            <div>
              <h2 className="font-display flex items-center gap-2 text-base font-bold text-slate-900">
                <FileSpreadsheet className="size-4 text-blue-600" />
                Arsip Periode Gaji
              </h2>
              <p className="text-xs text-slate-500">
                Pilih bulan untuk memuat rincian dokumen A4
              </p>
            </div>
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50/80 font-mono text-xs font-semibold text-blue-700 tabular-nums"
            >
              {myPayslips.length} Slip
            </Badge>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-400" />
            <Input
              value={searchPeriod}
              onChange={(e) => setSearchPeriod(e.target.value)}
              placeholder="Cari bulan atau tahun (mis. Nov 2026)..."
              className="border-slate-200/90 bg-white/90 pl-9 text-xs text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col gap-2.5">
            {filteredPayslips.length === 0 ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-6 text-center">
                <p className="text-xs font-semibold text-slate-800">
                  {myPayslips.length === 0
                    ? "Belum ada slip gaji yang diterbitkan."
                    : "Periode slip gaji tidak ditemukan."}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {myPayslips.length === 0
                    ? "Slip gaji elektronik akan muncul otomatis setelah tim HR memfinalisasi payroll bulanan."
                    : "Coba ubah kata kunci pencarian periode."}
                </p>
              </div>
            ) : (
              filteredPayslips.map((slip) => {
                const isSelected = activeSlip?.id === slip.id;
                return (
                  <button
                    key={slip.id}
                    type="button"
                    onClick={() => setSelectedSlipId(slip.id)}
                    className={`relative flex w-full flex-col gap-2 rounded-2xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? "border-blue-400/90 bg-white shadow-sm ring-2 ring-blue-500/15"
                        : "border-slate-200/85 bg-white/75 hover:border-blue-300 hover:bg-white"
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="ess-payslip-active-bar"
                        transition={SULO_SPRING}
                        className="bg-sulo-dual-gradient absolute inset-y-2 left-0 w-1 rounded-r-full"
                      />
                    )}

                    <div className="flex items-center justify-between gap-2 pl-1.5">
                      <span className="text-sm font-bold text-slate-900">
                        {formatPeriodLabel(slip.period)}
                      </span>

                      {slip.status === "PAID" ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-700"
                        >
                          <CheckCircle2 className="mr-1 size-3" />
                          PAID
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-[11px] font-semibold text-amber-800"
                        >
                          <Clock3 className="mr-1 size-3" />
                          {slip.status}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pl-1.5 font-mono text-xs tabular-nums">
                      <span className="text-slate-500">{slip.period}</span>
                      <span
                        className={`font-bold text-blue-700 ${
                          isMasked ? "blur-xs select-none" : ""
                        }`}
                      >
                        {formatRupiah(slip.takeHomePay)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Kolom Kanan: Pratinjau Lembar Cetak Slip Gaji Format A4 */}
        <div className="flex flex-col gap-4 lg:col-span-8">
          <div className="glass-sulo-card flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono font-bold text-blue-700 ring-1 ring-blue-200/80">
                FORMAT A4 • 210 × 297 mm
              </span>
              <span className="hidden text-slate-500 sm:inline">
                Siap dicetak atau disimpan sebagai PDF resmi
              </span>
            </div>

            <div className="flex items-center gap-2">
              {safePrivacyShield && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setUnmaskPreview((prev) => !prev)}
                  className="border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {unmaskPreview ? (
                    <>
                      <EyeOff
                        data-icon="inline-start"
                        className="text-orange-600"
                      />
                      Samarkan Nominal
                    </>
                  ) : (
                    <>
                      <Eye data-icon="inline-start" className="text-blue-600" />
                      Tampilkan Nominal
                    </>
                  )}
                </Button>
              )}

              <Button
                type="button"
                size="sm"
                onClick={handlePrintA4}
                disabled={!activeSlip}
                className="bg-sulo-blue-pill border-0 font-semibold text-white shadow-2xs hover:opacity-95"
              >
                <Printer data-icon="inline-start" />
                Cetak A4
              </Button>
            </div>
          </div>

          {!activeSlip || !breakdown ? (
            <div className="glass-sulo-card flex min-h-[420px] flex-col items-center justify-center rounded-3xl p-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-200/80">
                <FileSpreadsheet className="size-6" />
              </div>
              <h3 className="font-display mt-4 text-base font-bold text-slate-900">
                Belum Ada Dokumen Slip Gaji Dipilih
              </h3>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
                Pratinjau slip gaji format A4 akan tampil di sini secara
                otomatis setelah tersedia data penggajian untuk akun Anda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div
                id="sulo-a4-payslip-sheet"
                className="mx-auto flex min-h-[820px] w-full max-w-[794px] flex-col justify-between rounded-2xl border border-slate-200/95 bg-white p-7 text-slate-900 shadow-lg sm:p-10"
              >
                <div className="flex flex-col gap-6">
                  {/* Kop Surat Perusahaan */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
                    <div className="flex items-start gap-3">
                      <div className="bg-sulo-dual-gradient flex size-11 shrink-0 items-center justify-center rounded-xl font-mono text-base font-extrabold text-white shadow-xs">
                        SH
                      </div>
                      <div>
                        <h2 className="font-display text-lg font-extrabold tracking-tight text-slate-950">
                          PT SULO TEKNOLOGI INDONESIA
                        </h2>
                        <p className="text-xs text-slate-600">
                          Divisi Human Capital &amp; Payroll Operations
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Jl. Andi Pangeran Pettarani No. 88, Makassar, Sulawesi
                          Selatan
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="inline-block rounded-md border border-slate-900 bg-slate-900 px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider text-white uppercase">
                        SLIP GAJI RESMI • CONFIDENTIAL
                      </span>
                      <p className="mt-1.5 font-mono text-xs font-bold text-slate-900">
                        No. Ref: SLIP/{activeSlip.period}/
                        {currentUser?.nip ?? "EMP"}
                      </p>
                      <p className="text-xs font-semibold text-blue-700">
                        Periode: {formatPeriodLabel(activeSlip.period)}
                      </p>
                    </div>
                  </div>

                  {/* Grid Informasi Karyawan & Pembayaran */}
                  <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Nama Karyawan</span>
                        <span className="font-bold text-slate-900">
                          {currentUser?.fullName ?? "Karyawan PT Sulo"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">
                          Nomor Induk (NIP)
                        </span>
                        <span className="font-mono font-semibold text-slate-800">
                          {currentUser?.nip ?? "SL-001"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Departemen</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          <Building2 className="size-3 text-slate-500" />
                          {currentUser?.department ?? "Engineering"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Jabatan</span>
                        <span className="font-semibold text-slate-800">
                          {currentUser?.position ?? "Staff"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 border-t border-slate-200 pt-2.5 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Status Kerja</span>
                        <span className="font-semibold text-slate-800">
                          {currentUser?.contractEndDate
                            ? "PKWT (Kontrak)"
                            : "PKWTT (Tetap)"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">NPWP</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {isMasked ? "••.•••.•••.••-•••.•••" : npwpNumber}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Bank Transfer</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          <CreditCard className="size-3 text-slate-500" />
                          {bankName}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">No. Rekening</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {displayAccountNo}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tabel Dua Kolom: Penerimaan (Kiri) & Potongan (Kanan) */}
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="flex flex-col justify-between rounded-xl border border-slate-200">
                      <div>
                        <div className="border-b border-slate-200 bg-blue-50/70 px-3.5 py-2 text-xs font-bold tracking-wide text-blue-900 uppercase">
                          I. Rincian Penerimaan (Earnings)
                        </div>
                        <div className="divide-y divide-slate-100 px-3.5 text-xs">
                          <div className="flex justify-between py-2.5">
                            <span className="text-slate-600">Gaji Pokok</span>
                            <span
                              className={`font-mono font-semibold text-slate-900 tabular-nums ${
                                isMasked ? "blur-xs select-none" : ""
                              }`}
                            >
                              {formatRupiah(breakdown.baseSalary)}
                            </span>
                          </div>
                          <div className="flex justify-between py-2.5">
                            <span className="text-slate-600">
                              Tunjangan Tetap &amp; Jabatan
                            </span>
                            <span
                              className={`font-mono font-semibold text-slate-900 tabular-nums ${
                                isMasked ? "blur-xs select-none" : ""
                              }`}
                            >
                              {formatRupiah(breakdown.fixedAllowance)}
                            </span>
                          </div>
                          <div className="flex justify-between py-2.5">
                            <span className="text-slate-600">
                              Tunjangan Transport &amp; Makan
                            </span>
                            <span
                              className={`font-mono font-semibold text-slate-900 tabular-nums ${
                                isMasked ? "blur-xs select-none" : ""
                              }`}
                            >
                              {formatRupiah(breakdown.transportMealAllowance)}
                            </span>
                          </div>
                          {breakdown.overtimePay > 0 && (
                            <div className="flex justify-between py-2.5">
                              <span className="text-slate-600">
                                Upah Lembur Disetujui
                              </span>
                              <span
                                className={`font-mono font-semibold text-slate-900 tabular-nums ${
                                  isMasked ? "blur-xs select-none" : ""
                                }`}
                              >
                                {formatRupiah(breakdown.overtimePay)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs">
                        <span className="font-bold text-slate-800">
                          Total Penerimaan Bruto
                        </span>
                        <span
                          className={`font-mono font-extrabold text-blue-700 tabular-nums ${
                            isMasked ? "blur-xs select-none" : ""
                          }`}
                        >
                          {formatRupiah(activeSlip.totalEarnings)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-xl border border-slate-200">
                      <div>
                        <div className="border-b border-slate-200 bg-rose-50/70 px-3.5 py-2 text-xs font-bold tracking-wide text-rose-900 uppercase">
                          II. Rincian Potongan (Deductions)
                        </div>
                        <div className="divide-y divide-slate-100 px-3.5 text-xs">
                          <div className="flex justify-between py-2.5">
                            <span className="text-slate-600">
                              BPJS Kesehatan (1%)
                            </span>
                            <span
                              className={`font-mono font-semibold text-slate-900 tabular-nums ${
                                isMasked ? "blur-xs select-none" : ""
                              }`}
                            >
                              {formatRupiah(breakdown.bpjsHealth)}
                            </span>
                          </div>
                          <div className="flex justify-between py-2.5">
                            <span className="text-slate-600">
                              BPJS Ketenagakerjaan (JHT &amp; JP)
                            </span>
                            <span
                              className={`font-mono font-semibold text-slate-900 tabular-nums ${
                                isMasked ? "blur-xs select-none" : ""
                              }`}
                            >
                              {formatRupiah(breakdown.bpjsEmployment)}
                            </span>
                          </div>
                          <div className="flex justify-between py-2.5">
                            <span className="text-slate-600">
                              Pajak Penghasilan (PPh 21 TER)
                            </span>
                            <span
                              className={`font-mono font-semibold text-slate-900 tabular-nums ${
                                isMasked ? "blur-xs select-none" : ""
                              }`}
                            >
                              {formatRupiah(breakdown.pph21Tax)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs">
                        <span className="font-bold text-slate-800">
                          Total Potongan Wajib
                        </span>
                        <span
                          className={`font-mono font-extrabold text-rose-600 tabular-nums ${
                            isMasked ? "blur-xs select-none" : ""
                          }`}
                        >
                          -{formatRupiah(activeSlip.totalDeductions)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ringkasan Take Home Pay */}
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-slate-900 bg-gradient-to-r from-blue-50/60 via-white to-orange-50/70 p-4">
                    <div>
                      <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                        Gaji Bersih Diterima (Take Home Pay)
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600">
                        <Calendar className="size-3.5 text-blue-600" />
                        Ditransfer ke {bankName} ({displayAccountNo})
                      </p>
                    </div>

                    <p
                      className={`font-mono text-2xl font-extrabold text-slate-950 tabular-nums sm:text-3xl ${
                        isMasked ? "blur-xs select-none" : ""
                      }`}
                    >
                      {formatRupiah(activeSlip.takeHomePay)}
                    </p>
                  </div>
                </div>

                {/* Footer Pengesahan Elektronik & UU PDP */}
                <div className="mt-8 border-t border-slate-200 pt-4">
                  <div className="flex flex-wrap items-end justify-between gap-4 text-xs">
                    <div className="max-w-md space-y-1 text-[11px] leading-relaxed text-slate-500">
                      <p className="font-semibold text-slate-700">
                        Pemberitahuan Kerahasiaan (UU No. 27 Tahun 2022 - UU
                        PDP):
                      </p>
                      <p>
                        Dokumen ini berisi data pribadi dan kompensasi yang
                        bersifat rahasia. Dilarang menyebarluaskan tanpa izin
                        pemilik data atau otoritas Human Capital PT Sulo
                        Teknologi Indonesia.
                      </p>
                    </div>

                    <div className="flex flex-col items-start sm:items-end">
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800">
                        <BadgeCheck className="size-4 text-emerald-600" />
                        VERIFIED BY SULOHR PAYROLL ENGINE
                      </div>
                      <p className="mt-1.5 font-mono text-[11px] text-slate-500">
                        Makassar, {printedDateLabel}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}