// src/components/admin/add-employee-modal.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  UserPlus,
  ShieldCheck,
  Lock,
  UserRound,
  Briefcase,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSuloStore } from "@/store/use-sulo-store";
import { formatRupiah } from "@/lib/business-rules";
import { createEmployeeSchema } from "@/lib/schemas";
import { DepartmentName, EmploymentStatus } from "@/lib/types";
import {
  MagneticAction,
  SULO_SPRING,
} from "@/components/motion/motion-primitives";

const INITIAL_FORM = {
  fullName: "",
  email: "",
  phone: "081234567890",
  nik: "7371012345678901",
  bankName: "BCA",
  bankAccount: "8840192834",
  department: "Engineering" as DepartmentName,
  position: "Frontend Engineer",
  status: "PKWTT" as EmploymentStatus,
  joinDate: "2026-11-19",
  baseSalary: 9500000,
  fixedAllowance: 1250000,
};

const DEPARTMENT_OPTIONS: DepartmentName[] = [
  "Engineering",
  "Product & Design",
  "Marketing",
  "Finance",
  "HR",
];

const STATUS_OPTIONS: { value: EmploymentStatus; label: string }[] = [
  { value: "PKWTT", label: "PKWTT (Tetap)" },
  { value: "PKWT", label: "PKWT (Kontrak)" },
  { value: "MAGANG", label: "Magang" },
];

interface AddEmployeeModalProps {
  onSuccess?: () => void;
}

export function AddEmployeeModal({ onSuccess }: AddEmployeeModalProps) {
  const addEmployee = useSuloStore((s) => s.addEmployee);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Kunci scroll halaman & dukung tombol Escape saat modal terbuka
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setFormError(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const totalBruto =
    (Number.isFinite(formState.baseSalary) ? formState.baseSalary : 0) +
    (Number.isFinite(formState.fixedAllowance) ? formState.fixedAllowance : 0);

  function handleClose() {
    setOpen(false);
    setFormError(null);
  }

  function handleResetForm() {
    setFormState(INITIAL_FORM);
    setFormError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = createEmployeeSchema.safeParse(formState);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Validasi gagal.";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    const res = addEmployee(parsed.data);
    if (res.ok) {
      toast.success(res.message);
      handleResetForm();
      setOpen(false);
      onSuccess?.();
    } else {
      setFormError(res.message);
      toast.error(res.message);
    }
  }

  return (
    <>
      {/* Tombol Pemicu Statis (Bebas SSR Hydration Attribute Mismatch) */}
      <MagneticAction>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-sulo-cta border-0 font-semibold text-white active:scale-[0.98]"
        >
          <UserPlus data-icon="inline-start" />
          Tambah Karyawan
        </Button>
      </MagneticAction>

      {/* Portal Modal Card Tengah Layar */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-employee-modal-title"
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
              >
                {/* Backdrop Blur */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={handleClose}
                  className="fixed inset-0 bg-slate-950/45 backdrop-blur-md"
                />

                {/* Centered Glass Modal Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 12 }}
                  transition={SULO_SPRING}
                  className="glass-sulo-elevated relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/90 bg-white/95 p-5 shadow-2xl sm:p-7"
                >
                  {/* Garis Aksen Atas Dual-Tone */}
                  <div className="bg-sulo-dual-gradient absolute inset-x-0 top-0 h-1.5" />

                  {/* Header Modal */}
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
                    <div className="flex items-start gap-3">
                      <span className="bg-sulo-blue-pill mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow-xs">
                        <ShieldCheck className="size-5" />
                      </span>
                      <div>
                        <h2
                          id="add-employee-modal-title"
                          className="font-display text-lg font-bold text-slate-900 sm:text-xl"
                        >
                          Registrasi{" "}
                          <span className="text-sulo-gradient">
                            Karyawan Baru
                          </span>
                        </h2>
                        <p className="text-xs text-slate-600 sm:text-sm">
                          Data identitas &amp; rekening otomatis diamankan
                          dengan PII masking di dalam Vault PT Sulo.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleClose}
                      aria-label="Tutup modal registrasi"
                      className="rounded-xl border border-slate-200/90 bg-white/80 p-2 text-slate-500 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {/* Form 2 Kolom */}
                  <form
                    onSubmit={handleSubmit}
                    className="mt-5 flex flex-col gap-5"
                  >
                    {formError && (
                      <div
                        role="alert"
                        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700"
                      >
                        {formError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Kolom Kiri: Identitas & Kontak */}
                      <fieldset className="flex flex-col gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                        <legend className="flex items-center gap-1.5 px-2 text-[11px] font-bold tracking-wider text-blue-700 uppercase">
                          <UserRound className="size-3.5" />
                          Identitas &amp; Kontak
                        </legend>

                        <div className="flex flex-col gap-1.5">
                          <Label
                            htmlFor="emp-fullname"
                            className="text-xs font-semibold text-slate-700"
                          >
                            Nama Lengkap
                          </Label>
                          <Input
                            id="emp-fullname"
                            value={formState.fullName}
                            onChange={(e) =>
                              setFormState({
                                ...formState,
                                fullName: e.target.value,
                              })
                            }
                            placeholder="Contoh: Andi Saputra"
                            className="border-slate-200/90 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-500"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <Label
                            htmlFor="emp-email"
                            className="text-xs font-semibold text-slate-700"
                          >
                            Email Kantor (@sulo.co.id)
                          </Label>
                          <Input
                            id="emp-email"
                            type="email"
                            value={formState.email}
                            onChange={(e) =>
                              setFormState({
                                ...formState,
                                email: e.target.value,
                              })
                            }
                            placeholder="andi.saputra@sulo.co.id"
                            className="border-slate-200/90 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="flex flex-col gap-1.5">
                            <Label
                              htmlFor="emp-phone"
                              className="text-xs font-semibold text-slate-700"
                            >
                              Nomor HP
                            </Label>
                            <Input
                              id="emp-phone"
                              value={formState.phone}
                              onChange={(e) =>
                                setFormState({
                                  ...formState,
                                  phone: e.target.value,
                                })
                              }
                              className="border-slate-200/90 bg-white font-mono text-slate-900 tabular-nums"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <Label
                              htmlFor="emp-nik"
                              className="text-xs font-semibold text-slate-700"
                            >
                              NIK (16 Digit KTP)
                            </Label>
                            <Input
                              id="emp-nik"
                              maxLength={16}
                              value={formState.nik}
                              onChange={(e) =>
                                setFormState({
                                  ...formState,
                                  nik: e.target.value,
                                })
                              }
                              className="border-slate-200/90 bg-white font-mono text-slate-900 tabular-nums"
                            />
                          </div>
                        </div>
                      </fieldset>

                      {/* Kolom Kanan: Penempatan & Kompensasi */}
                      <div className="flex flex-col gap-4">
                        <fieldset className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                          <legend className="flex items-center gap-1.5 px-2 text-[11px] font-bold tracking-wider text-orange-600 uppercase">
                            <Briefcase className="size-3.5" />
                            Penempatan &amp; Kontrak
                          </legend>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                              <Label
                                htmlFor="emp-dept"
                                className="text-xs font-semibold text-slate-700"
                              >
                                Departemen
                              </Label>
                              <Select
                                value={formState.department}
                                onValueChange={(val) => {
                                  if (val) {
                                    setFormState({
                                      ...formState,
                                      department: val as DepartmentName,
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger
                                  id="emp-dept"
                                  className="w-full border-slate-200/90 bg-white text-slate-900"
                                >
                                  <SelectValue placeholder="Pilih departemen" />
                                </SelectTrigger>
                                <SelectContent className="z-[60] border-slate-200 bg-white text-slate-900 shadow-xl">
                                  <SelectGroup>
                                    {DEPARTMENT_OPTIONS.map((dept) => (
                                      <SelectItem key={dept} value={dept}>
                                        {dept}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <Label
                                htmlFor="emp-status"
                                className="text-xs font-semibold text-slate-700"
                              >
                                Status Kerja
                              </Label>
                              <Select
                                value={formState.status}
                                onValueChange={(val) => {
                                  if (val) {
                                    setFormState({
                                      ...formState,
                                      status: val as EmploymentStatus,
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger
                                  id="emp-status"
                                  className="w-full border-slate-200/90 bg-white text-slate-900"
                                >
                                  <SelectValue placeholder="Pilih status" />
                                </SelectTrigger>
                                <SelectContent className="z-[60] border-slate-200 bg-white text-slate-900 shadow-xl">
                                  <SelectGroup>
                                    {STATUS_OPTIONS.map((opt) => (
                                      <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                      >
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                              <Label
                                htmlFor="emp-position"
                                className="text-xs font-semibold text-slate-700"
                              >
                                Jabatan
                              </Label>
                              <Input
                                id="emp-position"
                                value={formState.position}
                                onChange={(e) =>
                                  setFormState({
                                    ...formState,
                                    position: e.target.value,
                                  })
                                }
                                className="border-slate-200/90 bg-white text-slate-900"
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <Label
                                htmlFor="emp-joindate"
                                className="text-xs font-semibold text-slate-700"
                              >
                                Tanggal Bergabung
                              </Label>
                              <Input
                                id="emp-joindate"
                                type="date"
                                value={formState.joinDate}
                                onChange={(e) =>
                                  setFormState({
                                    ...formState,
                                    joinDate: e.target.value,
                                  })
                                }
                                className="border-slate-200/90 bg-white font-mono text-slate-900 tabular-nums"
                              />
                            </div>
                          </div>
                        </fieldset>

                        <fieldset className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                          <legend className="flex items-center gap-1.5 px-2 text-[11px] font-bold tracking-wider text-emerald-700 uppercase">
                            <Wallet className="size-3.5" />
                            Rekening &amp; Kompensasi
                          </legend>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="flex flex-col gap-1.5">
                              <Label
                                htmlFor="emp-bank"
                                className="text-xs font-semibold text-slate-700"
                              >
                                Bank
                              </Label>
                              <Input
                                id="emp-bank"
                                value={formState.bankName}
                                onChange={(e) =>
                                  setFormState({
                                    ...formState,
                                    bankName: e.target.value,
                                  })
                                }
                                className="border-slate-200/90 bg-white text-slate-900"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                              <Label
                                htmlFor="emp-rekening"
                                className="text-xs font-semibold text-slate-700"
                              >
                                Nomor Rekening
                              </Label>
                              <Input
                                id="emp-rekening"
                                value={formState.bankAccount}
                                onChange={(e) =>
                                  setFormState({
                                    ...formState,
                                    bankAccount: e.target.value,
                                  })
                                }
                                className="border-slate-200/90 bg-white font-mono text-slate-900 tabular-nums"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                              <Label
                                htmlFor="emp-salary"
                                className="text-xs font-semibold text-slate-700"
                              >
                                Gaji Pokok (IDR)
                              </Label>
                              <Input
                                id="emp-salary"
                                type="number"
                                min={0}
                                value={formState.baseSalary}
                                onChange={(e) =>
                                  setFormState({
                                    ...formState,
                                    baseSalary: Number(e.target.value),
                                  })
                                }
                                className="border-slate-200/90 bg-white font-mono text-slate-900 tabular-nums"
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <Label
                                htmlFor="emp-allowance"
                                className="text-xs font-semibold text-slate-700"
                              >
                                Tunjangan Tetap (IDR)
                              </Label>
                              <Input
                                id="emp-allowance"
                                type="number"
                                min={0}
                                value={formState.fixedAllowance}
                                onChange={(e) =>
                                  setFormState({
                                    ...formState,
                                    fixedAllowance: Number(e.target.value),
                                  })
                                }
                                className="border-slate-200/90 bg-white font-mono text-slate-900 tabular-nums"
                              />
                            </div>
                          </div>
                        </fieldset>
                      </div>
                    </div>

                    {/* Footer Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4">
                      <div className="inline-flex items-center gap-2 rounded-xl border border-blue-200/80 bg-blue-50/70 px-3 py-1.5 text-xs">
                        <span className="font-medium text-slate-600">
                          Estimasi Bruto/Bln:
                        </span>
                        <span className="font-mono font-bold text-blue-700 tabular-nums">
                          {formatRupiah(totalBruto)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleClose}
                          className="border-slate-200/90 bg-white text-slate-700 hover:bg-slate-100"
                        >
                          Batal
                        </Button>
                        <Button
                          type="submit"
                          className="bg-sulo-cta border-0 px-5 font-semibold text-white active:scale-[0.98]"
                        >
                          <Lock data-icon="inline-start" />
                          Simpan ke Vault PT Sulo
                        </Button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}