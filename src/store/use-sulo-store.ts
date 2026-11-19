// src/store/use-sulo-store.ts
"use client";

import { create } from "zustand";
import {
  AttendanceRecord,
  Employee,
  LeaveRequest,
  PayrollItem,
  SecurityAuditEntry,
  UserRole,
  WorkMode,
} from "@/lib/types";
import {
  generateInitialAuditLogs,
  generateSeedAttendance,
  generateSeedEmployees,
  generateSeedLeaves,
  generateSeedPayrolls,
} from "@/lib/seed-data";
import {
  calculateEffectiveWorkingDays,
  computeEmployeePayroll,
  evaluateClockIn,
} from "@/lib/business-rules";
import { computeVaultChecksum } from "@/lib/security-utils";

const STORAGE_KEY = "sulohris_vault_v3";

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface SuloState {
  initialized: boolean;
  activeRole: UserRole;
  activeUserId: string; // "emp-001" (Rina Kusuma) | "emp-002" (Dimas Pratama)
  privacyShield: boolean;
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  payrolls: PayrollItem[];
  auditLogs: SecurityAuditEntry[];

  initVault: () => void;
  switchRole: (role: UserRole) => void;
  togglePrivacyShield: () => void;
  logSecurityEvent: (
    action: string,
    severity: "INFO" | "WARNING" | "CRITICAL",
    details: string,
  ) => void;

  // Aksi HR Admin (Dilindungi Action-Level RBAC)
  addEmployee: (
    payload: Omit<
      Employee,
      "id" | "nip" | "annualLeaveQuota" | "remainingLeaveQuota"
    >,
  ) => { ok: boolean; message: string };
  correctAttendance: (
    recordId: string,
    clockIn: string,
    clockOut: string | null,
    reason: string,
  ) => { ok: boolean; message: string };
  reviewLeaveRequest: (
    leaveId: string,
    decision: "APPROVED" | "REJECTED",
    rejectionReason?: string,
  ) => { ok: boolean; message: string };
  runPayrollCalculation: (period: string) => { ok: boolean; message: string };
  lockAndPayPeriod: (period: string) => { ok: boolean; message: string };

  // Aksi Karyawan / ESS
  clockInToday: (workMode: WorkMode) => { ok: boolean; message: string };
  clockOutToday: () => { ok: boolean; message: string };
  submitLeaveRequest: (payload: {
    type: LeaveRequest["type"];
    startDate: string;
    endDate: string;
    reason: string;
    attachmentName?: string;
  }) => { ok: boolean; message: string };

  resetDemoVault: () => void;
}

function persistVault(
  state: Pick<
    SuloState,
    | "activeRole"
    | "activeUserId"
    | "privacyShield"
    | "employees"
    | "attendance"
    | "leaves"
    | "payrolls"
    | "auditLogs"
  >,
) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(state);
  const checksum = computeVaultChecksum(serialized);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ checksum, data: state }));
}

export const useSuloStore = create<SuloState>((set, get) => ({
  initialized: false,
  activeRole: "HR_ADMIN",
  activeUserId: "emp-001",
  privacyShield: false,
  employees: [],
  attendance: [],
  leaves: [],
  payrolls: [],
  auditLogs: [],

  initVault: () => {
    if (get().initialized) return;
    const today = getTodayIso();

    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const expectedChecksum = computeVaultChecksum(
            JSON.stringify(parsed.data),
          );
          if (
            parsed.checksum === expectedChecksum &&
            Array.isArray(parsed.data?.employees)
          ) {
            set({ ...parsed.data, initialized: true });
            return;
          }
          // Deteksi manipulasi JSON -> pemulihan otomatis
          const seedEmployees = generateSeedEmployees();
          const recovered = {
            activeRole: "HR_ADMIN" as UserRole,
            activeUserId: "emp-001",
            privacyShield: false,
            employees: seedEmployees,
            attendance: generateSeedAttendance(seedEmployees, today),
            leaves: generateSeedLeaves(),
            payrolls: generateSeedPayrolls(seedEmployees),
            auditLogs: [
              {
                id: `AUD-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actorName: "Tamper Guard",
                actorRole: "HR_ADMIN" as UserRole,
                action: "VAULT_TAMPER_RECOVERED",
                severity: "CRITICAL" as const,
                details:
                  "Anomali checksum terdeteksi pada localStorage. Snapshot aman dipulihkan.",
              },
            ],
          };
          persistVault(recovered);
          set({ ...recovered, initialized: true });
          return;
        } catch {
          // Lanjut inisialisasi bersih
        }
      }
    }

    const employees = generateSeedEmployees();
    const initial = {
      activeRole: "HR_ADMIN" as UserRole,
      activeUserId: "emp-001",
      privacyShield: false,
      employees,
      attendance: generateSeedAttendance(employees, today),
      leaves: generateSeedLeaves(),
      payrolls: generateSeedPayrolls(employees),
      auditLogs: generateInitialAuditLogs(),
    };
    persistVault(initial);
    set({ ...initial, initialized: true });
  },

  switchRole: (role) => {
    const activeUserId = role === "HR_ADMIN" ? "emp-001" : "emp-002";
    const actorName = role === "HR_ADMIN" ? "Rina Kusuma" : "Dimas Pratama";
    set((state) => {
      const nextLogs: SecurityAuditEntry[] = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName,
          actorRole: role,
          action: "ROLE_SWITCHED",
          severity: "INFO",
          details: `Sesi aktif beralih ke peran ${role} (${actorName}).`,
        },
        ...state.auditLogs,
      ];
      const next = {
        ...state,
        activeRole: role,
        activeUserId,
        auditLogs: nextLogs,
      };
      persistVault(next);
      return next;
    });
  },

  togglePrivacyShield: () => {
    set((state) => {
      const nextShield = !state.privacyShield;
      const actor = state.employees.find((e) => e.id === state.activeUserId);
      const nextLogs: SecurityAuditEntry[] = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName: actor?.fullName ?? "System",
          actorRole: state.activeRole,
          action: nextShield ? "PRIVACY_SHIELD_ON" : "PRIVACY_SHIELD_OFF",
          severity: "INFO",
          details: `Global Privacy Mask ${nextShield ? "diaktifkan" : "dinonaktifkan"}.`,
        },
        ...state.auditLogs,
      ];
      const next = { ...state, privacyShield: nextShield, auditLogs: nextLogs };
      persistVault(next);
      return next;
    });
  },

  logSecurityEvent: (action, severity, details) => {
    set((state) => {
      const actor = state.employees.find((e) => e.id === state.activeUserId);
      const nextLogs: SecurityAuditEntry[] = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName: actor?.fullName ?? "Visitor",
          actorRole: state.activeRole,
          action,
          severity,
          details,
        },
        ...state.auditLogs,
      ];
      const next = { ...state, auditLogs: nextLogs };
      persistVault(next);
      return next;
    });
  },

  addEmployee: (payload) => {
    const state = get();
    if (state.activeRole !== "HR_ADMIN") {
      state.logSecurityEvent(
        "UNAUTHORIZED_MUTATION",
        "CRITICAL",
        "Percobaan tambah karyawan tanpa hak HR_ADMIN.",
      );
      return {
        ok: false,
        message: "Akses ditolak: Hanya HR Admin yang diizinkan.",
      };
    }

    const nextNumber = state.employees.length + 1;
    const newEmp: Employee = {
      ...payload,
      id: `emp-${String(nextNumber).padStart(3, "0")}`,
      nip: `SLO-2026-${String(nextNumber).padStart(3, "0")}`,
      annualLeaveQuota: 12,
      remainingLeaveQuota: 12,
    };

    set((s) => {
      const nextLogs: SecurityAuditEntry[] = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName: "Rina Kusuma",
          actorRole: "HR_ADMIN",
          action: "EMPLOYEE_CREATED",
          severity: "INFO",
          details: `Menambahkan karyawan baru ${newEmp.fullName} (${newEmp.nip}).`,
        },
        ...s.auditLogs,
      ];
      const next = {
        ...s,
        employees: [newEmp, ...s.employees],
        auditLogs: nextLogs,
      };
      persistVault(next);
      return next;
    });

    return {
      ok: true,
      message: `Karyawan ${newEmp.fullName} (${newEmp.nip}) berhasil ditambahkan.`,
    };
  },

  correctAttendance: (recordId, clockIn, clockOut, reason) => {
    const state = get();
    if (state.activeRole !== "HR_ADMIN") {
      return { ok: false, message: "Akses ditolak." };
    }
    if (!reason.trim()) {
      return {
        ok: false,
        message: "Alasan koreksi wajib diisi untuk Audit Trail.",
      };
    }

    const evalResult = evaluateClockIn(clockIn);
    const nowTime = new Date().toTimeString().slice(0, 5);

    set((s) => {
      const updated = s.attendance.map((rec) =>
        rec.id === recordId
          ? {
              ...rec,
              clockIn,
              clockOut,
              status: evalResult.status,
              lateMinutes: evalResult.lateMinutes,
              auditNote: `Edited by Rina Kusuma at ${nowTime} — ${reason.trim()}`,
            }
          : rec,
      );
      const nextLogs: SecurityAuditEntry[] = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName: "Rina Kusuma",
          actorRole: "HR_ADMIN",
          action: "ATTENDANCE_CORRECTED",
          severity: "WARNING",
          details: `Koreksi presensi ${recordId}: ${reason.trim()}`,
        },
        ...s.auditLogs,
      ];
      const next = { ...s, attendance: updated, auditLogs: nextLogs };
      persistVault(next);
      return next;
    });

    return {
      ok: true,
      message: "Log presensi diperbarui dan tercatat di Audit Trail.",
    };
  },

  reviewLeaveRequest: (leaveId, decision, rejectionReason) => {
    const state = get();
    if (state.activeRole !== "HR_ADMIN") {
      return { ok: false, message: "Akses ditolak." };
    }
    if (decision === "REJECTED" && !rejectionReason?.trim()) {
      return { ok: false, message: "Catatan penolakan wajib diisi." };
    }

    const target = state.leaves.find((l) => l.id === leaveId);
    if (!target) return { ok: false, message: "Pengajuan tidak ditemukan." };

    set((s) => {
      const updatedLeaves = s.leaves.map((l) =>
        l.id === leaveId
          ? {
              ...l,
              status: decision,
              reviewedBy: "Rina Kusuma",
              reviewedAt: new Date().toISOString(),
              rejectionReason:
                decision === "REJECTED" ? rejectionReason?.trim() : undefined,
            }
          : l,
      );

      // Potong kuota hanya jika APPROVED dan jenis CUTI_TAHUNAN
      const updatedEmployees =
        decision === "APPROVED" && target.type === "CUTI_TAHUNAN"
          ? s.employees.map((emp) =>
              emp.id === target.employeeId
                ? {
                    ...emp,
                    remainingLeaveQuota: Math.max(
                      0,
                      emp.remainingLeaveQuota - target.effectiveDays,
                    ),
                  }
                : emp,
            )
          : s.employees;

      const nextLogs: SecurityAuditEntry[] = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName: "Rina Kusuma",
          actorRole: "HR_ADMIN",
          action: `LEAVE_${decision}`,
          severity: "INFO",
          details: `Pengajuan ${leaveId} (${target.type}) ditetapkan ${decision}.`,
        },
        ...s.auditLogs,
      ];

      const next = {
        ...s,
        leaves: updatedLeaves,
        employees: updatedEmployees,
        auditLogs: nextLogs,
      };
      persistVault(next);
      return next;
    });

    return {
      ok: true,
      message:
        decision === "APPROVED"
          ? "Pengajuan disetujui & kuota cuti diperbarui."
          : "Pengajuan ditolak dengan catatan audit.",
    };
  },

  runPayrollCalculation: (period) => {
    const state = get();
    if (state.activeRole !== "HR_ADMIN") {
      return { ok: false, message: "Akses ditolak." };
    }
    const isLocked = state.payrolls.some(
      (p) => p.period === period && p.status === "PAID",
    );
    if (isLocked) {
      return { ok: false, message: `Periode ${period} sudah dikunci (PAID).` };
    }

    set((s) => {
      const otherPeriods = s.payrolls.filter((p) => p.period !== period);
      const recalculated = s.employees.map((emp) => {
        const lateCount = s.attendance.filter(
          (a) => a.employeeId === emp.id && a.status === "TERLAMBAT",
        ).length;
        return computeEmployeePayroll({
          employee: emp,
          period,
          lateCount,
          overtimeHours: 2,
          status: "DRAFT",
        });
      });

      const nextLogs: SecurityAuditEntry[] = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName: "Rina Kusuma",
          actorRole: "HR_ADMIN",
          action: "PAYROLL_CALCULATED",
          severity: "INFO",
          details: `Kalkulasi otomatis payroll periode ${period} untuk ${s.employees.length} karyawan.`,
        },
        ...s.auditLogs,
      ];

      const next = {
        ...s,
        payrolls: [...otherPeriods, ...recalculated],
        auditLogs: nextLogs,
      };
      persistVault(next);
      return next;
    });

    return {
      ok: true,
      message: `Kalkulasi otomatis periode ${period} selesai.`,
    };
  },

  lockAndPayPeriod: (period) => {
    const state = get();
    if (state.activeRole !== "HR_ADMIN") {
      return { ok: false, message: "Akses ditolak." };
    }

    set((s) => {
      const updated = s.payrolls.map((p) =>
        p.period === period
          ? { ...p, status: "PAID" as const, paidAt: new Date().toISOString() }
          : p,
      );
      const nextLogs: SecurityAuditEntry[] = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName: "Rina Kusuma",
          actorRole: "HR_ADMIN",
          action: "PAYROLL_LOCKED_PAID",
          severity: "WARNING",
          details: `Periode payroll ${period} dikunci & diterbitkan ke portal ESS.`,
        },
        ...s.auditLogs,
      ];
      const next = { ...s, payrolls: updated, auditLogs: nextLogs };
      persistVault(next);
      return next;
    });

    return {
      ok: true,
      message: `Periode ${period} dikunci & slip gaji diterbitkan.`,
    };
  },

  clockInToday: (workMode) => {
    const state = get();
    const today = getTodayIso();
    const nowTime = new Date().toTimeString().slice(0, 8);
    const evalResult = evaluateClockIn(nowTime);

    set((s) => {
      const exists = s.attendance.some(
        (a) => a.employeeId === s.activeUserId && a.date === today,
      );
      const updated = exists
        ? s.attendance.map((a) =>
            a.employeeId === s.activeUserId && a.date === today
              ? {
                  ...a,
                  clockIn: nowTime,
                  workMode,
                  status: evalResult.status,
                  lateMinutes: evalResult.lateMinutes,
                }
              : a,
          )
        : [
            ...s.attendance,
            {
              id: `att-${today}-${s.activeUserId}`,
              employeeId: s.activeUserId,
              date: today,
              clockIn: nowTime,
              clockOut: null,
              workMode,
              status: evalResult.status,
              lateMinutes: evalResult.lateMinutes,
            },
          ];

      const next = { ...s, attendance: updated };
      persistVault(next);
      return next;
    });

    return {
      ok: true,
      message: `Clock-In berhasil pukul ${nowTime} (${workMode}) — ${
        evalResult.status === "TEPAT_WAKTU"
          ? "Tepat Waktu"
          : `Terlambat ${evalResult.lateMinutes} menit`
      }.`,
    };
  },

  clockOutToday: () => {
    const state = get();
    const today = getTodayIso();
    const nowTime = new Date().toTimeString().slice(0, 8);

    set((s) => {
      const updated = s.attendance.map((a) =>
        a.employeeId === s.activeUserId && a.date === today
          ? { ...a, clockOut: nowTime }
          : a,
      );
      const next = { ...s, attendance: updated };
      persistVault(next);
      return next;
    });

    return {
      ok: true,
      message: `Clock-Out berhasil dicatat pukul ${nowTime}.`,
    };
  },

  submitLeaveRequest: (payload) => {
    const state = get();
    const emp = state.employees.find((e) => e.id === state.activeUserId);
    if (!emp) return { ok: false, message: "Profil karyawan tidak ditemukan." };

    const effectiveDays = calculateEffectiveWorkingDays(
      payload.startDate,
      payload.endDate,
    );
    if (effectiveDays <= 0) {
      return {
        ok: false,
        message:
          "Rentang tanggal tidak memiliki hari kerja efektif (Senin-Jumat).",
      };
    }

    if (
      payload.type === "CUTI_TAHUNAN" &&
      effectiveDays > emp.remainingLeaveQuota
    ) {
      return {
        ok: false,
        message: `Sisa kuota cuti tidak mencukupi (Tersisa ${emp.remainingLeaveQuota} hari).`,
      };
    }

    const newRequest: LeaveRequest = {
      id: `LV-2026-${String(state.leaves.length + 1).padStart(3, "0")}`,
      employeeId: emp.id,
      type: payload.type,
      startDate: payload.startDate,
      endDate: payload.endDate,
      effectiveDays,
      reason: payload.reason,
      attachmentName: payload.attachmentName,
      status: "PENDING",
      submittedAt: new Date().toISOString(),
    };

    set((s) => {
      const nextLogs: SecurityAuditEntry[] = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName: emp.fullName,
          actorRole: s.activeRole,
          action: "LEAVE_SUBMITTED",
          severity: "INFO",
          details: `${emp.fullName} mengajukan ${payload.type} (${effectiveDays} hari kerja).`,
        },
        ...s.auditLogs,
      ];
      const next = {
        ...s,
        leaves: [newRequest, ...s.leaves],
        auditLogs: nextLogs,
      };
      persistVault(next);
      return next;
    });

    return {
      ok: true,
      message: `Pengajuan ${newRequest.id} (${effectiveDays} hari kerja) terkirim ke HR Admin.`,
    };
  },

  resetDemoVault: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ initialized: false });
    get().initVault();
  },
}));
