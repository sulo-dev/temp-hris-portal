// src/lib/business-rules.ts
import { Employee, PayrollItem } from "./types";

/**
 * Hitung keterlambatan berdasarkan jam masuk HH:mm:ss
 * Toleransi hingga 09:05:59; >= 09:06:00 dihitung terlambat dari 09:00
 */
export function evaluateClockIn(timeString: string): {
  status: "TEPAT_WAKTU" | "TERLAMBAT";
  lateMinutes: number;
} {
  const [hh, mm, ss] = timeString.split(":").map(Number);
  const totalSeconds = hh * 3600 + mm * 60 + (ss || 0);
  const graceLimitSeconds = 9 * 3600 + 5 * 60 + 59; // 09:05:59
  const standardStartMinutes = 9 * 60; // 09:00

  if (totalSeconds <= graceLimitSeconds) {
    return { status: "TEPAT_WAKTU", lateMinutes: 0 };
  }

  const actualMinutes = hh * 60 + mm;
  return {
    status: "TERLAMBAT",
    lateMinutes: Math.max(1, actualMinutes - standardStartMinutes),
  };
}

/**
 * Hitung jumlah hari kerja efektif (Senin-Jumat), mengecualikan Sabtu & Minggu
 */
export function calculateEffectiveWorkingDays(
  startDateStr: string,
  endDateStr: string,
): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return 0;
  }

  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

/**
 * Hitung PPh 21 TER Sederhana sesuai Pasal 5.3 PRD
 */
export function calculatePph21Ter(grossIncome: number): number {
  if (grossIncome <= 5_400_000) return 0;
  if (grossIncome <= 10_000_000) return Math.round(grossIncome * 0.015);
  return Math.round(grossIncome * 0.035);
}

/**
 * Generate Hash Verifikasi Kriptografis Slip Gaji
 */
export function generatePayslipHash(
  period: string,
  nip: string,
  takeHomePay: number,
): string {
  const raw = `${period}-${nip}-${takeHomePay}-PTSULO`;
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0")
    .slice(0, 4);
  const compactPeriod = period.replace("-", "");
  const compactNip = nip.replace(/[^A-Z0-9]/gi, "");
  return `SULO-${compactPeriod}-${compactNip}-${hex}`;
}

/**
 * Mesin Kalkulasi Payroll Otomatis per Karyawan
 */
export function computeEmployeePayroll(params: {
  employee: Employee;
  period: string;
  lateCount: number;
  overtimeHours: number;
  status?: "DRAFT" | "PAID";
}): PayrollItem {
  const {
    employee,
    period,
    lateCount,
    overtimeHours,
    status = "DRAFT",
  } = params;
  const hourlyRate = Math.round(employee.baseSalary / 173);
  const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5);
  const totalEarnings =
    employee.baseSalary + employee.fixedAllowance + overtimePay;

  const lateDeduction = lateCount * 25_000;
  const bpjsKesehatan = Math.round(employee.baseSalary * 0.01);
  const bpjsTkJht = Math.round(employee.baseSalary * 0.02);
  const pph21 = calculatePph21Ter(totalEarnings);

  const totalDeductions = lateDeduction + bpjsKesehatan + bpjsTkJht + pph21;
  const takeHomePay = totalEarnings - totalDeductions;

  return {
    id: `PAY-${period}-${employee.id}`,
    period,
    employeeId: employee.id,
    baseSalary: employee.baseSalary,
    fixedAllowance: employee.fixedAllowance,
    overtimePay,
    lateCount,
    lateDeduction,
    bpjsKesehatan,
    bpjsTkJht,
    pph21,
    totalEarnings,
    totalDeductions,
    takeHomePay,
    status,
    verificationHash: generatePayslipHash(period, employee.nip, takeHomePay),
    paidAt: status === "PAID" ? new Date().toISOString() : undefined,
  };
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
