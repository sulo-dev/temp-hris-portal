// src/components/admin/approval-review-modal.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  CheckCircle2,
  XCircle,
  CalendarClock,
  AlertTriangle,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Employee } from "@/lib/types";
import {
  ApprovalRequest,
  ApprovalStatus,
  formatShortDateIndo,
  getApprovalCategoryLabel,
} from "@/lib/approval-utils";
import { SULO_SPRING } from "@/components/motion/motion-primitives";

interface ApprovalReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ApprovalRequest | null;
  targetEmployee: Employee | null;
  onDecision: (
    requestId: string,
    decision: Exclude<ApprovalStatus, "PENDING">,
    reviewerNote: string,
  ) => void;
}

export function ApprovalReviewModal({
  open,
  onOpenChange,
  request,
  targetEmployee,
  onDecision,
}: ApprovalReviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [reviewerNote, setReviewerNote] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && request) {
      setReviewerNote(request.reviewerNote ?? "");
    }
  }, [open, request]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!mounted) return null;

  const exceedsQuota =
    request?.category === "CUTI_TAHUNAN" &&
    targetEmployee !== null &&
    request.durationDays > targetEmployee.remainingLeaveQuota;

  function handleDecisionClick(decision: Exclude<ApprovalStatus, "PENDING">) {
    if (!request) return;
    if (decision === "REJECTED" && reviewerNote.trim().length < 5) {
      toast.error(
        "Sertakan alasan penolakan minimal 5 karakter untuk jejak audit.",
      );
      return;
    }
    const finalNote =
      reviewerNote.trim() ||
      (decision === "APPROVED"
        ? "Disetujui oleh HR Admin sesuai kebijakan PT Sulo."
        : "Ditolak oleh HR Admin.");

    onDecision(request.id, decision, finalNote);
    onOpenChange(false);
  }

  return createPortal(
    <AnimatePresence>
      {open && request && targetEmployee && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-approval-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-md"
          />

          {/* Centered Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={SULO_SPRING}
            className="glass-sulo-elevated relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/90 bg-white/95 p-5 shadow-2xl sm:p-7"
          >
            <div className="bg-sulo-dual-gradient absolute inset-x-0 top-0 h-1.5" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div className="flex items-start gap-3">
                <span className="bg-sulo-blue-pill mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow-xs">
                  <FileCheck2 className="size-5" />
                </span>
                <div>
                  <h2
                    id="review-approval-modal-title"
                    className="font-display text-lg font-bold text-slate-900"
                  >
                    Tinjau{" "}
                    <span className="text-sulo-gradient">
                      Tiket Persetujuan
                    </span>
                  </h2>
                  <p className="text-xs text-slate-600">
                    {request.ticketCode} • Diajukan {request.submittedAt}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Tutup modal tinjauan"
                className="rounded-xl border border-slate-200/90 bg-white/80 p-2 text-slate-500 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-4">
              {/* Ringkasan Pemohon */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {targetEmployee.fullName}
                  </p>
                  <p className="font-mono text-xs text-slate-500">
                    {targetEmployee.nip} • {targetEmployee.department} •{" "}
                    {targetEmployee.position}
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className="border-blue-200 bg-blue-50 font-semibold text-blue-700"
                >
                  {getApprovalCategoryLabel(request.category)}
                </Badge>
              </div>

              {/* Detail Jadwal & Kuota */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Periode &amp; Durasi
                  </span>
                  <p className="mt-1 text-xs font-bold text-slate-900">
                    {request.startDate === request.endDate
                      ? formatShortDateIndo(request.startDate)
                      : `${formatShortDateIndo(request.startDate)} – ${formatShortDateIndo(request.endDate)}`}
                  </p>
                  <p className="mt-0.5 font-mono text-xs font-semibold text-blue-700">
                    {request.durationLabel}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Saldo Cuti Pemohon Saat Ini
                  </span>
                  <p className="mt-1 flex items-center gap-1.5 font-mono text-sm font-bold text-slate-900">
                    <CalendarClock className="size-4 text-orange-500" />
                    {targetEmployee.remainingLeaveQuota} Hari Tersisa
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {request.category === "CUTI_TAHUNAN"
                      ? `Sisa setelah disetujui: ${Math.max(0, targetEmployee.remainingLeaveQuota - request.durationDays)} hari`
                      : "Tidak memotong saldo cuti tahunan"}
                  </p>
                </div>
              </div>

              {exceedsQuota && request.status === "PENDING" && (
                <div className="flex items-start gap-2.5 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2.5 text-xs text-orange-800">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-600" />
                  <span>
                    <strong>Perhatian Kuota:</strong> Durasi pengajuan (
                    {request.durationDays} hari) melebihi sisa cuti karyawan (
                    {targetEmployee.remainingLeaveQuota} hari).
                  </span>
                </div>
              )}

              {/* Keterangan Pemohon */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                <span className="text-[11px] font-semibold text-slate-500">
                  Keterangan / Alasan Pemohon
                </span>
                <p className="mt-1 text-xs leading-relaxed text-slate-800">
                  {request.reason}
                </p>
              </div>

              {/* Catatan Reviewer */}
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="reviewer-note"
                  className="text-xs font-semibold text-slate-700"
                >
                  Catatan Keputusan HR (Wajib diisi jika menolak)
                </Label>
                <Input
                  id="reviewer-note"
                  disabled={request.status !== "PENDING"}
                  value={reviewerNote}
                  onChange={(e) => setReviewerNote(e.target.value)}
                  placeholder="Contoh: Disetujui, jadwal piket sudah dialihkan."
                  className="border-slate-200/90 bg-white text-slate-900"
                />
              </div>

              {/* Footer Aksi Keputusan */}
              <div className="mt-2 flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-200/80 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-slate-200/90 bg-white text-slate-700 hover:bg-slate-100"
                >
                  Tutup
                </Button>

                {request.status === "PENDING" && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDecisionClick("REJECTED")}
                      className="border-rose-200 bg-rose-50 font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      <XCircle data-icon="inline-start" />
                      Tolak Pengajuan
                    </Button>

                    <Button
                      type="button"
                      onClick={() => handleDecisionClick("APPROVED")}
                      className="bg-sulo-cta border-0 px-5 font-semibold text-white active:scale-[0.98]"
                    >
                      <CheckCircle2 data-icon="inline-start" />
                      Setujui Tiket
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}