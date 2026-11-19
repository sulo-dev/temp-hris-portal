// src/app/admin/approvals/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  RotateCcw,
  FileSpreadsheet,
  Eye,
  Check,
  X,
  CalendarClock,
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
import { DepartmentName, Employee } from "@/lib/types";
import {
  ApprovalCategory,
  ApprovalRequest,
  ApprovalStatus,
  buildInitialApprovals,
  formatShortDateIndo,
  getApprovalCategoryLabel,
} from "@/lib/approval-utils";
import { exportApprovalsToCsv } from "@/lib/export-utils";
import {
  AddApprovalModal,
  AddApprovalPayload,
} from "@/components/admin/add-approval-modal";
import { ApprovalReviewModal } from "@/components/admin/approval-review-modal";
import {
  KineticCounter,
  LivePulseBeacon,
  SULO_SPRING,
  WaterfallContainer,
  WaterfallItem,
} from "@/components/motion/motion-primitives";

const STATUS_TABS: { value: "ALL" | ApprovalStatus; label: string }[] = [
  { value: "ALL", label: "Semua Tiket" },
  { value: "PENDING", label: "Menunggu Review" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
];

const CATEGORY_FILTERS: { value: "ALL" | ApprovalCategory; label: string }[] = [
  { value: "ALL", label: "Semua Jenis" },
  { value: "CUTI_TAHUNAN", label: "Cuti Tahunan" },
  { value: "IZIN_SAKIT", label: "Izin / Sakit" },
  { value: "KOREKSI_PRESENSI", label: "Koreksi Presensi" },
  { value: "LEMBUR", label: "Lembur" },
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

export default function ApprovalsManagementPage() {
  const { employees, logSecurityEvent } = useSuloStore();

  const [requests, setRequests] = useState<ApprovalRequest[]>(() =>
    buildInitialApprovals(employees),
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ApprovalStatus>(
    "ALL",
  );
  const [categoryFilter, setCategoryFilter] = useState<
    "ALL" | ApprovalCategory
  >("ALL");

  // State Modal Peninjauan & Keputusan Tiket
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<ApprovalRequest | null>(
    null,
  );

  // Sinkronkan seed awal bila store terhidrasi belakangan
  useEffect(() => {
    if (requests.length === 0 && employees.length > 0) {
      setRequests(buildInitialApprovals(employees));
    }
  }, [employees, requests.length]);

  const enrichedRows = useMemo(() => {
    return requests
      .map((req) => {
        const emp = employees.find((e) => e.id === req.employeeId);
        if (!emp) return null;
        return { request: req, employee: emp };
      })
      .filter(
        (item): item is { request: ApprovalRequest; employee: Employee } =>
          item !== null,
      );
  }, [requests, employees]);

  const filteredRows = enrichedRows.filter(({ request, employee }) => {
    const q = search.trim().toLowerCase();
    const matchQuery =
      q === "" ||
      request.ticketCode.toLowerCase().includes(q) ||
      employee.fullName.toLowerCase().includes(q) ||
      employee.nip.toLowerCase().includes(q) ||
      employee.department.toLowerCase().includes(q) ||
      request.reason.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === "ALL" || request.status === statusFilter;
    const matchCategory =
      categoryFilter === "ALL" || request.category === categoryFilter;
    return matchQuery && matchStatus && matchCategory;
  });

  // Statistik KPI
  const pendingCount = enrichedRows.filter(
    (r) => r.request.status === "PENDING",
  ).length;
  const approvedCount = enrichedRows.filter(
    (r) => r.request.status === "APPROVED",
  ).length;
  const rejectedCount = enrichedRows.filter(
    (r) => r.request.status === "REJECTED",
  ).length;
  const pendingLeaveDays = enrichedRows
    .filter(
      (r) =>
        r.request.status === "PENDING" &&
        r.request.category === "CUTI_TAHUNAN",
    )
    .reduce((acc, cur) => acc + cur.request.durationDays, 0);

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "ALL" ||
    categoryFilter !== "ALL";

  function handleResetFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
  }

  function openReviewModal(req: ApprovalRequest) {
    setActiveRequest(req);
    setReviewModalOpen(true);
  }

  function handleDecision(
    requestId: string,
    decision: Exclude<ApprovalStatus, "PENDING">,
    reviewerNote: string,
  ) {
    const targetRow = enrichedRows.find((r) => r.request.id === requestId);
    if (!targetRow) return;

    setRequests((prev) =>
      prev.map((item) =>
        item.id === requestId
          ? { ...item, status: decision, reviewerNote }
          : item,
      ),
    );

    const actionLabel = decision === "APPROVED" ? "MENYETUJUI" : "MENOLAK";
    logSecurityEvent(
      decision === "APPROVED" ? "APPROVAL_GRANTED" : "APPROVAL_REJECTED",
      decision === "APPROVED" ? "INFO" : "WARNING",
      `${actionLabel} tiket ${targetRow.request.ticketCode} (${getApprovalCategoryLabel(targetRow.request.category)}) atas nama ${targetRow.employee.fullName} (${targetRow.employee.nip}).`,
    );

    if (decision === "APPROVED") {
      toast.success(
        `Tiket ${targetRow.request.ticketCode} (${targetRow.employee.fullName}) disetujui.`,
      );
    } else {
      toast.info(
        `Tiket ${targetRow.request.ticketCode} (${targetRow.employee.fullName}) ditolak.`,
      );
    }
  }

  function handleAddRequest(payload: AddApprovalPayload) {
    const emp = employees.find((e) => e.id === payload.employeeId);
    if (!emp) return;

    const nextSeq = requests.length + 1;
    const ticketCode = `APR-2611-${String(nextSeq).padStart(3, "0")}`;
    const newReq: ApprovalRequest = {
      ...payload,
      id: `apr-${Date.now()}`,
      ticketCode,
      submittedAt: "19 Nov 2026 • Baru Saja",
      status: "PENDING",
    };

    setRequests((prev) => [newReq, ...prev]);

    logSecurityEvent(
      "APPROVAL_SUBMITTED",
      "INFO",
      `Menambahkan pengajuan ${ticketCode} (${getApprovalCategoryLabel(payload.category)}) untuk ${emp.fullName} (${emp.nip}).`,
    );
    toast.success(`Pengajuan ${ticketCode} ditambahkan ke antrean approval.`);
  }

  function handleExportCsv() {
    if (filteredRows.length === 0) {
      toast.warning("Tidak ada tiket persetujuan pada filter aktif.");
      return;
    }

    const filename = exportApprovalsToCsv(filteredRows, statusFilter);
    logSecurityEvent(
      "APPROVAL_CSV_EXPORT",
      "INFO",
      `Mengekspor ${filteredRows.length} tiket persetujuan ke ${filename}.`,
    );
    toast.success(`Laporan approval diunduh: ${filename}`);
  }

  const activeModalEmployee = activeRequest
    ? employees.find((e) => e.id === activeRequest.employeeId) ?? null
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Halaman */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-gradient-to-r from-white/90 via-blue-50/70 to-orange-50/80 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs">
            <LivePulseBeacon colorClass="bg-orange-500" />
            <span>
              Workflow Otorisasi HR •{" "}
              <span className="text-orange-600">
                {pendingCount} Antrean Aktif
              </span>
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Pusat{" "}
            <span className="text-sulo-gradient">Persetujuan &amp; Cuti</span>
          </h1>
          <p className="text-sm text-slate-600">
            Validasi pengajuan cuti tahunan, izin sakit, lembur proyek, dan
            koreksi log presensi karyawan.
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

          <AddApprovalModal
            employees={employees}
            onAddRequest={handleAddRequest}
          />
        </div>
      </div>

      {/* 4 KPI Strip */}
      <WaterfallContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WaterfallItem>
          <div className="glass-sulo-orange relative overflow-hidden rounded-2xl p-4">
            <div className="bg-sulo-cta absolute inset-x-0 top-0 h-0.5" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Menunggu Keputusan
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-orange-100/80 text-orange-600 ring-1 ring-orange-200/80">
                <Clock className="size-4" />
              </div>
            </div>
            <p className="text-sulo-orange-gradient mt-2 text-2xl font-bold">
              <KineticCounter value={pendingCount} suffix=" Tiket" />
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              {pendingLeaveDays > 0
                ? `Mencakup ${pendingLeaveDays} hari pengajuan cuti`
                : "Semua tiket cuti telah ditinjau"}
            </p>
          </div>
        </WaterfallItem>

        <WaterfallItem>
          <div className="glass-sulo-card relative overflow-hidden rounded-2xl p-4">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500 opacity-85" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Tiket Disetujui
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/80">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              <KineticCounter value={approvedCount} suffix=" Tiket" />
            </p>
            <p className="mt-0.5 text-xs font-medium text-emerald-700">
              Tercatat sah pada rekap payroll
            </p>
          </div>
        </WaterfallItem>

        <WaterfallItem>
          <div className="glass-sulo-card relative overflow-hidden rounded-2xl p-4">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-rose-500 opacity-80" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Tiket Ditolak
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200/80">
                <XCircle className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              <KineticCounter value={rejectedCount} suffix=" Tiket" />
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Disertai catatan alasan penolakan
            </p>
          </div>
        </WaterfallItem>

        <WaterfallItem>
          <div className="glass-sulo-card relative overflow-hidden rounded-2xl p-4">
            <div className="bg-sulo-blue-pill absolute inset-x-0 top-0 h-0.5 opacity-85" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Total Permohonan Masuk
              </span>
              <div className="bg-sulo-blue-pill flex size-8 items-center justify-center rounded-xl text-white">
                <ClipboardCheck className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              <KineticCounter value={enrichedRows.length} suffix=" Tiket" />
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Periode administrasi November 2026
            </p>
          </div>
        </WaterfallItem>
      </WaterfallContainer>

      {/* Filter Bar */}
      <div className="glass-sulo-card flex flex-col gap-3.5 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute top-2.5 left-3.5 size-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode tiket, nama pemohon, NIP, atau alasan..."
              className="border-slate-200/90 bg-white/90 pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-500"
            />
          </div>

          {/* Filter Status Tiket */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1">
            {STATUS_TABS.map((tab) => {
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

        {/* Filter Kategori Pengajuan */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-200/70 pt-3">
          <span className="mr-1.5 text-xs font-semibold text-slate-500">
            Kategori:
          </span>
          {CATEGORY_FILTERS.map((cat) => {
            const isActive = categoryFilter === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategoryFilter(cat.value)}
                className="relative rounded-full px-3 py-1 text-xs font-semibold transition-colors"
              >
                {isActive && (
                  <motion.span
                    layoutId="approval-category-pill"
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
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabel Antrean Approval */}
      <div className="glass-sulo-card overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100/75">
              <TableRow className="border-slate-200/90 hover:bg-transparent">
                <TableHead className="font-semibold text-slate-700">
                  Tiket &amp; Pemohon
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Jenis Pengajuan
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Jadwal &amp; Durasi
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Keterangan
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Status
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700">
                  Keputusan HR
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow className="border-slate-200/80 hover:bg-transparent">
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">
                        Tidak ada tiket persetujuan yang sesuai filter
                      </p>
                      <p className="text-xs text-slate-500">
                        Coba ubah kata kunci pencarian atau tampilkan semua
                        status tiket.
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
                          Tampilkan Semua Tiket
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map(({ request, employee }) => {
                  const deptStyle = DEPT_BADGE_STYLES[employee.department];
                  const isPending = request.status === "PENDING";

                  return (
                    <TableRow
                      key={request.id}
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
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-blue-700">
                                {request.ticketCode}
                              </span>
                              <span className="text-slate-300">•</span>
                              <Link
                                href={`/admin/employees/${employee.id}`}
                                className="font-semibold text-slate-900 transition-colors group-hover:text-blue-700 hover:underline"
                              >
                                {employee.fullName}
                              </Link>
                            </div>
                            <span className="text-xs text-slate-500">
                              {employee.department} • Sisa cuti:{" "}
                              <strong className="font-mono text-slate-700">
                                {employee.remainingLeaveQuota}h
                              </strong>
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            request.category === "CUTI_TAHUNAN"
                              ? "border-blue-200/80 bg-blue-50/80 text-blue-700"
                              : request.category === "IZIN_SAKIT"
                                ? "border-amber-200/80 bg-amber-50/80 text-amber-800"
                                : request.category === "LEMBUR"
                                  ? "border-orange-200/80 bg-orange-50/80 text-orange-700"
                                  : "border-sky-200/80 bg-sky-50/80 text-sky-700"
                          }`}
                        >
                          {getApprovalCategoryLabel(request.category)}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-slate-800">
                            {request.startDate === request.endDate
                              ? formatShortDateIndo(request.startDate)
                              : `${formatShortDateIndo(request.startDate)} – ${formatShortDateIndo(request.endDate)}`}
                          </span>
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-slate-500">
                            <CalendarClock className="size-3 text-slate-400" />
                            {request.durationLabel}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="max-w-xs">
                        <p
                          className="line-clamp-2 text-xs text-slate-700"
                          title={request.reason}
                        >
                          {request.reason}
                        </p>
                      </TableCell>

                      <TableCell>
                        {request.status === "PENDING" && (
                          <Badge
                            variant="outline"
                            className="border-orange-200 bg-orange-50 font-semibold text-orange-700"
                          >
                            <Clock className="mr-1 size-3" />
                            Menunggu
                          </Badge>
                        )}
                        {request.status === "APPROVED" && (
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"
                          >
                            <CheckCircle2 className="mr-1 size-3" />
                            Disetujui
                          </Badge>
                        )}
                        {request.status === "REJECTED" && (
                          <Badge
                            variant="outline"
                            className="border-rose-200 bg-rose-50 font-semibold text-rose-700"
                          >
                            <XCircle className="mr-1 size-3" />
                            Ditolak
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleDecision(
                                    request.id,
                                    "APPROVED",
                                    "Disetujui cepat oleh HR Admin.",
                                  )
                                }
                                title="Setujui Cepat"
                                className="h-7 border-emerald-200 bg-emerald-50/80 px-2 text-emerald-700 hover:bg-emerald-100"
                              >
                                <Check className="size-3.5" />
                              </Button>

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => openReviewModal(request)}
                                title="Tolak dengan Alasan"
                                className="h-7 border-rose-200 bg-rose-50/80 px-2 text-rose-700 hover:bg-rose-100"
                              >
                                <X className="size-3.5" />
                              </Button>
                            </>
                          )}

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openReviewModal(request)}
                            className="h-7 border-slate-200/90 bg-white/90 px-2.5 text-[11px] font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Eye className="mr-1 size-3" />
                            {isPending ? "Tinjau" : "Detail"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Peninjauan & Keputusan Tiket */}
      <ApprovalReviewModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        request={activeRequest}
        targetEmployee={activeModalEmployee}
        onDecision={handleDecision}
      />
    </div>
  );
}