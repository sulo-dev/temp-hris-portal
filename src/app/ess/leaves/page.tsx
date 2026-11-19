// src/app/ess/leaves/page.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarCheck,
  CalendarDays,
  Clock3,
  CheckCircle2,
  XCircle,
  Paperclip,
  Send,
  ArrowLeft,
  AlertTriangle,
  Search,
  Info,
  UserCheck,
} from "lucide-react";
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
import {
  KineticCounter,
  LivePulseBeacon,
  MagneticAction,
  SULO_SPRING,
  SpatialBackdrop,
  WaterfallContainer,
  WaterfallItem,
} from "@/components/motion/motion-primitives";

const LEAVE_LABELS: Record<LeaveRequest["type"], string> = {
  CUTI_TAHUNAN: "Cuti Tahunan",
  IZIN_SAKIT: "Izin Sakit",
  CUTI_MELAHIRKAN: "Cuti Melahirkan",
  KLAIM_LEMBUR: "Klaim Lembur",
};

const LEAVE_DESCRIPTIONS: Record<LeaveRequest["type"], string> = {
  CUTI_TAHUNAN: "Memotong saldo kuota cuti tahunan karyawan",
  IZIN_SAKIT: "Tidak memotong kuota cuti (disarankan lampiran surat dokter)",
  CUTI_MELAHIRKAN: "Cuti khusus sesuai regulasi ketenagakerjaan",
  KLAIM_LEMBUR: "Pencatatan jam lembur proyek untuk komponen payroll",
};

const STATUS_FILTERS: {
  value: "ALL" | LeaveRequest["status"];
  label: string;
}[] = [
  { value: "ALL", label: "Semua" },
  { value: "PENDING", label: "Menunggu" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
];

export default function EssLeavesPage() {
  const { activeUserId, employees, leaves, submitLeaveRequest } =
    useSuloStore();

  const [type, setType] = useState<LeaveRequest["type"]>("CUTI_TAHUNAN");
  const [startDate, setStartDate] = useState("2026-12-01");
  const [endDate, setEndDate] = useState("2026-12-03");
  const [reason, setReason] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  // Filter riwayat pengajuan
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | LeaveRequest["status"]
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const currentUser = employees.find((e) => e.id === activeUserId);
  const annualQuota = currentUser?.annualLeaveQuota ?? 12;
  const remainingQuota = currentUser?.remainingLeaveQuota ?? 0;
  const usedQuota = Math.max(0, annualQuota - remainingQuota);

  const isInvalidDateRange = endDate < startDate;
  const previewDays = isInvalidDateRange
    ? 0
    : calculateEffectiveWorkingDays(startDate, endDate);

  const isQuotaExceeded =
    type === "CUTI_TAHUNAN" && previewDays > remainingQuota;

  const myLeaves = useMemo(() => {
    return leaves
      .filter((l) => l.employeeId === activeUserId)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [leaves, activeUserId]);

  const filteredLeaves = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return myLeaves.filter((lv) => {
      const matchStatus =
        statusFilter === "ALL" || lv.status === statusFilter;
      const matchQuery =
        q === "" ||
        LEAVE_LABELS[lv.type].toLowerCase().includes(q) ||
        lv.reason.toLowerCase().includes(q) ||
        lv.startDate.includes(q);
      return matchStatus && matchQuery;
    });
  }, [myLeaves, statusFilter, searchQuery]);

  const pendingCount = myLeaves.filter((l) => l.status === "PENDING").length;
  const approvedCount = myLeaves.filter((l) => l.status === "APPROVED").length;

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
    <div className="relative mx-auto flex max-w-[1400px] flex-col gap-6 px-4 pt-24 pb-12 sm:px-6 md:pt-28">
      <SpatialBackdrop />

      {/* Header Halaman dengan Jarak Aman dari Floating Topbar */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/70 pb-5">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-gradient-to-r from-white/90 via-blue-50/70 to-orange-50/80 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs">
            <LivePulseBeacon colorClass="bg-orange-500" />
            <span>
              Portal Mandiri Karyawan •{" "}
              <span className="text-blue-700">Manajemen Cuti &amp; Izin</span>
            </span>
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Pengajuan{" "}
            <span className="text-sulo-gradient">Cuti, Izin &amp; Lembur</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Ajukan permohonan ketidakhadiran atau klaim lembur dan pantau
            status otorisasi HR secara real-time.
          </p>
        </div>

        <Button
          render={<Link href="/ess/home" />}
          nativeButton={false}
          variant="outline"
          className="border-slate-200/90 bg-white/90 font-semibold text-slate-700 shadow-2xs hover:border-blue-300 hover:bg-blue-50/70 hover:text-blue-700"
        >
          <ArrowLeft data-icon="inline-start" />
          Kembali ke Beranda ESS
        </Button>
      </div>

      {/* 4 Kartu KPI Kuota & Pengajuan Cuti */}
      <WaterfallContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WaterfallItem>
          <div className="glass-sulo-orange relative overflow-hidden rounded-2xl p-4">
            <div className="bg-sulo-cta absolute inset-x-0 top-0 h-0.5" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Sisa Kuota Cuti Tahunan
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-orange-100/80 text-orange-600 ring-1 ring-orange-200/80">
                <CalendarDays className="size-4" />
              </div>
            </div>
            <p className="text-sulo-orange-gradient mt-2 text-2xl font-bold">
              <KineticCounter value={remainingQuota} suffix=" Hari" />
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              Dari total {annualQuota} hari hak cuti tahunan
            </p>
          </div>
        </WaterfallItem>

        <WaterfallItem>
          <div className="glass-sulo-card relative overflow-hidden rounded-2xl p-4">
            <div className="bg-sulo-blue-pill absolute inset-x-0 top-0 h-0.5 opacity-85" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Cuti Telah Terpakai
              </span>
              <div className="bg-sulo-blue-pill flex size-8 items-center justify-center rounded-xl text-white">
                <CalendarCheck className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              <KineticCounter value={usedQuota} suffix=" Hari" />
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Tercatat pada rekap absensi tahun 2026
            </p>
          </div>
        </WaterfallItem>

        <WaterfallItem>
          <div className="glass-sulo-card relative overflow-hidden rounded-2xl p-4">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-500 opacity-85" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Menunggu Review HR
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/80">
                <Clock3 className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              <KineticCounter value={pendingCount} suffix=" Tiket" />
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Sedang dalam antrean persetujuan
            </p>
          </div>
        </WaterfallItem>

        <WaterfallItem>
          <div className="glass-sulo-card relative overflow-hidden rounded-2xl p-4">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500 opacity-85" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Pengajuan Disetujui
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/80">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              <KineticCounter value={approvedCount} suffix=" Tiket" />
            </p>
            <p className="mt-0.5 text-xs font-medium text-emerald-700">
              Otorisasi sah terhubung ke payroll
            </p>
          </div>
        </WaterfallItem>
      </WaterfallContainer>

      {/* Grid Utama: Formulir Pengajuan (Kiri) & Riwayat Status (Kanan) */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Formulir Pengajuan Baru */}
        <form
          onSubmit={handleSubmit}
          className="glass-sulo-elevated relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-white/90 p-6 lg:col-span-5"
        >
          <div className="bg-sulo-dual-gradient absolute inset-x-0 top-0 h-1.5" />

          <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Formulir{" "}
                <span className="text-sulo-gradient">Pengajuan Baru</span>
              </h2>
              <p className="text-xs text-slate-500">
                Isi rincian tanggal dan keterangan keperluan Anda
              </p>
            </div>
            <Badge
              variant="outline"
              className="border-orange-300 bg-orange-50 font-mono text-xs font-bold text-orange-700 tabular-nums"
            >
              Sisa: {remainingQuota} Hari
            </Badge>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="leave-type"
              className="text-xs font-semibold text-slate-700"
            >
              Jenis Pengajuan
            </Label>
            <Select
              value={type}
              onValueChange={(val) => {
                if (val) setType(val as LeaveRequest["type"]);
              }}
            >
              <SelectTrigger
                id="leave-type"
                className="h-10 w-full border-slate-200/90 bg-white font-medium text-slate-900 shadow-2xs"
              >
                <SelectValue placeholder="Pilih jenis pengajuan" />
              </SelectTrigger>
              <SelectContent className="border-slate-200 bg-white text-slate-900">
                <SelectGroup>
                  <SelectItem value="CUTI_TAHUNAN">
                    Cuti Tahunan (Memotong Kuota)
                  </SelectItem>
                  <SelectItem value="IZIN_SAKIT">
                    Izin Sakit (Tidak Memotong Kuota)
                  </SelectItem>
                  <SelectItem value="CUTI_MELAHIRKAN">
                    Cuti Melahirkan
                  </SelectItem>
                  <SelectItem value="KLAIM_LEMBUR">Klaim Lembur</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
              <Info className="size-3.5 shrink-0 text-blue-600" />
              {LEAVE_DESCRIPTIONS[type]}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="leave-start"
                className="text-xs font-semibold text-slate-700"
              >
                Tanggal Mulai
              </Label>
              <Input
                id="leave-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-slate-200/90 bg-white font-mono text-slate-900 tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="leave-end"
                className="text-xs font-semibold text-slate-700"
              >
                Tanggal Selesai
              </Label>
              <Input
                id="leave-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-slate-200/90 bg-white font-mono text-slate-900 tabular-nums"
              />
            </div>
          </div>

          {/* Box Kalkulasi Hari Kerja Efektif */}
          <div
            className={`rounded-2xl border px-3.5 py-3 text-xs ${
              isInvalidDateRange || isQuotaExceeded
                ? "border-rose-200 bg-rose-50/90 text-rose-800"
                : "border-blue-200/80 bg-blue-50/75 text-slate-700"
            }`}
          >
            {isInvalidDateRange ? (
              <div className="flex items-center gap-2 font-semibold text-rose-700">
                <AlertTriangle className="size-4 shrink-0" />
                <span>
                  Tanggal selesai tidak boleh lebih awal dari tanggal mulai.
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Durasi Kerja Efektif:</span>
                  <span className="font-mono text-sm font-bold text-blue-700">
                    {previewDays} Hari Kerja
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Akhir pekan (Sabtu &amp; Minggu) otomatis dikecualikan dari
                  perhitungan.
                </p>
                {isQuotaExceeded && (
                  <div className="mt-2 flex items-start gap-1.5 border-t border-rose-200/80 pt-2 font-semibold text-rose-700">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      Durasi melebihi sisa kuota cuti tahunan Anda (
                      {remainingQuota} hari tersedia).
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="leave-reason"
              className="text-xs font-semibold text-slate-700"
            >
              Alasan Pengajuan
            </Label>
            <Textarea
              id="leave-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan keperluan cuti, izin, atau detail lembur Anda (minimal 10 karakter)..."
              className="border-slate-200/90 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="leave-attachment"
              className="text-xs font-semibold text-slate-700"
            >
              Nama Lampiran Dokumen (Opsional)
            </Label>
            <div className="relative">
              <Paperclip className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-400" />
              <Input
                id="leave-attachment"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="Contoh: surat-keterangan-dokter.pdf"
                className="border-slate-200/90 bg-white pl-9 text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <MagneticAction className="mt-1">
            <Button
              type="submit"
              disabled={isInvalidDateRange || isQuotaExceeded}
              className="bg-sulo-cta w-full border-0 py-5 font-semibold text-white active:scale-[0.99] disabled:opacity-50"
            >
              <Send data-icon="inline-start" />
              Kirim Pengajuan ke HR
            </Button>
          </MagneticAction>
        </form>

        {/* Riwayat & Pelacakan Status */}
        <div className="glass-sulo-card flex flex-col gap-4 rounded-3xl p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Riwayat &amp; Pelacakan Status
              </h2>
              <p className="text-xs text-slate-500">
                Pantau progres persetujuan pengajuan Anda oleh HR Manager
              </p>
            </div>
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50/80 font-mono text-xs font-semibold text-blue-700 tabular-nums"
            >
              {myLeaves.length} Pengajuan
            </Badge>
          </div>

          {/* Filter & Pencarian Riwayat */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[210px] flex-1">
              <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari jenis cuti, tanggal, atau alasan..."
                className="border-slate-200/90 bg-white/90 pl-9 text-xs text-slate-900 placeholder:text-slate-400"
              />
            </div>

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
          </div>

          {/* Daftar Kartu Riwayat */}
          <div className="flex flex-col gap-3">
            {filteredLeaves.length === 0 ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white/75 py-12 text-center">
                <p className="text-sm font-semibold text-slate-800">
                  {myLeaves.length === 0
                    ? "Belum ada riwayat pengajuan cuti atau izin."
                    : "Tidak ada pengajuan yang sesuai filter."}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {myLeaves.length === 0
                    ? "Gunakan formulir di samping untuk membuat pengajuan pertama Anda."
                    : "Coba ubah filter status atau kata kunci pencarian."}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredLeaves.map((lv) => (
                  <motion.div
                    key={lv.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={SULO_SPRING}
                    className="flex flex-col gap-2.5 rounded-2xl border border-slate-200/90 bg-white/85 p-4 text-sm shadow-2xs transition-colors hover:border-blue-300/80"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            lv.type === "CUTI_TAHUNAN"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : lv.type === "IZIN_SAKIT"
                                ? "border-amber-200 bg-amber-50 text-amber-800"
                                : lv.type === "KLAIM_LEMBUR"
                                  ? "border-orange-200 bg-orange-50 text-orange-700"
                                  : "border-sky-200 bg-sky-50 text-sky-700"
                          }`}
                        >
                          {LEAVE_LABELS[lv.type]}
                        </span>

                        <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                          {lv.startDate} s.d. {lv.endDate}
                        </span>

                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-700">
                          {lv.effectiveDays} Hari Kerja
                        </span>
                      </div>

                      {lv.status === "APPROVED" && (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"
                        >
                          <CheckCircle2 className="mr-1 size-3" />
                          Disetujui
                        </Badge>
                      )}
                      {lv.status === "PENDING" && (
                        <Badge
                          variant="outline"
                          className="border-orange-200 bg-orange-50 font-semibold text-orange-700"
                        >
                          <Clock3 className="mr-1 size-3" />
                          Menunggu Review
                        </Badge>
                      )}
                      {lv.status === "REJECTED" && (
                        <Badge
                          variant="outline"
                          className="border-rose-200 bg-rose-50 font-semibold text-rose-700"
                        >
                          <XCircle className="mr-1 size-3" />
                          Ditolak
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs leading-relaxed text-slate-700">
                      {lv.reason}
                    </p>

                    {(lv.attachmentName ||
                      lv.reviewedBy ||
                      lv.rejectionReason) && (
                      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200/70 pt-2 text-[11px]">
                        {lv.attachmentName && (
                          <span className="inline-flex items-center gap-1 font-mono font-medium text-blue-700">
                            <Paperclip className="size-3" />
                            {lv.attachmentName}
                          </span>
                        )}
                        {lv.reviewedBy && (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                            <UserCheck className="size-3 text-emerald-600" />
                            Ditinjau oleh: {lv.reviewedBy}
                          </span>
                        )}
                        {lv.rejectionReason && (
                          <span className="w-full rounded-lg border border-rose-200 bg-rose-50/80 px-2.5 py-1.5 font-medium text-rose-700">
                            Catatan Penolakan: {lv.rejectionReason}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}