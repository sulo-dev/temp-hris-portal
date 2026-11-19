// src/lib/security-utils.ts

/**
 * Masking PII (NIK, Rekening Bank) kecuali 4 digit terakhir
 */
export function maskSensitiveValue(value: string, visibleTail = 4): string {
  if (!value) return "****";
  if (value.length <= visibleTail) return "*".repeat(value.length);
  const tail = value.slice(-visibleTail);
  return `****-****-${tail}`;
}

/**
 * Cegah CSV Formula Injection (=, +, -, @) sesuai Pasal 7.3 PRD
 */
export function sanitizeCsvCell(value: string | number): string {
  const str = String(value ?? "");
  const escapedQuotes = str.replace(/"/g, '""');
  const safeFormula = /^[=+\-@]/.test(escapedQuotes)
    ? `'${escapedQuotes}`
    : escapedQuotes;
  return `"${safeFormula}"`;
}

export function downloadSafeCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const csvContent = [
    headers.map(sanitizeCsvCell).join(","),
    ...rows.map((row) => row.map(sanitizeCsvCell).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Checksum FNV-1a sederhana untuk mendeteksi manipulasi JSON di localStorage
 */
export function computeVaultChecksum(payload: string): string {
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
