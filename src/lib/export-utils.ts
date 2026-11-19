// src/lib/export-utils.ts
import { Employee, PayrollItem } from "@/lib/types";
import { maskSensitiveValue } from "@/lib/security-utils";

export interface ExportFilterMeta {
  search: string;
  department: string;
  status: string;
}

/**
 * Memicu unduhan file di browser secara reliabel
 */
function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1500);
}

/**
 * Sanitasi nilai sel CSV (RFC-4180 + perlindungan CSV Formula Injection)
 */
function sanitizeCsvCell(
  value: string | number | null | undefined,
  delimiter: string,
): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  const raw = value === null || value === undefined ? "" : String(value).trim();
  const normalizedSpace = raw.replace(/\s+/g, " ");
  const safeValue = /^[=+\-@]/.test(normalizedSpace)
    ? `'${normalizedSpace}`
    : normalizedSpace;

  // Bungkus dengan tanda kutip jika mengandung delimiter, kutip ganda, atau baris baru
  if (
    safeValue.includes(delimiter) ||
    safeValue.includes('"') ||
    safeValue.includes("\n") ||
    safeValue.includes("\r")
  ) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }

  return safeValue;
}

/**
 * Format nomor HP menjadi 0812-3456-7890 agar Excel tidak menghilangkan angka 0 di depan
 */
function formatPhonePretty(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  return phone;
}

/**
 * Format tanggal ISO (YYYY-MM-DD) menjadi DD/MM/YYYY
 */
function formatDateIndo(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

function formatStatusLabel(status: Employee["status"]): string {
  switch (status) {
    case "PKWTT":
      return "PKWTT (Tetap)";
    case "PKWT":
      return "PKWT (Kontrak)";
    case "MAGANG":
      return "Magang";
    default:
      return status;
  }
}

/**
 * Ekspor direktori karyawan ke CSV dengan tata letak tabel yang bersih & terstruktur
 */
export function exportEmployeesToCsv(
  employees: Employee[],
  meta: ExportFilterMeta,
): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  const deptSlug =
    meta.department === "ALL"
      ? "Semua-Divisi"
      : meta.department.replace(/[^a-zA-Z0-9]+/g, "-");
  const filename = `PT-Sulo_Direktori-Karyawan_${deptSlug}_${timestamp}.csv`;

  // Titik koma (;) adalah standar pemisah kolom Excel di Indonesia
  const delimiter = ";";

  // Urutkan baris berdasarkan Departemen lalu NIP agar isi tabel terkelompok rapi
  const sortedEmployees = [...employees].sort(
    (a, b) =>
      a.department.localeCompare(b.department, "id") ||
      a.nip.localeCompare(b.nip, "id"),
  );

  const headers = [
    "NO",
    "NIP",
    "NAMA LENGKAP",
    "DEPARTEMEN",
    "JABATAN",
    "STATUS KERJA",
    "TANGGAL BERGABUNG",
    "EMAIL KANTOR",
    "NO. TELEPON",
    "BANK",
    "NO. REKENING (MASKED)",
    "NIK (MASKED)",
    "SISA CUTI (HARI)",
    "STATUS VAULT",
  ];

  const rows = sortedEmployees.map((emp, idx) => [
    String(idx + 1).padStart(3, "0"),
    emp.nip.toUpperCase(),
    emp.fullName.trim(),
    emp.department,
    emp.position.trim(),
    formatStatusLabel(emp.status),
    formatDateIndo(emp.joinDate),
    emp.email.trim().toLowerCase(),
    formatPhonePretty(emp.phone),
    emp.bankName.toUpperCase(),
    maskSensitiveValue(emp.bankAccount),
    maskSensitiveValue(emp.nik),
    emp.remainingLeaveQuota, // Angka murni agar bisa langsung di-SUM/AVERAGE di Excel
    "TERENKRIPSI (UU PDP)",
  ]);

  const csvLines = [
    // Instruksi eksplisit agar Microsoft Excel otomatis memecah kolom berdasarkan ';'
    `sep=${delimiter}`,
    headers.map((h) => sanitizeCsvCell(h, delimiter)).join(delimiter),
    ...rows.map((row) =>
      row.map((cell) => sanitizeCsvCell(cell, delimiter)).join(delimiter),
    ),
  ];

  const csvContent = csvLines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerBrowserDownload(blob, filename);

  return filename;
}

/**
 * Helper escape karakter khusus PDF string literal (...)
 */
function escapePdfText(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 2))}..`;
}

/**
 * Generator Binary PDF 1.4 (A4 Landscape: 841.89 x 595.28 pt)
 */
export function exportEmployeesToPdf(
  employees: Employee[],
  meta: ExportFilterMeta,
): string {
  const now = new Date();
  const dateSlug = now.toISOString().slice(0, 10);
  const printedAt = now.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const filename = `PT-Sulo_Direktori-Karyawan_${dateSlug}.pdf`;

  const sortedEmployees = [...employees].sort(
    (a, b) =>
      a.department.localeCompare(b.department, "id") ||
      a.nip.localeCompare(b.nip, "id"),
  );

  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const marginX = 36;
  const contentWidth = pageWidth - marginX * 2;

  const rowsPerPage = 16;
  const totalPages = Math.max(
    1,
    Math.ceil(sortedEmployees.length / rowsPerPage),
  );

  const pkwttCount = sortedEmployees.filter((e) => e.status === "PKWTT").length;
  const pkwtCount = sortedEmployees.filter((e) => e.status === "PKWT").length;
  const internCount = sortedEmployees.filter(
    (e) => e.status === "MAGANG",
  ).length;

  const columns = [
    { label: "NO", width: 28, align: "left" as const },
    { label: "NIP", width: 82, align: "left" as const },
    { label: "NAMA LENGKAP", width: 155, align: "left" as const },
    { label: "DEPARTEMEN", width: 112, align: "left" as const },
    { label: "JABATAN", width: 138, align: "left" as const },
    { label: "STATUS", width: 62, align: "left" as const },
    { label: "REKENING (PII)", width: 122, align: "left" as const },
    { label: "SISA CUTI", width: 70.89, align: "right" as const },
  ];

  const pageStreams: string[] = [];

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const ops: string[] = [];
    const sliceStart = pageIdx * rowsPerPage;
    const pageRows = sortedEmployees.slice(
      sliceStart,
      sliceStart + rowsPerPage,
    );

    ops.push(`1 1 1 rg 0 0 ${pageWidth} ${pageHeight} re f`);
    ops.push(
      `0.114 0.306 0.847 rg 0 ${pageHeight - 8} ${pageWidth * 0.65} 8 re f`,
    );
    ops.push(
      `0.980 0.302 0.035 rg ${pageWidth * 0.65} ${pageHeight - 8} ${pageWidth * 0.35} 8 re f`,
    );

    const headerTop = pageHeight - 24;
    const headerHeight = 64;
    ops.push(
      `0.969 0.980 0.996 rg ${marginX} ${headerTop - headerHeight} ${contentWidth} ${headerHeight} re f`,
    );
    ops.push(
      `0.855 0.894 0.953 RG 0.8 w ${marginX} ${headerTop - headerHeight} ${contentWidth} ${headerHeight} re S`,
    );

    ops.push(`0.114 0.306 0.847 rg ${marginX + 14} ${headerTop - 24} 78 15 re f`);
    ops.push(
      `BT /F2 7.5 Tf 1 1 1 rg ${marginX + 20} ${headerTop - 19.5} Td (SULOHR VAULT) Tj ET`,
    );

    ops.push(
      `BT /F2 15 Tf 0.059 0.090 0.165 rg ${marginX + 14} ${headerTop - 43} Td (Laporan Direktori & Vault Karyawan PT Sulo) Tj ET`,
    );
    ops.push(
      `BT /F1 8.5 Tf 0.392 0.455 0.545 rg ${marginX + 14} ${headerTop - 56} Td (${escapePdfText(
        `Filter Departemen: ${meta.department}  |  Status: ${meta.status}  |  Pencarian: ${meta.search || "Semua"}`,
      )}) Tj ET`,
    );

    ops.push(
      `BT /F2 8.5 Tf 0.918 0.345 0.047 rg ${pageWidth - marginX - 185} ${headerTop - 24} Td (DOKUMEN TERKENDALI - UU PDP) Tj ET`,
    );
    ops.push(
      `BT /F1 8 Tf 0.278 0.333 0.412 rg ${pageWidth - marginX - 185} ${headerTop - 38} Td (${escapePdfText(
        `Dicetak: ${printedAt} WITA`,
      )}) Tj ET`,
    );
    ops.push(
      `BT /F3 8 Tf 0.278 0.333 0.412 rg ${pageWidth - marginX - 185} ${headerTop - 51} Td (${escapePdfText(
        `Total Data: ${sortedEmployees.length} Karyawan`,
      )}) Tj ET`,
    );

    const kpiTop = headerTop - headerHeight - 12;
    const kpiHeight = 36;
    const kpiGap = 10;
    const kpiWidth = (contentWidth - kpiGap * 3) / 4;

    const kpis = [
      {
        title: "TOTAL TERFILTER",
        value: `${sortedEmployees.length} Staf`,
        accent: "0.114 0.306 0.847",
      },
      {
        title: "KARYAWAN TETAP (PKWTT)",
        value: `${pkwttCount} Staf`,
        accent: "0.063 0.725 0.506",
      },
      {
        title: "KONTRAK (PKWT)",
        value: `${pkwtCount} Staf`,
        accent: "0.976 0.451 0.086",
      },
      {
        title: "PROGRAM MAGANG",
        value: `${internCount} Staf`,
        accent: "0.055 0.647 0.914",
      },
    ];

    kpis.forEach((kpi, idx) => {
      const kx = marginX + idx * (kpiWidth + kpiGap);
      ops.push(
        `1 1 1 rg ${kx} ${kpiTop - kpiHeight} ${kpiWidth} ${kpiHeight} re f`,
      );
      ops.push(
        `0.886 0.910 0.941 RG 0.7 w ${kx} ${kpiTop - kpiHeight} ${kpiWidth} ${kpiHeight} re S`,
      );
      ops.push(`${kpi.accent} rg ${kx} ${kpiTop - 3} ${kpiWidth} 3 re f`);
      ops.push(
        `BT /F2 6.8 Tf 0.392 0.455 0.545 rg ${kx + 10} ${kpiTop - 15} Td (${escapePdfText(kpi.title)}) Tj ET`,
      );
      ops.push(
        `BT /F2 11 Tf 0.059 0.090 0.165 rg ${kx + 10} ${kpiTop - 29} Td (${escapePdfText(kpi.value)}) Tj ET`,
      );
    });

    const tableTop = kpiTop - kpiHeight - 14;
    const tableHeaderHeight = 24;
    ops.push(
      `0.114 0.306 0.847 rg ${marginX} ${tableTop - tableHeaderHeight} ${contentWidth} ${tableHeaderHeight} re f`,
    );

    let cursorX = marginX;
    columns.forEach((col) => {
      const textX =
        col.align === "right" ? cursorX + col.width - 48 : cursorX + 8;
      ops.push(
        `BT /F2 7.5 Tf 1 1 1 rg ${textX} ${tableTop - 15.5} Td (${escapePdfText(col.label)}) Tj ET`,
      );
      cursorX += col.width;
    });

    const rowHeight = 22;
    let currentY = tableTop - tableHeaderHeight;

    pageRows.forEach((emp, rowIdx) => {
      const globalIndex = sliceStart + rowIdx + 1;
      const rowBottom = currentY - rowHeight;

      if (rowIdx % 2 === 1) {
        ops.push(
          `0.973 0.980 0.988 rg ${marginX} ${rowBottom} ${contentWidth} ${rowHeight} re f`,
        );
      }

      ops.push(
        `0.886 0.910 0.941 RG 0.5 w ${marginX} ${rowBottom} m ${marginX + contentWidth} ${rowBottom} l S`,
      );

      const cells = [
        {
          text: String(globalIndex),
          font: "/F3",
          color: "0.392 0.455 0.545",
          max: 4,
        },
        { text: emp.nip, font: "/F3", color: "0.114 0.306 0.847", max: 14 },
        {
          text: emp.fullName,
          font: "/F2",
          color: "0.059 0.090 0.165",
          max: 25,
        },
        {
          text: emp.department,
          font: "/F1",
          color: "0.200 0.255 0.333",
          max: 19,
        },
        {
          text: emp.position,
          font: "/F1",
          color: "0.200 0.255 0.333",
          max: 23,
        },
        {
          text: emp.status,
          font: "/F2",
          color:
            emp.status === "PKWTT"
              ? "0.020 0.588 0.412"
              : emp.status === "PKWT"
                ? "0.918 0.345 0.047"
                : "0.008 0.518 0.780",
          max: 10,
        },
        {
          text: `${emp.bankName} ${maskSensitiveValue(emp.bankAccount)}`,
          font: "/F3",
          color: "0.278 0.333 0.412",
          max: 20,
        },
        {
          text: `${emp.remainingLeaveQuota} Hari`,
          font: "/F2",
          color:
            emp.remainingLeaveQuota <= 3
              ? "0.918 0.345 0.047"
              : "0.059 0.090 0.165",
          max: 10,
        },
      ];

      let cellX = marginX;
      cells.forEach((cell, cIdx) => {
        const col = columns[cIdx];
        const safeStr = escapePdfText(truncateText(cell.text, cell.max));
        const tx =
          col.align === "right" ? cellX + col.width - 44 : cellX + 8;
        ops.push(
          `BT ${cell.font} 8 Tf ${cell.color} rg ${tx} ${rowBottom + 7.5} Td (${safeStr}) Tj ET`,
        );
        cellX += col.width;
      });

      currentY = rowBottom;
    });

    const tableBottom = currentY;
    ops.push(
      `0.796 0.835 0.882 RG 0.8 w ${marginX} ${tableBottom} ${contentWidth} ${tableTop - tableBottom} re S`,
    );

    const footerY = 24;
    ops.push(
      `0.886 0.910 0.941 RG 0.6 w ${marginX} ${footerY + 12} m ${marginX + contentWidth} ${footerY + 12} l S`,
    );
    ops.push(
      `BT /F1 7.5 Tf 0.392 0.455 0.545 rg ${marginX} ${footerY} Td (PT Sulo Human Resource Information System  •  Data PII disamarkan sesuai kepatuhan UU PDP) Tj ET`,
    );
    ops.push(
      `BT /F2 8 Tf 0.114 0.306 0.847 rg ${pageWidth - marginX - 78} ${footerY} Td (${escapePdfText(
        `Halaman ${pageIdx + 1} dari ${totalPages}`,
      )}) Tj ET`,
    );

    pageStreams.push(ops.join("\n"));
  }

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let currentOffset = 0;

  const pushString = (str: string) => {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  pushString("%PDF-1.4\n");
  pushBytes(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  const maxObjId = 5 + totalPages * 2;
  const offsets: number[] = new Array(maxObjId + 1).fill(0);

  const beginObj = (id: number) => {
    offsets[id] = currentOffset;
    pushString(`${id} 0 obj\n`);
  };

  const endObj = () => {
    pushString("\nendobj\n");
  };

  beginObj(1);
  pushString("<< /Type /Catalog /Pages 2 0 R >>");
  endObj();

  const kidsRefs = Array.from(
    { length: totalPages },
    (_, i) => `${6 + i * 2} 0 R`,
  ).join(" ");
  beginObj(2);
  pushString(`<< /Type /Pages /Kids [${kidsRefs}] /Count ${totalPages} >>`);
  endObj();

  beginObj(3);
  pushString(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  );
  endObj();

  beginObj(4);
  pushString(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  );
  endObj();

  beginObj(5);
  pushString(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>",
  );
  endObj();

  for (let i = 0; i < totalPages; i++) {
    const pageObjId = 6 + i * 2;
    const contentObjId = 7 + i * 2;
    const streamBytes = encoder.encode(pageStreams[i]);

    beginObj(pageObjId);
    pushString(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentObjId} 0 R >>`,
    );
    endObj();

    beginObj(contentObjId);
    pushString(`<< /Length ${streamBytes.length} >>\nstream\n`);
    pushBytes(streamBytes);
    pushString("\nendstream");
    endObj();
  }

  const xrefOffset = currentOffset;
  pushString(`xref\n0 ${maxObjId + 1}\n`);
  pushString("0000000000 65535 f \r\n");
  for (let id = 1; id <= maxObjId; id++) {
    pushString(`${String(offsets[id]).padStart(10, "0")} 00000 n \r\n`);
  }

  pushString(
    `trailer\n<< /Size ${maxObjId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  );

  const mergedPdf = new Uint8Array(currentOffset);
  let writePos = 0;
  for (const chunk of chunks) {
    mergedPdf.set(chunk, writePos);
    writePos += chunk.length;
  }

  const pdfBlob = new Blob([mergedPdf], { type: "application/pdf" });
  triggerBrowserDownload(pdfBlob, filename);

  return filename;
}
// Tambahkan import di bagian atas src/lib/export-utils.ts:
import {
  AttendanceRecord,
  formatWorkDuration,
  getLateMinutes,
} from "@/lib/attendance-utils";

export interface AttendanceExportRow {
  employee: Employee;
  record: AttendanceRecord;
}

export interface AttendanceExportMeta {
  date: string;
  department: string;
  status: string;
}

export function exportAttendanceToCsv(
  rows: AttendanceExportRow[],
  meta: AttendanceExportMeta,
): string {
  const deptSlug =
    meta.department === "ALL"
      ? "Semua-Divisi"
      : meta.department.replace(/[^a-zA-Z0-9]+/g, "-");
  const filename = `PT-Sulo_Log-Presensi_${deptSlug}_${meta.date}.csv`;
  const delimiter = ";";

  const sortedRows = [...rows].sort(
    (a, b) =>
      a.employee.department.localeCompare(b.employee.department, "id") ||
      a.employee.nip.localeCompare(b.employee.nip, "id"),
  );

  const headers = [
    "NO",
    "TANGGAL",
    "NIP",
    "NAMA LENGKAP",
    "DEPARTEMEN",
    "MODE KERJA",
    "JAM MASUK (WITA)",
    "JAM PULANG (WITA)",
    "KETERLAMBATAN (MENIT)",
    "DURASI KERJA",
    "STATUS KEHADIRAN",
    "LOKASI VERIFIKASI",
    "CATATAN AUDIT",
  ];

  const csvRows = sortedRows.map(({ employee, record }, idx) => [
    String(idx + 1).padStart(3, "0"),
    formatDateIndo(record.date),
    employee.nip.toUpperCase(),
    employee.fullName.trim(),
    employee.department,
    record.workMode,
    record.checkIn ?? "-",
    record.checkOut ?? (record.status === "IZIN_CUTI" ? "-" : "Aktif"),
    record.status === "TERLAMBAT" ? getLateMinutes(record.checkIn) : 0, // Angka murni untuk =SUM() di Excel
    formatWorkDuration(record.checkIn, record.checkOut),
    record.status,
    record.location,
    record.notes,
  ]);

  const csvLines = [
    `sep=${delimiter}`,
    headers.map((h) => sanitizeCsvCell(h, delimiter)).join(delimiter),
    ...csvRows.map((row) =>
      row.map((cell) => sanitizeCsvCell(cell, delimiter)).join(delimiter),
    ),
  ];

  const blob = new Blob([csvLines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  triggerBrowserDownload(blob, filename);

  return filename;
}

// Tambahkan import di bagian atas src/lib/export-utils.ts:
import {
  ApprovalRequest,
  getApprovalCategoryLabel,
} from "@/lib/approval-utils";

export interface ApprovalExportRow {
  request: ApprovalRequest;
  employee: Employee;
}

export function exportApprovalsToCsv(
  rows: ApprovalExportRow[],
  filterStatus: string,
): string {
  const dateSlug = new Date().toISOString().slice(0, 10);
  const filename = `PT-Sulo_Antrean-Approval_${filterStatus}_${dateSlug}.csv`;
  const delimiter = ";";

  const headers = [
    "NO",
    "KODE TIKET",
    "NIP",
    "NAMA LENGKAP",
    "DEPARTEMEN",
    "KATEGORI PENGAJUAN",
    "TANGGAL MULAI",
    "TANGGAL SELESAI",
    "DURASI",
    "STATUS",
    "ALASAN PEMOHON",
    "CATATAN REVIEWER",
  ];

  const csvRows = rows.map(({ request, employee }, idx) => [
    String(idx + 1).padStart(3, "0"),
    request.ticketCode,
    employee.nip.toUpperCase(),
    employee.fullName.trim(),
    employee.department,
    getApprovalCategoryLabel(request.category),
    formatDateIndo(request.startDate),
    formatDateIndo(request.endDate),
    request.durationLabel,
    request.status,
    request.reason,
    request.reviewerNote ?? "-",
  ]);

  const csvLines = [
    `sep=${delimiter}`,
    headers.map((h) => sanitizeCsvCell(h, delimiter)).join(delimiter),
    ...csvRows.map((row) =>
      row.map((cell) => sanitizeCsvCell(cell, delimiter)).join(delimiter),
    ),
  ];

  const blob = new Blob([csvLines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  triggerBrowserDownload(blob, filename);

  return filename;
}

export interface PayrollExportRow {
  item: PayrollItem;
  employee: Employee;
}

/**
 * Ekspor rekap payroll periode aktif ke CSV (sep=; + angka murni agar langsung bisa di-SUM di Excel)
 */
export function exportPayrollToCsv(
  rows: PayrollExportRow[],
  period: string,
): string {
  const filename = `PT-Sulo_Rekap-Payroll_${period}.csv`;
  const delimiter = ";";

  const sortedRows = [...rows].sort(
    (a, b) =>
      a.employee.department.localeCompare(b.employee.department, "id") ||
      a.employee.nip.localeCompare(b.employee.nip, "id"),
  );

  const headers = [
    "NO",
    "PERIODE",
    "NIP",
    "NAMA LENGKAP",
    "DEPARTEMEN",
    "JABATAN",
    "GAJI POKOK (IDR)",
    "TUNJANGAN TETAP (IDR)",
    "UANG LEMBUR (IDR)",
    "TOTAL PENERIMAAN (IDR)",
    "POTONGAN TELAT (IDR)",
    "BPJS KESEHATAN 1% (IDR)",
    "BPJS TK JHT 2% (IDR)",
    "PPH 21 TER (IDR)",
    "TOTAL POTONGAN (IDR)",
    "TAKE HOME PAY (IDR)",
    "STATUS",
    "HASH VERIFIKASI",
  ];

  const csvRows = sortedRows.map(({ item, employee }, idx) => [
    String(idx + 1).padStart(3, "0"),
    item.period,
    employee.nip.toUpperCase(),
    employee.fullName.trim(),
    employee.department,
    employee.position,
    item.baseSalary,
    item.fixedAllowance,
    item.overtimePay,
    item.totalEarnings,
    item.lateDeduction,
    item.bpjsKesehatan,
    item.bpjsTkJht,
    item.pph21,
    item.totalDeductions,
    item.takeHomePay,
    item.status,
    item.verificationHash,
  ]);

  const csvLines = [
    `sep=${delimiter}`,
    headers.map((h) => sanitizeCsvCell(h, delimiter)).join(delimiter),
    ...csvRows.map((row) =>
      row.map((cell) => sanitizeCsvCell(cell, delimiter)).join(delimiter),
    ),
  ];

  const blob = new Blob([csvLines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  triggerBrowserDownload(blob, filename);

  return filename;
}