// src/components/admin/attendance-correction-modal.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShieldCheck,
  X,
  Clock,
  CheckCircle2,
  CalendarOff,
  Laptop,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Employee } from "@/lib/types";
import {
  AttendanceRecord,
  AttendanceStatus,
  WorkMode,
  getLateMinutes,
  resolveLocationLabel,
} from "@/lib/attendance-utils";
import { SULO_SPRING } from "@/components/motion/motion-primitives";

interface AttendanceCorrectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  selectedDate: string;
  targetEmployee: Employee | null;
  existingRecord?: AttendanceRecord;
  onSave: (employee: Employee, updatedRecord: AttendanceRecord) => void;
}

export function AttendanceCorrectionModal({
  open,
  onOpenChange,
  employees,
  selectedDate,
  targetEmployee,
  existingRecord,
  onSave,
}: AttendanceCorrectionModalProps) {
  const [mounted, setMounted] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("WFO");
  const [status, setStatus] = useState<AttendanceStatus>("TEPAT_WAKTU");
  const [checkIn, setCheckIn] = useState("08:15");
  const [checkOut, setCheckOut] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sinkronkan nilai form saat modal dibuka untuk karyawan tertentu
  useEffect(() => {
    if (!open) return;
    const initialEmp = targetEmployee ?? employees[0];
    setEmployeeId(initialEmp?.id ?? "");
    setWorkMode(existingRecord?.workMode ?? "WFO");
    setStatus(existingRecord?.status ?? "TEPAT_WAKTU");
    setCheckIn(existingRecord?.checkIn ?? "08:15");
    setCheckOut(existingRecord?.checkOut ?? "");
    setNotes(existingRecord?.notes ?? "");
  }, [open, targetEmployee, existingRecord, employees]);

  // Kunci scroll latar & dukung tombol Escape saat modal terbuka
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  // Pratinjau status otomatis berdasarkan jam masuk & mode kerja
  const previewLateMins =
    status !== "IZIN_CUTI" && workMode !== "WFH"
      ? getLateMinutes(checkIn)
      : 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const targetEmp = employees.find((emp) => emp.id === employeeId);
    if (!targetEmp) {
      toast.error("Pilih karyawan terlebih dahulu.");
      return;
    }

    const isLeave = status === "IZIN_CUTI";
    const normalizedIn = isLeave ? null : checkIn.trim() || "08:15";
    const normalizedOut = isLeave ? null : checkOut.trim() || null;

    if (!isLeave && normalizedIn && normalizedOut && normalizedOut <= normalizedIn) {
      toast.error("Jam pulang harus lebih akhir daripada jam masuk.");
      return;
    }

    let resolvedStatus: AttendanceStatus = status;
    if (!isLeave && workMode !== "WFH" && normalizedIn) {
      resolvedStatus =
        getLateMinutes(normalizedIn) > 0 ? "TERLAMBAT" : "TEPAT_WAKTU";
    } else if (!isLeave && workMode === "WFH") {
      resolvedStatus = "WFH";
    }

    const updatedRecord: AttendanceRecord = {
      id: `att-${targetEmp.id}-${selectedDate}`,
      employeeId: targetEmp.id,
      date: selectedDate,
      checkIn: normalizedIn,
      checkOut: normalizedOut,
      workMode,
      location: resolveLocationLabel(resolvedStatus, workMode),
      status: resolvedStatus,
      notes: notes.trim() || "Koreksi manual oleh HR Admin",
    };

    onSave(targetEmp, updatedRecord);
    onOpenChange(false);
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="attendance-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
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
                    id="attendance-modal-title"
                    className="font-display text-lg font-bold text-slate-900"
                  >
                    Catat &amp;{" "}
                    <span className="text-sulo-gradient">
                      Koreksi Presensi
                    </span>
                  </h2>
                  <p className="text-xs text-slate-600">
                    Tanggal log:{" "}
                    <strong className="font-mono text-slate-800">
                      {selectedDate}
                    </strong>{" "}
                    • Perubahan tercatat di Security Audit Log.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Tutup modal presensi"
                className="rounded-xl border border-slate-200/90 bg-white/80 p-2 text-slate-500 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="att-employee"
                  className="text-xs font-semibold text-slate-700"
                >
                  Karyawan
                </Label>
                <select
                  id="att-employee"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nip} — {emp.fullName} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="att-mode"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Mode Kerja
                  </Label>
                  <select
                    id="att-mode"
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                    className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
                  >
                    <option value="WFO">WFO (Makassar HQ)</option>
                    <option value="WFH">WFH (Remote Verified)</option>
                    <option value="DINAS_LUAR">Dinas Luar Kota</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="att-status"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Kategori Kehadiran
                  </Label>
                  <select
                    id="att-status"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as AttendanceStatus)
                    }
                    className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
                  >
                    <option value="TEPAT_WAKTU">Hadir Reguler</option>
                    <option value="TERLAMBAT">Terlambat</option>
                    <option value="WFH">Remote WFH</option>
                    <option value="IZIN_CUTI">Izin / Cuti</option>
                  </select>
                </div>
              </div>

              {status !== "IZIN_CUTI" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="att-checkin"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Jam Masuk (WITA)
                    </Label>
                    <Input
                      id="att-checkin"
                      type="time"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="border-slate-200/90 bg-white font-mono text-slate-900 tabular-nums"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="att-checkout"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Jam Pulang (Opsional)
                    </Label>
                    <Input
                      id="att-checkout"
                      type="time"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="border-slate-200/90 bg-white font-mono text-slate-900 tabular-nums"
                    />
                  </div>
                </div>
              )}

              {/* Indikator Evaluasi Status Otomatis */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/85 px-3.5 py-2.5 text-xs">
                <span className="font-medium text-slate-600">
                  Hasil Evaluasi Shift (08:30 WITA):
                </span>
                {status === "IZIN_CUTI" ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                    <CalendarOff className="size-3.5" />
                    Izin / Cuti Terjadwal
                  </span>
                ) : workMode === "WFH" ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-sky-700">
                    <Laptop className="size-3.5" />
                    Remote WFH Verified
                  </span>
                ) : previewLateMins > 0 ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600">
                    <Clock className="size-3.5" />
                    Terlambat (+{previewLateMins} menit)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                    <CheckCircle2 className="size-3.5" />
                    Tepat Waktu
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="att-notes"
                  className="text-xs font-semibold text-slate-700"
                >
                  Catatan Audit / Alasan Koreksi
                </Label>
                <Input
                  id="att-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Lupa tap pulang saat meeting klien"
                  className="border-slate-200/90 bg-white text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-2.5 border-t border-slate-200/80 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-slate-200/90 bg-white text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-sulo-cta border-0 px-5 font-semibold text-white active:scale-[0.98]"
                >
                  Simpan &amp; Catat Audit
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}