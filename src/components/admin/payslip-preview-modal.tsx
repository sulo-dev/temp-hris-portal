// src/components/admin/payslip-preview-modal.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Employee, PayrollItem } from "@/lib/types";
import { formatRupiah } from "@/lib/business-rules";
import { SULO_SPRING } from "@/components/motion/motion-primitives";

interface PayslipPreviewModalProps {
  slip: PayrollItem | null;
  employee: Employee | null;
  onClose: () => void;
  onPrintSlip?: (slip: PayrollItem, employee: Employee) => void;
}

export function PayslipPreviewModal({
  slip,
  employee,
  onClose,
  onPrintSlip,
}: PayslipPreviewModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Kunci scroll latar & dukung tombol Escape saat pratinjau terbuka
  useEffect(() => {
    if (!slip) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [slip, onClose]);

  function handlePrint() {
    if (slip && employee && onPrintSlip) {
      onPrintSlip(slip, employee);
    }
    window.print();
  }

  if (!mounted) return null;

  const isOpen = Boolean(slip && employee);

  return createPortal(
    <AnimatePresence>
      {isOpen && slip && employee && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="payslip-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop Blur (disembunyikan saat print) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="no-print fixed inset-0 bg-slate-950/45 backdrop-blur-md"
          />

          {/* Centered Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={SULO_SPRING}
            className="glass-sulo-elevated relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/90 bg-white/95 p-5 shadow-2xl sm:p-7"
          >
            <div className="no-print bg-sulo-dual-gradient absolute inset-x-0 top-0 h-1.5" />

            {/* Modal Header (no-print) */}
            <div className="no-print flex items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div className="flex items-start gap-3">
                <span className="bg-sulo-blue-pill mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow-xs">
                  <FileCheck2 className="size-5" />
                </span>
                <div>
                  <h2
                    id="payslip-modal-title"
                    className="font-display text-lg font-bold text-slate-900"
                  >
                    Pratinjau Slip Gaji Resmi —{" "}
                    <span className="text-sulo-gradient">Format A4</span>
                  </h2>
                  <p className="text-xs text-slate-600">
                    Dokumen terenkripsi dengan hash integritas dan siap dicetak
                    atau disimpan sebagai PDF.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup pratinjau slip gaji"
                className="rounded-xl border border-slate-200/90 bg-white/80 p-2 text-slate-500 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Lembar Kertas Slip Gaji A4 */}
            <div className="print-payslip-sheet mt-5 rounded-2xl border border-slate-200/90 bg-white p-6 text-sm text-slate-900 shadow-sm sm:p-8">
              {/* Kop Perusahaan */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-900/15 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-sulo-blue-pill inline-block size-2.5 rounded-full" />
                    <h3 className="font-display text-lg font-bold tracking-tight text-slate-900">
                      PT SULO INDONESIA
                    </h3>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-slate-600">
                    Slip Gaji Elektronik (E-Payslip) • Periode{" "}
                    <strong className="font-mono text-slate-900">
                      {slip.period}
                    </strong>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Makassar Digital Hub, Sulawesi Selatan
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/90 bg-slate-50/90 px-3 py-2 text-right font-mono text-xs tabular-nums">
                  <p className="font-bold text-slate-800">Ref: {slip.id}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Hash: {slip.verificationHash}
                  </p>
                </div>
              </div>

              {/* Identitas Karyawan */}
              <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 text-xs sm:grid-cols-2">
                <p className="text-slate-700">
                  <span className="text-slate-500">Nama Lengkap:</span>{" "}
                  <strong className="text-slate-900">
                    {employee.fullName}
                  </strong>
                </p>
                <p className="font-mono text-slate-700 tabular-nums">
                  <span className="font-sans text-slate-500">NIP:</span>{" "}
                  <strong className="text-slate-900">{employee.nip}</strong>
                </p>
                <p className="text-slate-700">
                  <span className="text-slate-500">Departemen:</span>{" "}
                  <strong className="text-slate-900">
                    {employee.department}
                  </strong>
                </p>
                <p className="text-slate-700">
                  <span className="text-slate-500">Jabatan:</span>{" "}
                  <strong className="text-slate-900">
                    {employee.position}
                  </strong>
                </p>
              </div>

              {/* Rincian Penerimaan & Potongan */}
              <div className="mt-5 grid grid-cols-1 gap-6 border-y border-slate-200/90 py-5 sm:grid-cols-2">
                {/* Kolom Penerimaan */}
                <div className="flex flex-col gap-2.5">
                  <h4 className="text-xs font-bold tracking-wider text-blue-700 uppercase">
                    I. Rincian Penerimaan
                  </h4>
                  <div className="flex justify-between font-mono text-xs text-slate-700 tabular-nums">
                    <span className="font-sans">Gaji Pokok</span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(slip.baseSalary)}
                    </span>
                  </div>
                  <div className="flex justify-between font-mono text-xs text-slate-700 tabular-nums">
                    <span className="font-sans">Tunjangan Tetap</span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(slip.fixedAllowance)}
                    </span>
                  </div>
                  <div className="flex justify-between font-mono text-xs text-slate-700 tabular-nums">
                    <span className="font-sans">Uang Lembur</span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(slip.overtimePay)}
                    </span>
                  </div>
                  <div className="mt-auto flex justify-between border-t border-slate-200 pt-2 font-mono text-xs font-bold text-slate-900 tabular-nums">
                    <span className="font-sans">Total Penerimaan (A)</span>
                    <span className="text-emerald-700">
                      {formatRupiah(slip.totalEarnings)}
                    </span>
                  </div>
                </div>

                {/* Kolom Potongan */}
                <div className="flex flex-col gap-2.5 sm:border-l sm:border-slate-200/80 sm:pl-6">
                  <h4 className="text-xs font-bold tracking-wider text-orange-600 uppercase">
                    II. Rincian Potongan
                  </h4>
                  <div className="flex justify-between font-mono text-xs text-slate-700 tabular-nums">
                    <span className="font-sans">
                      Keterlambatan ({slip.lateCount}x)
                    </span>
                    <span className="font-semibold text-rose-600">
                      -{formatRupiah(slip.lateDeduction)}
                    </span>
                  </div>
                  <div className="flex justify-between font-mono text-xs text-slate-700 tabular-nums">
                    <span className="font-sans">BPJS Kesehatan (1%)</span>
                    <span className="font-semibold text-rose-600">
                      -{formatRupiah(slip.bpjsKesehatan)}
                    </span>
                  </div>
                  <div className="flex justify-between font-mono text-xs text-slate-700 tabular-nums">
                    <span className="font-sans">BPJS TK JHT (2%)</span>
                    <span className="font-semibold text-rose-600">
                      -{formatRupiah(slip.bpjsTkJht)}
                    </span>
                  </div>
                  <div className="flex justify-between font-mono text-xs text-slate-700 tabular-nums">
                    <span className="font-sans">PPh 21 (TER)</span>
                    <span className="font-semibold text-rose-600">
                      -{formatRupiah(slip.pph21)}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 font-mono text-xs font-bold text-slate-900 tabular-nums">
                    <span className="font-sans">Total Potongan (B)</span>
                    <span className="text-rose-600">
                      -{formatRupiah(slip.totalDeductions)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Take Home Pay Highlight */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-orange-200/90 bg-gradient-to-r from-blue-50/80 via-white to-orange-50/90 px-4 py-3.5">
                <div>
                  <span className="text-xs font-bold tracking-wide text-slate-900 uppercase">
                    Take Home Pay (A - B)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Ditransfer ke rekening payroll terdaftar karyawan
                  </p>
                </div>
                <span className="text-sulo-orange-gradient font-mono text-xl font-extrabold tabular-nums">
                  {formatRupiah(slip.takeHomePay)}
                </span>
              </div>

              {/* Footer Otorisasi */}
              <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-slate-200/80 pt-4 text-xs text-slate-600">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span>Status Pembayaran:</span>
                    {slip.status === "PAID" ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"
                      >
                        <CheckCircle2 className="mr-1 size-3" />
                        PAID (LUNAS)
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
                  </div>
                  <p className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                    <ShieldCheck className="size-3.5 text-blue-600" />
                    SHA-Check: {slip.verificationHash}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-slate-500">Disahkan secara elektronik oleh,</p>
                  <p className="mt-5 font-bold text-slate-900">Rina Kusuma</p>
                  <p className="text-[11px] text-slate-500">
                    HR Manager — PT Sulo Indonesia
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions (no-print) */}
            <div className="no-print mt-5 flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-200/80 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-slate-200/90 bg-white text-slate-700 hover:bg-slate-100"
              >
                Tutup
              </Button>
              <Button
                type="button"
                onClick={handlePrint}
                className="bg-sulo-cta border-0 px-5 font-semibold text-white active:scale-[0.98]"
              >
                <Printer data-icon="inline-start" />
                Cetak / Simpan PDF A4
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}