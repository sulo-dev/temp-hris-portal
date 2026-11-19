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
  DEMO_DEFAULT_PASSWORD,
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
export const AUTH_SESSION_KEY = "sulohr_auth_session";

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function syncBrowserAuthSession(status: "authenticated" | "logged_out") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_SESSION_KEY, status);
}

/**
 * Validasi otoritas portal Admin:
 * Hanya karyawan dari departemen HR yang memiliki hak akses HR_ADMIN.
 * Karyawan departemen lain (Engineering, Product & Design, Marketing, Finance) hanya dapat mengakses ESS.
 */
export function canAccessAdminPortal(emp?: Employee): boolean {
  return Boolean(emp && emp.department === "HR");
}

function resolveEmployeeDefaultRole(emp: Employee): UserRole {
  return canAccessAdminPortal(emp) ? "HR_ADMIN" : "EMPLOYEE";
}

function getActiveActorName(
  employees: Employee[],
  activeUserId: string,
  fallback = "HR Admin",
): string {
  return employees.find((e) => e.id === activeUserId)?.fullName ?? fallback;
}

export interface AuthActionResult {
  ok: boolean;
  message: string;
  redirectTo?: "/admin/dashboard" | "/ess/home";
  role?: UserRole;
}

interface SuloState {
  // 1. Session & Vault State
  initialized: boolean;
  isAuthenticated: boolean;
  activeRole: UserRole;
  activeUserId: string;
  privacyShield: boolean;

  // 2. Domain Data
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  payrolls: PayrollItem[];
  auditLogs: SecurityAuditEntry[];

  // 3. Vault & Auth Actions
  initVault: () => void;
  loginWithCredentials: (
    identifier: string,
    password: string,
    preferredRole?: UserRole,
  ) => AuthActionResult;
  loginAsEmployee: (
    employeeId: string,
    preferredRole?: UserRole,
  ) => AuthActionResult;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  togglePrivacyShield: () => void;
  logSecurityEvent: (
    action: string,
    severity: "INFO" | "WARNING" | "CRITICAL",
    details: string,
  ) => void;

  // 4. HR Admin Actions (Action-Level RBAC)
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

  // 5. Employee Self-Service (ESS) Actions
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

type PersistedVaultData = Pick<
  SuloState,
  | "isAuthenticated"
  | "activeRole"
  | "activeUserId"
  | "privacyShield"
  | "employees"
  | "attendance"
  | "leaves"
  | "payrolls"
  | "auditLogs"
>;

function persistVault(state: PersistedVaultData) {
  if (typeof window === "undefined") return;
  const payload: PersistedVaultData = {
    isAuthenticated: state.isAuthenticated,
    activeRole: state.activeRole,
    activeUserId: state.activeUserId,
    privacyShield: state.privacyShield,
    employees: state.employees,
    attendance: state.attendance,
    leaves: state.leaves,
    payrolls: state.payrolls,
    auditLogs: state.auditLogs,
  };
  const checksum = computeVaultChecksum(JSON.stringify(payload));
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ checksum, data: payload }));
}

export const useSuloStore = create<SuloState>((set, get) => ({
  initialized: false,
  isAuthenticated: true,
  activeRole: "HR_ADMIN",
  activeUserId: "emp-001",
  privacyShield: false,
  employees: [],
  attendance: [],
  leaves: [],
  payrolls: [],
  auditLogs: [],

  // =========================================================================
  // 1. INISIALISASI VAULT & ENFORCEMENT PERAN
  // =========================================================================
  initVault: () => {
    if (get().initialized) return;
    const today = getTodayIso();

    if (typeof window !== "undefined") {
      const browserAuth = window.localStorage.getItem(AUTH_SESSION_KEY);
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
            const loadedEmployees: Employee[] = parsed.data.employees;
            const activeEmp = loadedEmployees.find(
              (e) => e.id === parsed.data.activeUserId,
            );

            // Paksa downgrade ke EMPLOYEE jika sesi tersimpan mengklaim HR_ADMIN untuk non-HR
            const enforcedRole: UserRole =
              parsed.data.activeRole === "HR_ADMIN" &&
              canAccessAdminPortal(activeEmp)
                ? "HR_ADMIN"
                : "EMPLOYEE";

            const isAuth =
              browserAuth === "logged_out"
                ? false
                : (parsed.data.isAuthenticated ?? true);

            set({
              ...parsed.data,
              activeRole: enforcedRole,
              isAuthenticated: isAuth,
              initialized: true,
            });
            return;
          }

          // Pemulihan otomatis jika checksum localStorage termanipulasi
          const seedEmployees = generateSeedEmployees();
          const recovered: PersistedVaultData = {
            isAuthenticated: browserAuth !== "logged_out",
            activeRole: "HR_ADMIN",
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
                actorRole: "HR_ADMIN",
                action: "VAULT_TAMPER_RECOVERED",
                severity: "CRITICAL",
                details:
                  "Anomali checksum terdeteksi pada localStorage. Snapshot aman dipulihkan.",
              },
            ],
          };
          persistVault(recovered);
          set({ ...recovered, initialized: true });
          return;
        } catch {
          // Lanjut ke inisialisasi awal bersih
        }
      }
    }

    const employees = generateSeedEmployees();
    const isAuth =
      typeof window === "undefined"
        ? true
        : window.localStorage.getItem(AUTH_SESSION_KEY) !== "logged_out";

    const initial: PersistedVaultData = {
      isAuthenticated: isAuth,
      activeRole: "HR_ADMIN",
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

  // =========================================================================
  // 2. AUTENTIKASI (LOGIN & LOGOUT DENGAN PEMBATASAN PORTAL KARYAWAN)
  // =========================================================================
  loginWithCredentials: (identifier, password, preferredRole) => {
    if (!get().initialized) {
      get().initVault();
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId) {
      return { ok: false, message: "Masukkan NIP atau email perusahaan Anda." };
    }
    if (!cleanPass) {
      return { ok: false, message: "Kata sandi wajib diisi." };
    }

    const state = get();
    const matchedEmployee = state.employees.find(
      (emp) =>
        emp.nip.toLowerCase() === cleanId ||
        emp.email.toLowerCase() === cleanId,
    );

    if (!matchedEmployee) {
      state.logSecurityEvent(
        "AUTH_LOGIN_FAILED",
        "WARNING",
        `Percobaan login gagal: identitas '${identifier.trim()}' tidak ditemukan.`,
      );
      return {
        ok: false,
        message:
          "NIP atau email tidak terdaftar. Contoh valid: SLO-2026-001 atau rina.kusuma@sulo.co.id.",
      };
    }

    const validPasswords = [
      DEMO_DEFAULT_PASSWORD.toLowerCase(),
      matchedEmployee.nip.toLowerCase(),
    ];

    if (!validPasswords.includes(cleanPass.toLowerCase())) {
      state.logSecurityEvent(
        "AUTH_LOGIN_FAILED",
        "WARNING",
        `Kata sandi salah untuk akun ${matchedEmployee.fullName} (${matchedEmployee.nip}).`,
      );
      return {
        ok: false,
        message: `Kata sandi salah. Gunakan "${DEMO_DEFAULT_PASSWORD}" atau NIP karyawan.`,
      };
    }

    return get().loginAsEmployee(matchedEmployee.id, preferredRole);
  },

  loginAsEmployee: (employeeId, preferredRole) => {
    if (!get().initialized) {
      get().initVault();
    }

    const state = get();
    const targetEmp = state.employees.find((e) => e.id === employeeId);
    if (!targetEmp) {
      return { ok: false, message: "Akun karyawan tidak ditemukan di vault." };
    }

    const isHrEligible = canAccessAdminPortal(targetEmp);

    // Tolak keras jika karyawan non-HR mencoba masuk ke workspace HR_ADMIN
    if (!isHrEligible && preferredRole === "HR_ADMIN") {
      state.logSecurityEvent(
        "AUTH_ADMIN_ACCESS_DENIED",
        "WARNING",
        `Karyawan ${targetEmp.fullName} (${targetEmp.nip} - ${targetEmp.department}) ditolak masuk ke HR Admin Console.`,
      );
      return {
        ok: false,
        message: `Akses ditolak: Karyawan (${targetEmp.department}) hanya dapat masuk ke Portal ESS.`,
      };
    }

    const finalRole: UserRole =
      isHrEligible && preferredRole
        ? preferredRole
        : resolveEmployeeDefaultRole(targetEmp);

    syncBrowserAuthSession("authenticated");

    set((s) => {
      const nextLogs: SecurityAuditEntry[] = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName: targetEmp.fullName,
          actorRole: finalRole,
          action: "AUTH_LOGIN_SUCCESS",
          severity: "INFO",
          details: `${targetEmp.fullName} (${targetEmp.nip}) masuk ke ${
            finalRole === "HR_ADMIN" ? "HR Admin Console" : "Portal ESS"
          }.`,
        },
        ...s.auditLogs,
      ];
      const next: PersistedVaultData = {
        ...s,
        isAuthenticated: true,
        activeUserId: targetEmp.id,
        activeRole: finalRole,
        auditLogs: nextLogs,
      };
      persistVault(next);
      return next;
    });

    return {
      ok: true,
      role: finalRole,
      redirectTo:
        finalRole === "HR_ADMIN" ? "/admin/dashboard" : "/ess/home",
      message: `Selamat datang, ${targetEmp.fullName} (${targetEmp.nip})!`,
    };
  },

  logout: () => {
    syncBrowserAuthSession("logged_out");
    set((s) => {
      const actorName = getActiveActorName(
        s.employees,
        s.activeUserId,
        "Pengguna",
      );
      const nextLogs: SecurityAuditEntry[] = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName,
          actorRole: s.activeRole,
          action: "AUTH_LOGOUT",
          severity: "INFO",
          details: `Sesi diakhiri oleh ${actorName}.`,
        },
        ...s.auditLogs,
      ];
      const next: PersistedVaultData = {
        ...s,
        isAuthenticated: false,
        auditLogs: nextLogs,
      };
      persistVault(next);
      return next;
    });
  },

  switchRole: (role) => {
    const state = get();
    const currentEmp = state.employees.find((e) => e.id === state.activeUserId);

    // Cegah eskalasi peran ke HR_ADMIN jika akun aktif bukan departemen HR
    if (role === "HR_ADMIN" && !canAccessAdminPortal(currentEmp)) {
      state.logSecurityEvent(
        "UNAUTHORIZED_ROLE_SWITCH",
        "CRITICAL",
        `Percobaan eskalasi peran ke HR_ADMIN oleh ${
          currentEmp?.fullName ?? state.activeUserId
        } diblokir.`,
      );
      return;
    }

    const nextUserId =
      currentEmp && canAccessAdminPortal(currentEmp)
        ? currentEmp.id
        : role === "HR_ADMIN"
          ? "emp-001"
          : "emp-002";

    syncBrowserAuthSession("authenticated");
    set((s) => {
      const actorName = getActiveActorName(
        s.employees,
        nextUserId,
        role === "HR_ADMIN" ? "Rina Kusuma" : "Dimas Pratama",
      );
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
        ...s.auditLogs,
      ];
      const next: PersistedVaultData = {
        ...s,
        isAuthenticated: true,
        activeRole: role,
        activeUserId: nextUserId,
        auditLogs: nextLogs,
      };
      persistVault(next);
      return next;
    });
  },

  togglePrivacyShield: () => {
    set((state) => {
      const nextShield = !state.privacyShield;
      const actorName = getActiveActorName(
        state.employees,
        state.activeUserId,
        "System",
      );
      const nextLogs: SecurityAuditEntry[] = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName,
          actorRole: state.activeRole,
          action: nextShield ? "PRIVACY_SHIELD_ON" : "PRIVACY_SHIELD_OFF",
          severity: "INFO",
          details: `Global Privacy Mask ${nextShield ? "diaktifkan" : "dinonaktifkan"}.`,
        },
        ...state.auditLogs,
      ];
      const next: PersistedVaultData = {
        ...state,
        privacyShield: nextShield,
        auditLogs: nextLogs,
      };
      persistVault(next);
      return next;
    });
  },

  logSecurityEvent: (action, severity, details) => {
    set((state) => {
      const actorName = getActiveActorName(
        state.employees,
        state.activeUserId,
        "Visitor",
      );
      const nextLogs: SecurityAuditEntry[] = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName,
          actorRole: state.activeRole,
          action,
          severity,
          details,
        },
        ...state.auditLogs,
      ];
      const next: PersistedVaultData = { ...state, auditLogs: nextLogs };
      persistVault(next);
      return next;
    });
  },

  // =========================================================================
  // 3. AKSI HR ADMIN (ACTION-LEVEL RBAC)
  // =========================================================================
  addEmployee: (payload) => {
    const state = get();
    const activeEmp = state.employees.find((e) => e.id === state.activeUserId);
    if (state.activeRole !== "HR_ADMIN" || !canAccessAdminPortal(activeEmp)) {
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
      const actorName = getActiveActorName(s.employees, s.activeUserId);
      const nextLogs: SecurityAuditEntry[] = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName,
          actorRole: "HR_ADMIN",
          action: "EMPLOYEE_CREATED",
          severity: "INFO",
          details: `Menambahkan karyawan baru ${newEmp.fullName} (${newEmp.nip} - ${newEmp.department}).`,
        },
        ...s.auditLogs,
      ];
      const next: PersistedVaultData = {
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
    const activeEmp = state.employees.find((e) => e.id === state.activeUserId);
    if (state.activeRole !== "HR_ADMIN" || !canAccessAdminPortal(activeEmp)) {
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
      const actorName = getActiveActorName(s.employees, s.activeUserId);
      const updated = s.attendance.map((rec) =>
        rec.id === recordId
          ? {
              ...rec,
              clockIn,
              clockOut,
              status: evalResult.status,
              lateMinutes: evalResult.lateMinutes,
              auditNote: `Edited by ${actorName} at ${nowTime} — ${reason.trim()}`,
            }
          : rec,
      );
      const nextLogs: SecurityAuditEntry[] = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName,
          actorRole: "HR_ADMIN",
          action: "ATTENDANCE_CORRECTED",
          severity: "WARNING",
          details: `Koreksi presensi ${recordId}: ${reason.trim()}`,
        },
        ...s.auditLogs,
      ];
      const next: PersistedVaultData = {
        ...s,
        attendance: updated,
        auditLogs: nextLogs,
      };
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
    const activeEmp = state.employees.find((e) => e.id === state.activeUserId);
    if (state.activeRole !== "HR_ADMIN" || !canAccessAdminPortal(activeEmp)) {
      return { ok: false, message: "Akses ditolak." };
    }
    if (decision === "REJECTED" && !rejectionReason?.trim()) {
      return { ok: false, message: "Catatan penolakan wajib diisi." };
    }

    const target = state.leaves.find((l) => l.id === leaveId);
    if (!target) return { ok: false, message: "Pengajuan tidak ditemukan." };

    set((s) => {
      const actorName = getActiveActorName(s.employees, s.activeUserId);
      const updatedLeaves = s.leaves.map((l) =>
        l.id === leaveId
          ? {
              ...l,
              status: decision,
              reviewedBy: actorName,
              reviewedAt: new Date().toISOString(),
              rejectionReason:
                decision === "REJECTED" ? rejectionReason?.trim() : undefined,
            }
          : l,
      );

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
          actorName,
          actorRole: "HR_ADMIN",
          action: `LEAVE_${decision}`,
          severity: "INFO",
          details: `Pengajuan ${leaveId} (${target.type}) ditetapkan ${decision}.`,
        },
        ...s.auditLogs,
      ];

      const next: PersistedVaultData = {
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
    const activeEmp = state.employees.find((e) => e.id === state.activeUserId);
    if (state.activeRole !== "HR_ADMIN" || !canAccessAdminPortal(activeEmp)) {
      return { ok: false, message: "Akses ditolak." };
    }
    const isLocked = state.payrolls.some(
      (p) => p.period === period && p.status === "PAID",
    );
    if (isLocked) {
      return { ok: false, message: `Periode ${period} sudah dikunci (PAID).` };
    }

    set((s) => {
      const actorName = getActiveActorName(s.employees, s.activeUserId);
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
          actorName,
          actorRole: "HR_ADMIN",
          action: "PAYROLL_CALCULATED",
          severity: "INFO",
          details: `Kalkulasi otomatis payroll periode ${period} untuk ${s.employees.length} karyawan.`,
        },
        ...s.auditLogs,
      ];

      const next: PersistedVaultData = {
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
    const activeEmp = state.employees.find((e) => e.id === state.activeUserId);
    if (state.activeRole !== "HR_ADMIN" || !canAccessAdminPortal(activeEmp)) {
      return { ok: false, message: "Akses ditolak." };
    }

    set((s) => {
      const actorName = getActiveActorName(s.employees, s.activeUserId);
      const updated = s.payrolls.map((p) =>
        p.period === period
          ? { ...p, status: "PAID" as const, paidAt: new Date().toISOString() }
          : p,
      );
      const nextLogs: SecurityAuditEntry[] = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName,
          actorRole: "HR_ADMIN",
          action: "PAYROLL_LOCKED_PAID",
          severity: "WARNING",
          details: `Periode payroll ${period} dikunci & diterbitkan ke portal ESS.`,
        },
        ...s.auditLogs,
      ];
      const next: PersistedVaultData = {
        ...s,
        payrolls: updated,
        auditLogs: nextLogs,
      };
      persistVault(next);
      return next;
    });

    return {
      ok: true,
      message: `Periode ${period} dikunci & slip gaji diterbitkan.`,
    };
  },

  // =========================================================================
  // 4. AKSI KARYAWAN / ESS
  // =========================================================================
  clockInToday: (workMode) => {
    const state = get();
    const emp = state.employees.find((e) => e.id === state.activeUserId);
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

      const nextLogs: SecurityAuditEntry[] = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName: emp?.fullName ?? s.activeUserId,
          actorRole: s.activeRole,
          action: "ESS_CLOCK_IN",
          severity: "INFO",
          details: `Clock-In (${workMode}) pukul ${nowTime} — ${evalResult.status}.`,
        },
        ...s.auditLogs,
      ];

      const next: PersistedVaultData = {
        ...s,
        attendance: updated,
        auditLogs: nextLogs,
      };
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
    const emp = state.employees.find((e) => e.id === state.activeUserId);
    const today = getTodayIso();
    const todayRecord = state.attendance.find(
      (a) => a.employeeId === state.activeUserId && a.date === today,
    );

    if (!todayRecord || !todayRecord.clockIn) {
      return {
        ok: false,
        message: "Anda belum melakukan Clock-In hari ini.",
      };
    }

    const nowTime = new Date().toTimeString().slice(0, 8);

    set((s) => {
      const updated = s.attendance.map((a) =>
        a.employeeId === s.activeUserId && a.date === today
          ? { ...a, clockOut: nowTime }
          : a,
      );
      const nextLogs: SecurityAuditEntry[] = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName: emp?.fullName ?? s.activeUserId,
          actorRole: s.activeRole,
          action: "ESS_CLOCK_OUT",
          severity: "INFO",
          details: `Clock-Out tercatat pukul ${nowTime}.`,
        },
        ...s.auditLogs,
      ];
      const next: PersistedVaultData = {
        ...s,
        attendance: updated,
        auditLogs: nextLogs,
      };
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
      const next: PersistedVaultData = {
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
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
    set({ initialized: false });
    get().initVault();
  },
}));