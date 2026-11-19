// src/components/admin/add-approval-modal.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  PlusCircle,
  ShieldCheck,
  X,
  AlertTriangle,
  Send,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Employee } from "@/lib/types";
import {
  ApprovalCategory,
  ApprovalRequest,
  calculateInclusiveDays,
} from "@/lib/approval-utils";
import {
  MagneticAction,
  SULO_SPRING,
} from "@/components/motion/motion-primitives";

export type AddApprovalPayload = Omit<
  ApprovalRequest,
  "id" | "ticketCode" | "submittedAt" | "status"
>;

interface AddApprovalModalProps {
  employees: Employee[];
  onAddRequest: (payload: AddApprovalPayload) => void;
}

export function AddApprovalModal({
  employees,
  onAddRequest,
}: AddApprovalModalProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  const [employeeId, setEmployeeId] = useState("");
  const [category, setCategory] = useState<ApprovalCategory>("CUTI_TAHUNAN");
  const [startDate, setStartDate] = useState("2026-11-24");
  const [endDate, setEndDate] = useState("2026-11-25");
  const [customDuration, setCustomDuration] = useState("2 Jam Lembur");
  const [reason, setReason] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Kunci scroll latar & dukung tombol Escape saat modal terbuka
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleOpenModal() {
    if (employees.length === 0) {
      toast.warning("Belum ada data karyawan di database.");
      return;
    }
    setEmployeeId(employees[0]?.id ?? "");
    setCategory("CUTI_TAHUNAN");
    setStartDate("2026-11-24");
    setEndDate("2026-11-25");
    setCustomDuration("2 Jam Lembur");
    setReason("");
    setOpen(true);
  }

  const isDayBasedCategory =
    category === "CUTI_TAHUNAN" || category === "IZIN_SAKIT";
  const calculatedDays = isDayBasedCategory
    ? calculateInclusiveDays(startDate, endDate)
    : 0;

  const selectedEmployee = employees.find((e) => e.id === employeeId);
  const exceedsQuota =
    category === "CUTI_TAHUNAN" &&
    selectedEmployee !== undefined &&
    calculatedDays > selectedEmployee.remainingLeaveQuota;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedEmployee) {
      toast.error("Pilih karyawan pemohon terlebih dahulu.");
      return;
    }
    if (isDayBasedCategory && endDate < startDate) {
      toast.error("Tanggal selesai tidak boleh mendahului tanggal mulai.");
      return;
    }
    if (reason.trim().length < 6) {
      toast.error("Uraikan alasan pengajuan minimal 6 karakter.");
      return;
    }

    onAddRequest({
      employeeId: selectedEmployee.id,
      category,
      startDate,
      endDate: isDayBasedCategory ? endDate : startDate,
      durationDays: calculatedDays,
      durationLabel: isDayBasedCategory
        ? `${calculatedDays} Hari Kerja`
        : customDuration.trim() || "1 Sesi Koreksi",
      reason: reason.trim(),
    });

    setOpen(false);
  }

  return (
    <>
      <MagneticAction>
        <Button
          type="button"
          onClick={handleOpenModal}
          className="bg-sulo-cta border-0 font-semibold text-white active:scale-[0.98]"
        >
          <PlusCircle data-icon="inline-start" />
          Input Pengajuan Baru
        </Button>
      </MagneticAction>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-approval-modal-title"
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
              >
                {/* Backdrop Blur */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setOpen(false)}
                  className="fixed inset-0 bg-slate-950/45 backdrop-blur-md"
                />

                {/* Centered Glass Modal Card */}
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
                        <ShieldCheck className="size-5" />
                      </span>
                      <div>
                        <h2
                          id="add-approval-modal-title"
                          className="font-display text-lg font-bold text-slate-900"
                        >
                          Input{" "}
                          <span className="text-sulo-gradient">
                            Pengajuan Baru
                          </span>
                        </h2>
                        <p className="text-xs text-slate-600">
                          Catat permohonan cuti, izin sakit, lembur, atau
                          koreksi presensi ke antrean HR.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Tutup modal input pengajuan"
                      className="rounded-xl border border-slate-200/90 bg-white/80 p-2 text-slate-500 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {/* Form */}
                  <form
                    onSubmit={handleSubmit}
                    className="mt-5 flex flex-col gap-4"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label
                          htmlFor="apr-emp"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Karyawan Pemohon
                        </Label>
                        <select
                          id="apr-emp"
                          value={employeeId}
                          onChange={(e) => setEmployeeId(e.target.value)}
                          className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
                        >
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.nip} — {emp.fullName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label
                          htmlFor="apr-cat"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Jenis Pengajuan
                        </Label>
                        <select
                          id="apr-cat"
                          value={category}
                          onChange={(e) =>
                            setCategory(e.target.value as ApprovalCategory)
                          }
                          className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
                        >
                          <option value="CUTI_TAHUNAN">Cuti Tahunan</option>
                          <option value="IZIN_SAKIT">Izin / Sakit</option>
                          <option value="KOREKSI_PRESENSI">
                            Koreksi Presensi
                          </option>
                          <option value="LEMBUR">Lembur Proyek</option>
                        </select>
                      </div>
                    </div>

                    {isDayBasedCategory ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <Label
                            htmlFor="apr-start"
                            className="text-xs font-semibold text-slate-700"
                          >
                            Tanggal Mulai
                          </Label>
                          <Input
                            id="apr-start"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border-slate-200/90 bg-white font-mono text-slate-900 tabular-nums"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <Label
                            htmlFor="apr-end"
                            className="text-xs font-semibold text-slate-700"
                          >
                            Tanggal Selesai
                          </Label>
                          <Input
                            id="apr-end"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border-slate-200/90 bg-white font-mono text-slate-900 tabular-nums"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <Label
                            htmlFor="apr-date-single"
                            className="text-xs font-semibold text-slate-700"
                          >
                            Tanggal Kejadian
                          </Label>
                          <Input
                            id="apr-date-single"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border-slate-200/90 bg-white font-mono text-slate-900 tabular-nums"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <Label
                            htmlFor="apr-custom-dur"
                            className="text-xs font-semibold text-slate-700"
                          >
                            Keterangan Waktu / Sesi
                          </Label>
                          <Input
                            id="apr-custom-dur"
                            value={customDuration}
                            onChange={(e) => setCustomDuration(e.target.value)}
                            placeholder="Contoh: 2.5 Jam Lembur"
                            className="border-slate-200/90 bg-white text-slate-900"
                          />
                        </div>
                      </div>
                    )}

                    {isDayBasedCategory && selectedEmployee && (
                      <div className="flex items-center justify-between rounded-xl border border-blue-200/80 bg-blue-50/70 px-3.5 py-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                          <CalendarClock className="size-3.5 text-blue-600" />
                          Durasi: <strong>{calculatedDays} Hari Kerja</strong>
                        </span>
                        <span className="font-mono font-bold text-blue-700">
                          Kuota Tersedia:{" "}
                          {selectedEmployee.remainingLeaveQuota} Hari
                        </span>
                      </div>
                    )}

                    {exceedsQuota && (
                      <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs text-orange-800">
                        <AlertTriangle className="size-4 shrink-0 text-orange-600" />
                        <span>
                          Durasi cuti melebihi sisa kuota tahunan karyawan ini.
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <Label
                        htmlFor="apr-reason"
                        className="text-xs font-semibold text-slate-700"
                      >
                        Alasan Pengajuan
                      </Label>
                      <Input
                        id="apr-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Tuliskan detail keperluan pengajuan..."
                        className="border-slate-200/90 bg-white text-slate-900"
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-end gap-2.5 border-t border-slate-200/80 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="border-slate-200/90 bg-white text-slate-700 hover:bg-slate-100"
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        className="bg-sulo-cta border-0 px-5 font-semibold text-white active:scale-[0.98]"
                      >
                        <Send data-icon="inline-start" />
                        Kirim ke Antrean Approval
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}