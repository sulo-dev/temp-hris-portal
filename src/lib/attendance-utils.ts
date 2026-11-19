// src/lib/attendance-utils.ts
import { Employee } from "@/lib/types";

export type AttendanceStatus =
  | "TEPAT_WAKTU"
  | "TERLAMBAT"
  | "WFH"
  | "IZIN_CUTI";

export type WorkMode = "WFO" | "WFH" | "DINAS_LUAR";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null; // Format "HH:mm"
  checkOut: string | null; // Format "HH:mm"
  workMode: WorkMode;
  location: string;
  status: AttendanceStatus;
  notes: string;
}

export const STANDARD_START_MINUTES = 8 * 60 + 30; // 08:30 WITA
export const DEFAULT_ATTENDANCE_DATE = "2026-11-19";

export function parseTimeToMinutes(timeStr: string | null): number | null {
  if (!timeStr || !timeStr.includes(":")) return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

export function getLateMinutes(checkIn: string | null): number {
  const mins = parseTimeToMinutes(checkIn);
  if (mins === null) return 0;
  return Math.max(0, mins - STANDARD_START_MINUTES);
}

export function formatWorkDuration(
  checkIn: string | null,
  checkOut: string | null,
): string {
  const start = parseTimeToMinutes(checkIn);
  if (start === null) return "—";
  if (!checkOut) return "Sedang Bekerja";
  const end = parseTimeToMinutes(checkOut);
  if (end === null || end <= start) return "—";
  const diff = end - start;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  return `${hours}j${String(minutes).padStart(2, "0")}m`;
}

export function resolveLocationLabel(
  status: AttendanceStatus,
  workMode: WorkMode,
): string {
  if (status === "IZIN_CUTI") return "Izin / Cuti Terjadwal";
  if (workMode === "WFH") return "Remote Verified • IP Whitelist";
  if (workMode === "DINAS_LUAR") return "Dinas Luar Kota • GPS Verified";
  return "Makassar HQ • Geo-Fence OK";
}

/**
 * Seed data presensi deterministik dari daftar karyawan (konsisten SSR & Client)
 */
export function buildInitialAttendance(
  employees: Employee[],
  date: string,
): AttendanceRecord[] {
  const presets: {
    checkIn: string | null;
    checkOut: string | null;
    workMode: WorkMode;
    location: string;
    status: AttendanceStatus;
    notes: string;
  }[] = [
    {
      checkIn: "08:06",
      checkOut: null,
      workMode: "WFO",
      location: "Makassar HQ • Geo-Fence OK",
      status: "TEPAT_WAKTU",
      notes: "Tap biometrik pagi",
    },
    {
      checkIn: "08:19",
      checkOut: null,
      workMode: "WFO",
      location: "Makassar HQ • Geo-Fence OK",
      status: "TEPAT_WAKTU",
      notes: "Standup pagi divisi",
    },
    {
      checkIn: "08:47",
      checkOut: null,
      workMode: "WFO",
      location: "Makassar HQ • Geo-Fence OK",
      status: "TERLAMBAT",
      notes: "Terlambat 17 menit (lalu lintas)",
    },
    {
      checkIn: "08:12",
      checkOut: null,
      workMode: "WFH",
      location: "Remote Verified • IP Whitelist",
      status: "WFH",
      notes: "Jadwal hybrid sprint",
    },
    {
      checkIn: "08:25",
      checkOut: null,
      workMode: "WFO",
      location: "Makassar HQ • Geo-Fence OK",
      status: "TEPAT_WAKTU",
      notes: "Hadir reguler",
    },
    {
      checkIn: null,
      checkOut: null,
      workMode: "WFH",
      location: "Izin Terjadwal",
      status: "IZIN_CUTI",
      notes: "Cuti tahunan disetujui HR",
    },
  ];

  return employees.map((emp, idx) => {
    const preset = presets[idx % presets.length];
    return {
      id: `att-${emp.id}-${date}`,
      employeeId: emp.id,
      date,
      ...preset,
    };
  });
}