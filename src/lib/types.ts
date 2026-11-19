// src/lib/types.ts
export type UserRole = "HR_ADMIN" | "EMPLOYEE";
export type EmploymentStatus = "PKWTT" | "PKWT" | "MAGANG";
export type WorkMode = "WFO" | "WFH" | "DINAS_LUAR";
export type AttendanceStatus =
  | "TEPAT_WAKTU"
  | "TERLAMBAT"
  | "CUTI_IZIN"
  | "BELUM_ABSEN";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type DepartmentName =
  | "Engineering"
  | "Product & Design"
  | "Marketing"
  | "Finance"
  | "HR";

export interface Employee {
  id: string;
  nip: string; // Format: SLO-2026-001
  fullName: string;
  email: string;
  phone: string;
  nik: string;
  bankAccount: string;
  bankName: string;
  department: DepartmentName;
  position: string;
  status: EmploymentStatus;
  joinDate: string; // ISO Date YYYY-MM-DD
  contractEndDate?: string;
  baseSalary: number;
  fixedAllowance: number;
  annualLeaveQuota: number;
  remainingLeaveQuota: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  clockIn: string | null; // HH:mm:ss
  clockOut: string | null; // HH:mm:ss
  workMode: WorkMode;
  status: AttendanceStatus;
  lateMinutes: number;
  auditNote?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: "CUTI_TAHUNAN" | "IZIN_SAKIT" | "CUTI_MELAHIRKAN" | "KLAIM_LEMBUR";
  startDate: string;
  endDate: string;
  effectiveDays: number;
  reason: string;
  attachmentName?: string;
  status: ApprovalStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface PayrollItem {
  id: string;
  period: string; // YYYY-MM (contoh: "2026-11")
  employeeId: string;
  baseSalary: number;
  fixedAllowance: number;
  overtimePay: number;
  lateCount: number;
  lateDeduction: number;
  bpjsKesehatan: number;
  bpjsTkJht: number;
  pph21: number;
  totalEarnings: number;
  totalDeductions: number;
  takeHomePay: number;
  status: "DRAFT" | "PAID";
  verificationHash: string;
  paidAt?: string;
}

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  details: string;
}
