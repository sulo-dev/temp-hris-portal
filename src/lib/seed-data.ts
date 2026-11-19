// src/lib/seed-data.ts
import {
  AttendanceRecord,
  DepartmentName,
  Employee,
  LeaveRequest,
  PayrollItem,
  SecurityAuditEntry,
  UserRole,
} from "./types";
import { computeEmployeePayroll } from "./business-rules";

/**
 * Kredensial Demo Utama SuloHR
 * Kata sandi berlaku untuk seluruh akun evaluasi (atau gunakan NIP masing-masing karyawan).
 */
export const DEMO_DEFAULT_PASSWORD = "sulohr2026";

export interface DemoAccountPreset {
  employeeId: string;
  nip: string;
  email: string;
  password: string;
  fullName: string;
  department: DepartmentName;
  position: string;
  role: UserRole;
  highlight: string;
}

export const DEMO_ACCOUNTS: DemoAccountPreset[] = [
  {
    employeeId: "emp-001",
    nip: "SLO-2026-001",
    email: "rina.kusuma@sulo.co.id",
    password: DEMO_DEFAULT_PASSWORD,
    fullName: "Rina Kusuma",
    department: "HR",
    position: "HR Manager",
    role: "HR_ADMIN",
    highlight: "Akses penuh HR Admin Console, Payroll & PII Vault",
  },
  {
    employeeId: "emp-002",
    nip: "SLO-2026-002",
    email: "dimas.pratama@sulo.co.id",
    password: DEMO_DEFAULT_PASSWORD,
    fullName: "Dimas Pratama",
    department: "Engineering",
    position: "Senior Frontend Engineer",
    role: "EMPLOYEE",
    highlight: "Portal ESS (Siap demo Clock-In & 1 pengajuan cuti pending)",
  },
  {
    employeeId: "emp-005",
    nip: "SLO-2026-005",
    email: "tari.maharani5@sulo.co.id",
    password: DEMO_DEFAULT_PASSWORD,
    fullName: "Tari Maharani",
    department: "HR",
    position: "People Operations",
    role: "HR_ADMIN",
    highlight: "Akun HR Operations (Akses Admin & ESS)",
  },
  {
    employeeId: "emp-004",
    nip: "SLO-2026-004",
    email: "fajar.saputra4@sulo.co.id",
    password: DEMO_DEFAULT_PASSWORD,
    fullName: "Fajar Saputra",
    department: "Finance",
    position: "Financial Controller",
    role: "EMPLOYEE",
    highlight: "Portal ESS Departemen Finance",
  },
];

const DEPARTMENTS: {
  name: DepartmentName;
  positions: string[];
  base: number;
}[] = [
  {
    name: "Engineering",
    positions: [
      "Senior Frontend Engineer",
      "Backend Engineer",
      "DevOps Engineer",
      "QA Automation",
    ],
    base: 11_500_000,
  },
  {
    name: "Product & Design",
    positions: ["Product Manager", "UI/UX Designer", "Design Systems Lead"],
    base: 10_000_000,
  },
  {
    name: "Marketing",
    positions: ["Growth Specialist", "Brand Strategist", "Content Producer"],
    base: 7_500_000,
  },
  {
    name: "Finance",
    positions: [
      "Financial Controller",
      "Tax & Payroll Specialist",
      "Accounting Staff",
    ],
    base: 8_200_000,
  },
  {
    name: "HR",
    positions: ["HR Manager", "People Operations", "Talent Acquisition"],
    base: 9_000_000,
  },
];

const FIRST_NAMES = [
  "Rina",
  "Dimas",
  "Nadia",
  "Fajar",
  "Tari",
  "Bagas",
  "Aulia",
  "Rizky",
  "Salsa",
  "Hendra",
  "Citra",
  "Kevin",
  "Putri",
  "Arif",
  "Maya",
  "Galih",
  "Dina",
  "Yoga",
  "Intan",
  "Reza",
  "Anisa",
  "Ilham",
  "Nisa",
  "Bayu",
];

const LAST_NAMES = [
  "Kusuma",
  "Pratama",
  "Wijaya",
  "Saputra",
  "Maharani",
  "Nugroho",
  "Ramadhani",
  "Hidayat",
  "Permata",
  "Santoso",
  "Lestari",
  "Gunawan",
  "Putri",
  "Setiawan",
  "Anggraini",
  "Kurniawan",
];

export function generateSeedEmployees(): Employee[] {
  const list: Employee[] = [];

  for (let i = 1; i <= 48; i += 1) {
    const id = `emp-${String(i).padStart(3, "0")}`;
    const nip = `SLO-2026-${String(i).padStart(3, "0")}`;
    const preset = DEMO_ACCOUNTS.find((acc) => acc.employeeId === id);

    const defaultDeptIndex = (i - 1) % DEPARTMENTS.length;
    const deptName = preset?.department ?? DEPARTMENTS[defaultDeptIndex].name;
    const dept =
      DEPARTMENTS.find((d) => d.name === deptName) ??
      DEPARTMENTS[defaultDeptIndex];

    const fullName =
      preset?.fullName ??
      `${FIRST_NAMES[(i - 1) % FIRST_NAMES.length]} ${
        LAST_NAMES[(i * 3) % LAST_NAMES.length]
      }`;

    const position =
      preset?.position ?? dept.positions[i % dept.positions.length];

    const slug = fullName.toLowerCase().replace(/[^a-z]+/g, ".");
    const email = preset?.email ?? `${slug}${i > 2 ? i : ""}@sulo.co.id`;

    const isPkwt = i % 6 === 0;
    const isExpiringSoon = i === 6 || i === 12 || i === 18;

    list.push({
      id,
      nip,
      fullName,
      email,
      phone: `0812${String(34000000 + i * 7919).slice(0, 8)}`,
      nik: `73710${String(10000000000 + i * 19457).slice(0, 11)}`,
      bankName: i % 2 === 0 ? "BCA" : "Mandiri",
      bankAccount: `${String(1000000000 + i * 8431).slice(0, 10)}`,
      department: dept.name,
      position,
      status: i === 48 ? "MAGANG" : isPkwt ? "PKWT" : "PKWTT",
      joinDate: `2025-0${(i % 8) + 1}-10`,
      contractEndDate: isExpiringSoon
        ? "2026-12-10"
        : isPkwt
          ? "2027-06-30"
          : undefined,
      baseSalary: dept.base + (i % 4) * 500_000,
      fixedAllowance: 1_250_000,
      annualLeaveQuota: 12,
      remainingLeaveQuota: 12 - (i % 5),
    });
  }

  return list;
}

export function generateSeedAttendance(
  employees: Employee[],
  todayStr: string,
): AttendanceRecord[] {
  return employees.map((emp, idx) => {
    // Dimas Pratama (emp-002) diset BELUM_ABSEN agar siap dipakai demo Clock-In
    if (emp.id === "emp-002") {
      return {
        id: `att-${todayStr}-${emp.id}`,
        employeeId: emp.id,
        date: todayStr,
        clockIn: null,
        clockOut: null,
        workMode: "WFO",
        status: "BELUM_ABSEN",
        lateMinutes: 0,
      };
    }

    if (idx === 14 || idx === 27) {
      return {
        id: `att-${todayStr}-${emp.id}`,
        employeeId: emp.id,
        date: todayStr,
        clockIn: null,
        clockOut: null,
        workMode: "WFH",
        status: "CUTI_IZIN",
        lateMinutes: 0,
      };
    }

    const isLate = idx % 9 === 3;
    return {
      id: `att-${todayStr}-${emp.id}`,
      employeeId: emp.id,
      date: todayStr,
      clockIn: isLate
        ? "09:18:24"
        : `08:${String(35 + (idx % 24)).padStart(2, "0")}:12`,
      clockOut: null,
      workMode: idx % 4 === 0 ? "WFH" : "WFO",
      status: isLate ? "TERLAMBAT" : "TEPAT_WAKTU",
      lateMinutes: isLate ? 18 : 0,
    };
  });
}

export function generateSeedLeaves(): LeaveRequest[] {
  return [
    {
      id: "LV-2026-001",
      employeeId: "emp-002",
      type: "CUTI_TAHUNAN",
      startDate: "2026-11-25",
      endDate: "2026-11-27",
      effectiveDays: 3,
      reason:
        "Keperluan acara keluarga di luar kota dan penyelesaian urusan administrasi.",
      status: "PENDING",
      submittedAt: "2026-11-18T09:15:00.000Z",
    },
    {
      id: "LV-2026-002",
      employeeId: "emp-005",
      type: "IZIN_SAKIT",
      startDate: "2026-11-19",
      endDate: "2026-11-20",
      effectiveDays: 2,
      reason:
        "Demam tinggi dan disarankan istirahat 2 hari oleh dokter klinik.",
      attachmentName: "surat-dokter-tari.pdf",
      status: "PENDING",
      submittedAt: "2026-11-19T06:40:00.000Z",
    },
    {
      id: "LV-2026-003",
      employeeId: "emp-008",
      type: "CUTI_TAHUNAN",
      startDate: "2026-11-11",
      endDate: "2026-11-13",
      effectiveDays: 3,
      reason: "Cuti tahunan terjadwal.",
      status: "APPROVED",
      submittedAt: "2026-11-04T10:00:00.000Z",
      reviewedBy: "Rina Kusuma",
      reviewedAt: "2026-11-05T14:20:00.000Z",
    },
  ];
}

export function generateSeedPayrolls(employees: Employee[]): PayrollItem[] {
  const octPaid = employees.map((emp, idx) =>
    computeEmployeePayroll({
      employee: emp,
      period: "2026-10",
      lateCount: idx % 9 === 3 ? 2 : 0,
      overtimeHours: idx % 3 === 0 ? 4 : 0,
      status: "PAID",
    }),
  );

  const novDraft = employees.map((emp, idx) =>
    computeEmployeePayroll({
      employee: emp,
      period: "2026-11",
      lateCount: idx % 9 === 3 ? 1 : 0,
      overtimeHours: idx % 4 === 0 ? 3 : 0,
      status: "DRAFT",
    }),
  );

  return [...octPaid, ...novDraft];
}

export function generateInitialAuditLogs(): SecurityAuditEntry[] {
  return [
    {
      id: "AUD-001",
      timestamp: new Date().toISOString(),
      actorName: "System Vault",
      actorRole: "HR_ADMIN",
      action: "VAULT_INITIALIZED",
      severity: "INFO",
      details:
        "SuloHR Tamper-Evident Vault aktif dengan 48 data karyawan PT Sulo.",
    },
  ];
}