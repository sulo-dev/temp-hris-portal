// src/lib/approval-utils.ts
import { Employee } from "@/lib/types";

export type ApprovalCategory =
  | "CUTI_TAHUNAN"
  | "IZIN_SAKIT"
  | "KOREKSI_PRESENSI"
  | "LEMBUR";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ApprovalRequest {
  id: string;
  ticketCode: string;
  employeeId: string;
  category: ApprovalCategory;
  startDate: string;
  endDate: string;
  durationDays: number; // 0 untuk koreksi presensi / lembur jam
  durationLabel: string;
  reason: string;
  submittedAt: string;
  status: ApprovalStatus;
  reviewerNote?: string;
}

export function getApprovalCategoryLabel(category: ApprovalCategory): string {
  switch (category) {
    case "CUTI_TAHUNAN":
      return "Cuti Tahunan";
    case "IZIN_SAKIT":
      return "Izin / Sakit";
    case "KOREKSI_PRESENSI":
      return "Koreksi Presensi";
    case "LEMBUR":
      return "Lembur Proyek";
    default:
      return category;
  }
}

export function calculateInclusiveDays(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return 1;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export function formatShortDateIndo(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Seed daftar pengajuan deterministik berbasis daftar karyawan (konsisten SSR & Client)
 */
export function buildInitialApprovals(employees: Employee[]): ApprovalRequest[] {
  if (employees.length === 0) return [];

  const templates: {
    category: ApprovalCategory;
    startDate: string;
    endDate: string;
    durationDays: number;
    durationLabel: string;
    reason: string;
    submittedAt: string;
    status: ApprovalStatus;
    reviewerNote?: string;
  }[] = [
    {
      category: "CUTI_TAHUNAN",
      startDate: "2026-11-23",
      endDate: "2026-11-25",
      durationDays: 3,
      durationLabel: "3 Hari Kerja",
      reason: "Keperluan acara keluarga di luar kota, handover sprint sudah disiapkan.",
      submittedAt: "19 Nov 2026 • 09:14 WITA",
      status: "PENDING",
    },
    {
      category: "KOREKSI_PRESENSI",
      startDate: "2026-11-18",
      endDate: "2026-11-18",
      durationDays: 0,
      durationLabel: "Tap Pulang 18:10",
      reason: "Lupa melakukan tap out sore karena mendampingi audit vendor eksternal.",
      submittedAt: "19 Nov 2026 • 08:42 WITA",
      status: "PENDING",
    },
    {
      category: "LEMBUR",
      startDate: "2026-11-18",
      endDate: "2026-11-18",
      durationDays: 0,
      durationLabel: "3.5 Jam Lembur",
      reason: "Deploy rilis sistem keamanan UU PDP dan migrasi database produksi.",
      submittedAt: "19 Nov 2026 • 07:55 WITA",
      status: "PENDING",
    },
    {
      category: "IZIN_SAKIT",
      startDate: "2026-11-19",
      endDate: "2026-11-20",
      durationDays: 2,
      durationLabel: "2 Hari (Surat Dokter)",
      reason: "Pemulihan demam dengan melampirkan surat keterangan dokter klinik.",
      submittedAt: "19 Nov 2026 • 07:10 WITA",
      status: "APPROVED",
      reviewerNote: "Disetujui HR — Surat keterangan dokter terverifikasi.",
    },
    {
      category: "CUTI_TAHUNAN",
      startDate: "2026-12-01",
      endDate: "2026-12-02",
      durationDays: 2,
      durationLabel: "2 Hari Kerja",
      reason: "Pengurusan administrasi dokumen pribadi.",
      submittedAt: "18 Nov 2026 • 16:20 WITA",
      status: "PENDING",
    },
    {
      category: "CUTI_TAHUNAN",
      startDate: "2026-11-14",
      endDate: "2026-11-14",
      durationDays: 1,
      durationLabel: "1 Hari Kerja",
      reason: "Pengajuan mendadak pada hari penutupan laporan bulanan divisi.",
      submittedAt: "13 Nov 2026 • 17:45 WITA",
      status: "REJECTED",
      reviewerNote: "Mohon dijadwalkan ulang setelah closing bulanan selesai.",
    },
  ];

  return templates.map((tpl, idx) => {
    const emp = employees[idx % employees.length];
    return {
      id: `apr-${202601 + idx}`,
      ticketCode: `APR-2611-${String(idx + 1).padStart(3, "0")}`,
      employeeId: emp.id,
      ...tpl,
    };
  });
}