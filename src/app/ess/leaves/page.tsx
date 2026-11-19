// src/app/ess/leaves/page.tsx
"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSuloStore } from "@/store/use-sulo-store";
import { calculateEffectiveWorkingDays } from "@/lib/business-rules";
import { createLeaveSchema } from "@/lib/schemas";
import { LeaveRequest } from "@/lib/types";

const LEAVE_LABELS: Record<LeaveRequest["type"], string> = {
  CUTI_TAHUNAN: "Cuti Tahunan (Memotong Kuota)",
  IZIN_SAKIT: "Izin Sakit (Tidak Memotong Kuota)",
  CUTI_MELAHIRKAN: "Cuti Melahirkan",
  KLAIM_LEMBUR: "Klaim Lembur",
};

export default function EssLeavesPage() {
  const { activeUserId, employees, leaves, submitLeaveRequest } =
    useSuloStore();
  const [type, setType] = useState<LeaveRequest["type"]>("CUTI_TAHUNAN");
  const [startDate, setStartDate] = useState("2026-12-01");
  const [endDate, setEndDate] = useState("2026-12-03");
  const [reason, setReason] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  const currentUser = employees.find((e) => e.id === activeUserId);
  const remainingQuota = currentUser?.remainingLeaveQuota ?? 0;
  const previewDays = calculateEffectiveWorkingDays(startDate, endDate);
  const myLeaves = leaves.filter((l) => l.employeeId === activeUserId);

  const isQuotaExceeded =
    type === "CUTI_TAHUNAN" && previewDays > remainingQuota;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createLeaveSchema.safeParse({
      type,
      startDate,
      endDate,
      reason,
      attachmentName: attachmentName.trim() || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Form tidak valid.");
      return;
    }

    const res = submitLeaveRequest(parsed.data);
    if (res.ok) {
      toast.success(res.message);
      setReason("");
      setAttachmentName("");
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12">
      <form
        onSubmit={handleSubmit}
        className="glass-sulo-card flex flex-col gap-4 rounded-2xl p-6 lg:col-span-5"
      >
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-display text-xl font-bold text-white">
            Formulir Pengajuan Cuti & Izin
          </h1>
          <Badge
            variant="outline"
            className="border-[#FF9F03]/40 font-mono text-xs text-[#FF9F03] tabular-nums"
          >
            Kuota: {remainingQuota} Hari
          </Badge>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="leave-type">Jenis Pengajuan</Label>
          <Select
            value={type}
            onValueChange={(val) => {
              if (val) setType(val as LeaveRequest["type"]);
            }}
          >
            <SelectTrigger
              id="leave-type"
              className="w-full border-white/15 bg-[#020E2B] text-white"
            >
              <SelectValue placeholder="Pilih jenis pengajuan" />
            </SelectTrigger>
            <SelectContent className="glass-sulo-elevated border-white/15 text-white">
              <SelectGroup>
                <SelectItem value="CUTI_TAHUNAN">
                  Cuti Tahunan (Memotong Kuota)
                </SelectItem>
                <SelectItem value="IZIN_SAKIT">
                  Izin Sakit (Tidak Memotong Kuota)
                </SelectItem>
                <SelectItem value="CUTI_MELAHIRKAN">Cuti Melahirkan</SelectItem>
                <SelectItem value="KLAIM_LEMBUR">Klaim Lembur</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="leave-start">Tanggal Mulai</Label>
            <Input
              id="leave-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-white/15 bg-[#020E2B] font-mono text-white"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="leave-end">Tanggal Selesai</Label>
            <Input
              id="leave-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-white/15 bg-[#020E2B] font-mono text-white"
            />
          </div>
        </div>

        <div
          className={`rounded-xl border px-3.5 py-2.5 text-xs ${
            isQuotaExceeded
              ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
              : "border-[#FF9F03]/30 bg-[#FF9F03]/10 text-[#FF9F03]"
          }`}
        >
          Kalkulasi Otomatis: <strong>{previewDays} hari kerja efektif</strong>{" "}
          (Sabtu & Minggu dikecualikan).
          {isQuotaExceeded && (
            <span className="mt-1 block font-medium">
              Peringatan: Melebihi sisa kuota cuti tahunan Anda (
              {remainingQuota} hari).
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="leave-reason">Alasan Pengajuan</Label>
          <Textarea
            id="leave-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Jelaskan keperluan cuti atau izin Anda (minimal 10 karakter)..."
            className="border-white/15 bg-[#020E2B] text-white"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="leave-attachment">
            Nama Lampiran Dokumen (Opsional)
          </Label>
          <div className="relative">
            <Paperclip className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-400" />
            <Input
              id="leave-attachment"
              value={attachmentName}
              onChange={(e) => setAttachmentName(e.target.value)}
              placeholder="Contoh: surat-keterangan-dokter.pdf"
              className="border-white/15 bg-[#020E2B] pl-9 text-white"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isQuotaExceeded}
          className="bg-sulo-cta border-0 text-white"
        >
          Kirim Pengajuan
        </Button>
      </form>

      <div className="glass-sulo-card flex flex-col gap-3 rounded-2xl p-6 lg:col-span-7">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">
            Riwayat & Pelacakan Status
          </h2>
          <span className="font-mono text-xs text-slate-400 tabular-nums">
            {myLeaves.length} Pengajuan
          </span>
        </div>

        {myLeaves.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-[#020E2B]/50 py-10 text-center text-sm text-slate-400">
            Belum ada riwayat pengajuan cuti atau izin.
          </p>
        ) : (
          myLeaves.map((lv) => (
            <div
              key={lv.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/10 bg-[#020E2B]/60 p-4 text-sm"
            >
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-white">
                  {LEAVE_LABELS[lv.type]} •{" "}
                  <span className="font-mono text-xs text-[#FF9F03] tabular-nums">
                    {lv.startDate} s.d. {lv.endDate} ({lv.effectiveDays} hari)
                  </span>
                </p>
                <p className="text-xs text-slate-300">{lv.reason}</p>
                {lv.attachmentName && (
                  <p className="font-mono text-[11px] text-sky-400">
                    Lampiran: {lv.attachmentName}
                  </p>
                )}
                {lv.reviewedBy && (
                  <p className="font-mono text-[11px] text-slate-400">
                    Ditinjau oleh: {lv.reviewedBy}
                  </p>
                )}
                {lv.rejectionReason && (
                  <p className="mt-1 text-xs text-rose-400">
                    Catatan Penolakan: {lv.rejectionReason}
                  </p>
                )}
              </div>
              <Badge
                className={
                  lv.status === "APPROVED"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : lv.status === "REJECTED"
                      ? "bg-rose-500/20 text-rose-300"
                      : "bg-amber-500/20 text-amber-300"
                }
              >
                {lv.status}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
