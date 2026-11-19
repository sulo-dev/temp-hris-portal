// src/app/ess/layout.tsx
"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  CalendarCheck,
  FileSpreadsheet,
  ArrowLeftRight,
  ShieldCheck,
  ShieldOff,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  canAccessAdminPortal,
  useSuloStore,
} from "@/store/use-sulo-store";
import {
  LivePulseBeacon,
  SULO_SPRING,
} from "@/components/motion/motion-primitives";
import { SuloPageSkeleton } from "@/components/layout/sulo-page-skeleton";

interface EssNavItem {
  href: string;
  label: string;
  icon: typeof Home;
}

const ESS_NAV_ITEMS: EssNavItem[] = [
  { href: "/ess/home", label: "Beranda", icon: Home },
  { href: "/ess/leaves", label: "Cuti & Izin", icon: CalendarCheck },
  { href: "/ess/payslips", label: "Slip Gaji", icon: FileSpreadsheet },
];

function getInitials(fullName?: string): string {
  if (!fullName) return "SH";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function EssLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const initVault = useSuloStore((s) => s.initVault);
  const initialized = useSuloStore((s) => s.initialized);
  const isAuthenticated = useSuloStore((s) => s.isAuthenticated);
  const activeUserId = useSuloStore((s) => s.activeUserId);
  const employees = useSuloStore((s) => s.employees);
  const leaves = useSuloStore((s) => s.leaves);
  const privacyShield = useSuloStore((s) => s.privacyShield);
  const togglePrivacyShield = useSuloStore((s) => s.togglePrivacyShield);
  const logout = useSuloStore((s) => s.logout);

  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    initVault();
  }, [initVault]);

  // Tutup menu mobile otomatis saat rute berpindah
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Redirect ke /login bila sesi tidak aktif
  useEffect(() => {
    if (!mounted || !initialized) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [mounted, initialized, isAuthenticated, router]);

  const currentUser = useMemo(() => {
    if (!mounted) return undefined;
    return employees.find((e) => e.id === activeUserId);
  }, [mounted, employees, activeUserId]);

  const myPendingLeavesCount = useMemo(() => {
    if (!mounted) return 0;
    return leaves.filter(
      (l) => l.employeeId === activeUserId && l.status === "PENDING",
    ).length;
  }, [mounted, leaves, activeUserId]);

  const isAuthorized = mounted && initialized && isAuthenticated;
  const isHrEligible = mounted && canAccessAdminPortal(currentUser);
  const safePrivacyShield = mounted ? privacyShield : false;

  function handleLogout() {
    logout();
    toast.success("Anda telah keluar dari SuloHR.");
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 selection:bg-orange-500/20 selection:text-orange-900">
      {/* Skeleton tampil selama fase hidrasi & validasi sesi */}
      {!isAuthorized && <SuloPageSkeleton />}

      {/* Floating Glass Topbar (print:hidden agar tidak ikut tercetak pada Slip Gaji A4) */}
      {isAuthorized && (
        <header className="fixed inset-x-0 top-3 z-50 px-4 sm:px-6 print:hidden">
          <nav
            aria-label="Navigasi Portal Employee Self-Service"
            className="glass-sulo-elevated mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 rounded-2xl border border-white/90 px-3.5 shadow-sm sm:px-5"
          >
            {/* Brand Identity */}
            <div className="flex items-center gap-3">
              <Link
                href="/ess/home"
                className="group flex items-center gap-2.5 focus:outline-none"
              >
                <div className="bg-sulo-dual-gradient flex size-9 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-extrabold text-white shadow-xs transition-transform duration-200 group-hover:scale-105">
                  SH
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
                      Sulo<span className="text-sulo-gradient">HR</span>
                    </span>
                    <Badge
                      variant="outline"
                      className="border-blue-200/90 bg-blue-50/80 px-1.5 py-0 font-mono text-[10px] font-bold text-blue-700"
                    >
                      ESS
                    </Badge>
                  </div>
                  <span className="hidden text-[10px] font-medium text-slate-500 sm:block">
                    Employee Self-Service
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Pills */}
            <div className="hidden items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/75 p-1 md:flex">
              {ESS_NAV_ITEMS.map((item) => {
                const IconComp = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(`${item.href}/`);
                const showPendingBadge =
                  item.href === "/ess/leaves" && myPendingLeavesCount > 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors"
                  >
                    {isActive && (
                      <motion.span
                        layoutId="ess-floating-nav-pill"
                        transition={SULO_SPRING}
                        className="bg-sulo-cta absolute inset-0 rounded-lg shadow-2xs"
                      />
                    )}
                    <span
                      className={`relative z-10 flex items-center gap-2 ${
                        isActive
                          ? "text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <IconComp className="size-3.5" />
                      <span>{item.label}</span>
                      {showPendingBadge && (
                        <span
                          className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold tabular-nums ${
                            isActive
                              ? "bg-white/25 text-white"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {myPendingLeavesCount}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Right Controls: Privacy Shield, User Profile Pill, Portal Switch, Logout & Mobile Toggle */}
            <div className="flex items-center gap-2">
              {/* Status / Toggle Privacy Shield UU PDP */}
              <button
                type="button"
                onClick={togglePrivacyShield}
                title={
                  safePrivacyShield
                    ? "Privacy Shield UU PDP Aktif (Nominal Tersamarkan)"
                    : "Privacy Shield UU PDP Nonaktif"
                }
                className={`hidden cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition-colors hover:opacity-90 sm:inline-flex ${
                  safePrivacyShield
                    ? "border-emerald-200 bg-emerald-50/85 text-emerald-700"
                    : "border-slate-200/90 bg-white/85 text-slate-600"
                }`}
              >
                {safePrivacyShield ? (
                  <>
                    <ShieldCheck className="size-3.5 text-emerald-600" />
                    <span className="hidden xl:inline">PII Shield On</span>
                  </>
                ) : (
                  <>
                    <ShieldOff className="size-3.5 text-slate-400" />
                    <span className="hidden xl:inline">PII Terbuka</span>
                  </>
                )}
              </button>

              {/* Active Employee Pill (Hydration-Safe) */}
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200/90 bg-white/85 py-1 pr-3 pl-1.5 lg:flex">
                <div className="bg-sulo-blue-pill flex size-7 items-center justify-center rounded-lg font-mono text-[11px] font-bold text-white">
                  {getInitials(currentUser?.fullName)}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="max-w-[130px] truncate text-xs font-bold text-slate-900">
                    {currentUser?.fullName ?? "Karyawan Sulo"}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {currentUser?.nip ?? "ESS-PORTAL"}
                  </span>
                </div>
                <LivePulseBeacon colorClass="bg-emerald-500" />
              </div>

              {/* Switch ke Portal Admin HR (hanya muncul jika canAccessAdminPortal(currentUser) === true) */}
              {isHrEligible && (
                <Link
                  href="/admin/dashboard"
                  onClick={() =>
                    useSuloStore.setState({ activeRole: "HR_ADMIN" })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200/90 bg-blue-50/80 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-100/80"
                >
                  <ArrowLeftRight className="size-3.5" />
                  <span className="hidden sm:inline">Admin HR</span>
                </Link>
              )}

              {/* Tombol Keluar Sesi Resmi */}
              <button
                type="button"
                onClick={handleLogout}
                title="Keluar dari sesi SuloHR"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200/90 bg-rose-50/80 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:border-rose-300 hover:bg-rose-100/80"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label={
                  mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"
                }
                aria-expanded={mobileMenuOpen}
                className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white/90 text-slate-700 transition-colors hover:bg-slate-100 md:hidden"
              >
                {mobileMenuOpen ? (
                  <X className="size-4" />
                ) : (
                  <Menu className="size-4" />
                )}
              </button>
            </div>
          </nav>

          {/* Mobile Dropdown Navigation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={SULO_SPRING}
                className="glass-sulo-elevated mx-auto mt-2 flex max-w-[1440px] flex-col gap-2 rounded-2xl border border-white/90 p-3 shadow-lg md:hidden"
              >
                {/* Info Karyawan pada Mobile */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-sulo-blue-pill flex size-8 items-center justify-center rounded-lg font-mono text-xs font-bold text-white">
                      {getInitials(currentUser?.fullName)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">
                        {currentUser?.fullName ?? "Karyawan Sulo"}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {currentUser?.nip ?? "ESS-PORTAL"} •{" "}
                        {currentUser?.department ?? "PT Sulo"}
                      </span>
                    </div>
                  </div>
                  <LivePulseBeacon colorClass="bg-emerald-500" />
                </div>

                {/* Daftar Link Mobile */}
                <div className="flex flex-col gap-1">
                  {ESS_NAV_ITEMS.map((item) => {
                    const IconComp = item.icon;
                    const isActive =
                      pathname === item.href ||
                      pathname?.startsWith(`${item.href}/`);
                    const showPendingBadge =
                      item.href === "/ess/leaves" && myPendingLeavesCount > 0;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                          isActive
                            ? "bg-sulo-cta text-white shadow-2xs"
                            : "text-slate-700 hover:bg-white/80"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <IconComp className="size-4" />
                          {item.label}
                        </span>
                        {showPendingBadge && (
                          <span
                            className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                              isActive
                                ? "bg-white/25 text-white"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {myPendingLeavesCount} Pending
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* Kontrol Aksi Cepat pada Mobile */}
                <div className="mt-1 grid grid-cols-2 gap-2 border-t border-slate-200/75 pt-2.5">
                  <button
                    type="button"
                    onClick={togglePrivacyShield}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                      safePrivacyShield
                        ? "border-emerald-200 bg-emerald-50/90 text-emerald-700"
                        : "border-slate-200 bg-white/90 text-slate-700"
                    }`}
                  >
                    {safePrivacyShield ? (
                      <>
                        <ShieldCheck className="size-3.5 text-emerald-600" />
                        <span>PII Shield On</span>
                      </>
                    ) : (
                      <>
                        <ShieldOff className="size-3.5 text-slate-400" />
                        <span>PII Terbuka</span>
                      </>
                    )}
                  </button>

                  {isHrEligible && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() =>
                        useSuloStore.setState({ activeRole: "HR_ADMIN" })
                      }
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/90 px-3 py-2 text-xs font-semibold text-blue-700"
                    >
                      <ArrowLeftRight className="size-3.5" />
                      <span>Admin HR</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/90 px-3 py-2 text-xs font-semibold text-rose-700 ${
                      !isHrEligible ? "col-span-2" : ""
                    }`}
                  >
                    <LogOut className="size-3.5" />
                    <span>Keluar Sesi</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      )}

      {/* Konten Halaman ESS tetap terpasang di render tree agar transisi Next.js mulus */}
      <main
        aria-hidden={!isAuthorized}
        className={isAuthorized ? "w-full" : "hidden"}
      >
        {children}
      </main>
    </div>
  );
}