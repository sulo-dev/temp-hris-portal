// src/app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Lock,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Building2,
  Sparkles,
  AlertCircle,
  LogIn,
  UserCog,
  User,
  CopyCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSuloStore } from "@/store/use-sulo-store";
import {
  DEMO_ACCOUNTS,
  DEMO_DEFAULT_PASSWORD,
  type DemoAccountPreset,
} from "@/lib/seed-data";
import type { UserRole } from "@/lib/types";
import {
  LivePulseBeacon,
  MagneticAction,
  SULO_SPRING,
  SpatialBackdrop,
} from "@/components/motion/motion-primitives";

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function LoginPage() {
  const router = useRouter();
  const initVault = useSuloStore((s) => s.initVault);
  const loginWithCredentials = useSuloStore((s) => s.loginWithCredentials);
  const loginAsEmployee = useSuloStore((s) => s.loginAsEmployee);

  const [identifier, setIdentifier] = useState("SLO-2026-001");
  const [password, setPassword] = useState(DEMO_DEFAULT_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<UserRole>("HR_ADMIN");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    initVault();
  }, [initVault]);

  function handleQuickLogin(account: DemoAccountPreset) {
    setErrorMessage("");
    const result = loginAsEmployee(account.employeeId, account.role);
    if (!result.ok || !result.redirectTo) {
      setErrorMessage(result.message);
      return;
    }
    toast.success(result.message);
    router.push(result.redirectTo);
  }

  function handleFillForm(account: DemoAccountPreset) {
    setIdentifier(account.nip);
    setPassword(account.password);
    setSelectedPortal(account.role);
    setErrorMessage("");
    toast.info(`Kredensial ${account.fullName} (${account.nip}) diisi.`);
  }

  function handleCredentialSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    const result = loginWithCredentials(identifier, password, selectedPortal);
    if (!result.ok || !result.redirectTo) {
      setErrorMessage(result.message);
      return;
    }

    toast.success(result.message);
    router.push(result.redirectTo);
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50/75 px-4 py-10 text-slate-900 selection:bg-orange-500/20 selection:text-orange-900 sm:px-6">
      <SpatialBackdrop />

      <div className="relative z-10 mx-auto grid w-full max-w-[1180px] grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        {/* Panel Kiri: Daftar Akun Dummy Terstruktur dari DEMO_ACCOUNTS */}
        <div className="glass-sulo-card relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-white/90 p-6 sm:p-8 lg:col-span-7">
          <div className="bg-sulo-blue-pill absolute inset-x-0 top-0 h-1.5" />

          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-sulo-dual-gradient flex size-11 items-center justify-center rounded-2xl font-mono text-base font-extrabold text-white shadow-sm">
                  SH
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xl font-extrabold tracking-tight text-slate-900">
                      Sulo<span className="text-sulo-gradient">HR</span>
                    </span>
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50/90 font-mono text-[10px] font-bold text-blue-700"
                    >
                      v2.6 ENTERPRISE
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    Human Capital, Payroll &amp; Employee Self-Service
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 sm:inline-flex">
                <LivePulseBeacon colorClass="bg-emerald-500" />
                <span>48 Data Aktif</span>
              </div>
            </div>

            <div className="mt-5">
              <h1 className="font-display text-2xl leading-snug font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Pilih Akun Demo atau{" "}
                <span className="text-sulo-gradient">Masuk dengan NIP</span>
              </h1>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                Seluruh akun di bawah terhubung langsung ke{" "}
                <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-800">
                  useSuloStore
                </code>{" "}
                dengan kata sandi default{" "}
                <code className="rounded bg-orange-50 px-1.5 py-0.5 font-mono text-xs font-bold text-orange-700">
                  {DEMO_DEFAULT_PASSWORD}
                </code>
                .
              </p>
            </div>
          </div>

          {/* Kartu Akun Dummy Utama */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Sparkles className="size-3.5 text-orange-500" />
                Daftar Kredensial Dummy Utama
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                Klik kartu untuk langsung masuk
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const isAdmin = acc.role === "HR_ADMIN";
                return (
                  <div
                    key={acc.employeeId}
                    className="flex flex-col justify-between gap-2.5 rounded-2xl border border-slate-200/90 bg-white/90 p-3.5 shadow-2xs transition-all hover:border-blue-300 hover:shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div
                          className={`flex size-9 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold text-white ${
                            isAdmin ? "bg-sulo-cta" : "bg-sulo-blue-pill"
                          }`}
                        >
                          {getInitials(acc.fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-900">
                            {acc.fullName}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">
                            {acc.position}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                          isAdmin
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {isAdmin ? "HR ADMIN" : "ESS"}
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-50/90 px-2.5 py-2 font-mono text-[11px] text-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">NIP:</span>
                        <span className="font-bold text-slate-900">
                          {acc.nip}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="text-slate-400">Email:</span>
                        <span className="truncate text-slate-700">
                          {acc.email}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] leading-snug text-slate-500">
                      {acc.highlight}
                    </p>

                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleQuickLogin(acc)}
                        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-95 ${
                          isAdmin ? "bg-sulo-cta" : "bg-sulo-blue-pill"
                        }`}
                      >
                        <span>Masuk</span>
                        <ArrowRight className="size-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleFillForm(acc)}
                        title="Salin NIP & Password ke formulir kanan"
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                      >
                        <CopyCheck className="size-3.5" />
                        <span>Isi</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/75 pt-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              Kepatuhan UU PDP No. 27/2022 &amp; Audit Trail Aktif
            </span>
            <span className="font-mono">
              Akun lain: SLO-2026-001 s/d SLO-2026-048
            </span>
          </div>
        </div>

        {/* Panel Kanan: Formulir Login Manual */}
        <div className="glass-sulo-elevated relative flex flex-col justify-between rounded-3xl border border-white/95 p-6 shadow-md sm:p-8 lg:col-span-5">
          <div className="bg-sulo-dual-gradient absolute inset-x-0 top-0 h-1.5 rounded-t-3xl" />

          <div>
            <div className="mb-6">
              <Badge
                variant="outline"
                className="mb-2 border-orange-200 bg-orange-50/80 font-mono text-[11px] font-semibold text-orange-700"
              >
                <Lock className="mr-1 size-3" />
                LOGIN KREDENSIAL
              </Badge>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Masuk ke SuloHR
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Formulir sudah terisi kredensial HR Admin default agar siap diuji
              </p>
            </div>

            {/* Pemilih Workspace */}
            <div className="mb-5 flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Workspace Tujuan
              </Label>
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200/90 bg-slate-100/85 p-1">
                {(
                  [
                    {
                      value: "HR_ADMIN",
                      label: "HR Admin",
                      icon: UserCog,
                    },
                    {
                      value: "EMPLOYEE",
                      label: "Portal ESS",
                      icon: User,
                    },
                  ] as const
                ).map((tab) => {
                  const active = selectedPortal === tab.value;
                  const IconComp = tab.icon;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setSelectedPortal(tab.value)}
                      className="relative flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-colors"
                    >
                      {active && (
                        <motion.span
                          layoutId="login-portal-selector"
                          transition={SULO_SPRING}
                          className="bg-sulo-blue-pill absolute inset-0 rounded-xl shadow-2xs"
                        />
                      )}
                      <span
                        className={`relative z-10 flex items-center gap-1.5 ${
                          active
                            ? "text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <IconComp className="size-3.5" />
                        <span>{tab.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleCredentialSubmit} className="flex flex-col gap-4">
              {errorMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/90 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="login-identifier"
                  className="text-xs font-semibold text-slate-700"
                >
                  NIP atau Email Perusahaan
                </Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-400" />
                  <Input
                    id="login-identifier"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="SLO-2026-001 atau rina.kusuma@sulo.co.id"
                    className="h-10 border-slate-200/90 bg-white pl-9 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="login-password"
                  className="text-xs font-semibold text-slate-700"
                >
                  Kata Sandi
                </Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-400" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={DEMO_DEFAULT_PASSWORD}
                    className="h-10 border-slate-200/90 bg-white pr-10 pl-9 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword
                        ? "Sembunyikan kata sandi"
                        : "Tampilkan kata sandi"
                    }
                    className="absolute top-2.5 right-3 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <MagneticAction className="mt-2">
                <Button
                  type="submit"
                  className="bg-sulo-cta h-11 w-full border-0 text-sm font-semibold text-white shadow-sm active:scale-[0.99]"
                >
                  <LogIn data-icon="inline-start" />
                  Masuk Sekarang
                </Button>
              </MagneticAction>
            </form>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-200/75 bg-blue-50/65 p-3.5 text-[11px] leading-relaxed text-slate-600">
            <strong className="text-blue-900">Tips Pengujian Cepat:</strong>{" "}
            Semua 48 karyawan (<code>SLO-2026-001</code> s/d{" "}
            <code>SLO-2026-048</code>) maupun karyawan baru yang dibuat lewat
            menu <strong>Karyawan</strong> dapat masuk menggunakan kata sandi{" "}
            <code className="font-mono font-bold text-orange-700">
              {DEMO_DEFAULT_PASSWORD}
            </code>{" "}
            atau NIP-nya sendiri.
          </div>
        </div>
      </div>
    </div>
  );
}