// src/lib/schemas.ts
import { z } from "zod";

const sanitizeText = (val: string) => val.replace(/[<>]/g, "").trim();

export const createEmployeeSchema = z.object({
  fullName: z
    .string()
    .min(3, "Nama lengkap minimal 3 karakter")
    .max(80)
    .transform(sanitizeText),
  email: z
    .string()
    .email("Format email tidak valid")
    .endsWith("@sulo.co.id", "Email wajib menggunakan domain @sulo.co.id"),
  phone: z
    .string()
    .regex(
      /^(\+62|62|0)8[1-9][0-9]{7,10}$/,
      "Format nomor HP Indonesia tidak valid",
    ),
  nik: z.string().regex(/^\d{16}$/, "NIK wajib terdiri dari 16 digit angka"),
  bankName: z.string().min(2, "Nama bank wajib diisi"),
  bankAccount: z
    .string()
    .regex(/^\d{8,16}$/, "Nomor rekening wajib 8-16 digit angka"),
  department: z.enum([
    "Engineering",
    "Product & Design",
    "Marketing",
    "Finance",
    "HR",
  ]),
  position: z.string().min(2, "Jabatan wajib diisi").transform(sanitizeText),
  status: z.enum(["PKWTT", "PKWT", "MAGANG"]),
  joinDate: z.string().min(10, "Tanggal bergabung wajib diisi"),
  contractEndDate: z.string().optional(),
  baseSalary: z.number().min(2500000, "Gaji pokok minimal Rp 2.500.000"),
  fixedAllowance: z.number().min(0, "Tunjangan tidak boleh negatif"),
});

export const createLeaveSchema = z
  .object({
    type: z.enum([
      "CUTI_TAHUNAN",
      "IZIN_SAKIT",
      "CUTI_MELAHIRKAN",
      "KLAIM_LEMBUR",
    ]),
    startDate: z.string().min(10, "Tanggal mulai wajib dipilih"),
    endDate: z.string().min(10, "Tanggal selesai wajib dipilih"),
    reason: z
      .string()
      .min(10, "Alasan pengajuan minimal 10 karakter")
      .max(400)
      .transform(sanitizeText),
    attachmentName: z.string().optional(),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai",
    path: ["endDate"],
  });
