// src/app/layout.tsx
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Outfit,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";
import {
  ShieldCheck,
  ShieldAlert,
  EyeOff,
  Eye,
  RotateCcw,
  ScrollText,
  Layers,
  LogOut,
  ArrowLeftRight,
  LayoutDashboard,
  Users,
  Clock,
  CheckSquare,
  Wallet,
  Home,
  CalendarCheck,
  FileSpreadsheet,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  canAccessAdminPortal,
  useSuloStore,
} from "@/store/use-sulo-store";
import {
  LivePulseBeacon,
  SpatialBackdrop,
} from "@/components/motion/motion-primitives";
import { SuloPageSkeleton } from "@/components/layout/sulo-page-skeleton";
import "./globals.css";

const fontDisplay = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"],
});

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

const ADMIN_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/employees", label: "Karyawan", icon: Users },
  { href: "/admin/attendance", label: "Presensi", icon: Clock },
  { href: "/admin/approvals", label: "Persetujuan", icon: CheckSquare },
  { href: "/admin/payroll", label: "Payroll", icon: Wallet },
];

const ESS_LINKS = [
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

function UnifiedFloatingTopbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    initVault,
    initialized,
    isAuthenticated,
    activeRole,
    activeUserId,
    employees,
    leaves,
    privacyShield,
    togglePrivacyShield,
    auditLogs,
    resetDemoVault,
    logout,
  } = useSuloStore();

  useEffect(() => {
    setMounted(true);
    initVault();
  }, [initVault]);

  const currentUser = useMemo(() => {
    if (!mounted) return undefined;
    return employees.find((e) => e.id === activeUserId);
  }, [mounted, employees, activeUserId]);

  const isLoginPage = pathname === "/login";
  const isAdminZone = pathname?.startsWith("/admin");
  const isEssZone = pathname?.startsWith("/ess");
  const isHrEligible = mounted && canAccessAdminPortal(currentUser);

  const pendingApprovalsCount = useMemo(() => {
    if (!mounted) return 0;
    return leaves.filter((l) => l.status === "PENDING").length;
  }, [mounted, leaves]);

  const showFloatingTopbar =
    mounted && initialized && isAuthenticated && !isLoginPage;

  if (!showFloatingTopbar) return null;

  const navItems = isAdminZone ? ADMIN_LINKS : isEssZone ? ESS_LINKS : [];
  const homeHref =
    activeRole === "HR_ADMIN" && isHrEligible
      ? "/admin/dashboard"
      : "/ess/home";

  function handleLogout() {
    logout();
    toast.success("Sesi SuloHR telah ditutup.");
    router.replace("/login");
  }

  return (
    <header className="no-print fixed inset-x-0 top-3 z-50 px-4 sm:px-6 print:hidden">
      <div className="glass-sulo-elevated mx-auto flex h-16 max-w-[1440px] flex-nowrap items-center justify-between gap-2 rounded-2xl border border-white/90 px-3.5 shadow-sm sm:px-4">
        {/* Kiri: Brand Identity */}
        <Link
          href={homeHref}
          className="group flex shrink-0 items-center gap-2.5"
        >
          <div className="bg-sulo-cta flex size-9 shrink-0 items-center justify-center rounded-xl text-white transition-transform duration-300 group-hover:scale-105">
            <Layers className="size-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
                Sulo<span className="text-sulo-gradient">HR</span>
              </span>
              <Badge
                variant="outline"
                className={
                  isHrEligible && activeRole === "HR_ADMIN"
                    ? "border-orange-200 bg-orange-50/90 px-1.5 py-0 font-mono text-[10px] font-bold text-orange-700"
                    : "border-blue-200 bg-blue-50/90 px-1.5 py-0 font-mono text-[10px] font-bold text-blue-700"
                }
              >
                {isHrEligible && activeRole === "HR_ADMIN" ? "ADMIN" : "ESS"}
              </Badge>
            </div>
            <span className="hidden text-[10px] font-medium text-slate-500 xl:block">
              PT Sulo Enterprise
            </span>
          </div>
        </Link>

        {/* Tengah: Navigasi Portal Aktif (1 Baris Kompak) */}
        {navItems.length > 0 && (
          <nav
            aria-label="Navigasi Portal Aktif"
            className="hidden shrink-0 items-center gap-0.5 rounded-xl border border-slate-200/90 bg-slate-100/85 p-1 lg:flex"
          >
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive =
                pathname === item.href ||
                pathname?.startsWith(`${item.href}/`);
              const showPending =
                item.href === "/admin/approvals" && pendingApprovalsCount > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors xl:px-3 ${
                    isActive
                      ? "bg-sulo-cta font-semibold text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <IconComp className="size-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {showPending && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                        isActive
                          ? "bg-white/25 text-white"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {pendingApprovalsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Kanan: Identitas Akun, Switch HR/ESS, Privacy Shield, Audit & Keluar */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* Pill Identitas Pengguna Aktif */}
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200/90 bg-white/85 py-1 pr-2.5 pl-1.5 2xl:flex">
            <div className="bg-sulo-blue-pill flex size-7 shrink-0 items-center justify-center rounded-lg font-mono text-[11px] font-bold text-white">
              {getInitials(currentUser?.fullName)}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="max-w-[120px] truncate text-xs font-bold text-slate-900">
                {currentUser?.fullName ?? "Pengguna Sulo"}
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                {currentUser?.nip ?? "SLO-2026"}
              </span>
            </div>
            <LivePulseBeacon
              colorClass={isHrEligible ? "bg-orange-500" : "bg-emerald-500"}
            />
          </div>

          {/* Tombol Pindah Portal (Khusus Departemen HR) */}
          {isHrEligible && (
            <Link
              href={isAdminZone ? "/ess/home" : "/admin/dashboard"}
              onClick={() =>
                useSuloStore.setState({
                  activeRole: isAdminZone ? "EMPLOYEE" : "HR_ADMIN",
                })
              }
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/85 px-2.5 text-xs font-semibold whitespace-nowrap text-blue-700 transition-colors hover:bg-blue-100"
            >
              <ArrowLeftRight className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">
                {isAdminZone ? "Portal ESS" : "Admin HR"}
              </span>
            </Link>
          )}

          {/* Privacy Shield Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={togglePrivacyShield}
            title={
              privacyShield
                ? "Privacy Shield Aktif"
                : "Aktifkan Privacy Mask UU PDP"
            }
            className={`h-8 shrink-0 px-2.5 ${
              privacyShield
                ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                : "border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {privacyShield ? (
              <EyeOff className="size-3.5 text-blue-600" />
            ) : (
              <Eye className="size-3.5 text-emerald-600" />
            )}
            <span className="hidden xl:inline">
              {privacyShield ? "Shield ON" : "Privacy"}
            </span>
          </Button>

          {/* Security & Immutable Audit Trail Drawer */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 border-slate-200 bg-white/80 px-2.5 text-slate-700 hover:bg-slate-100"
                />
              }
            >
              <ScrollText className="size-3.5 text-blue-600" />
              <span className="font-mono text-[11px] tabular-nums">
                {auditLogs.length}
              </span>
            </SheetTrigger>

            <SheetContent className="glass-sulo-elevated border-l border-slate-200 text-slate-900 sm:max-w-lg">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-slate-900">
                  <ShieldCheck className="size-5 text-blue-600" />
                  Security &amp; Immutable Audit Trail
                </SheetTitle>
                <SheetDescription className="text-slate-600">
                  Seluruh peristiwa autentikasi, RBAC, pembukaan data PII,
                  koreksi presensi, dan penerbitan payroll tercatat secara
                  kronologis.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 flex items-center justify-between gap-2 border-y border-slate-200/80 py-3">
                <span className="text-xs text-slate-600">
                  Tamper-Evident Vault Status:{" "}
                  <strong className="text-emerald-600">VERIFIED</strong>
                </span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    resetDemoVault();
                    toast.success(
                      "Demo Vault PT Sulo dikembalikan ke kondisi awal.",
                    );
                  }}
                >
                  <RotateCcw data-icon="inline-start" />
                  Reset Vault
                </Button>
              </div>

              <div className="mt-4 flex max-h-[68vh] flex-col gap-2.5 overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-slate-200/80 bg-white/85 p-3 text-xs shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant={
                          log.severity === "CRITICAL"
                            ? "destructive"
                            : log.severity === "WARNING"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {log.severity === "CRITICAL" && (
                          <ShieldAlert data-icon="inline-start" />
                        )}
                        {log.action}
                      </Badge>
                      <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                        {new Date(log.timestamp).toLocaleTimeString("id-ID")}
                      </span>
                    </div>
                    <p className="mt-1.5 text-slate-700">{log.details}</p>
                    <p className="mt-1 font-mono text-[11px] text-slate-500">
                      Actor: {log.actorName} ({log.actorRole})
                    </p>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Tombol Keluar Sesi */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLogout}
            title="Keluar dari sesi SuloHR"
            className="h-8 shrink-0 border-rose-200 bg-rose-50/85 px-2.5 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}
    >
      <head>
        <title>
          SuloHR v3.0 — Spatial Enterprise HRIS &amp; Self-Service Platform
        </title>
        <meta
          name="description"
          content="Platform manajemen SDM modern PT Sulo dengan antarmuka Arctic Spatial Glassmorphism, RBAC Zero-Trust, dan Automated Payroll Engine."
        />
      </head>
      <body className="bg-sulo-canvas font-sans min-h-[100dvh] text-slate-900 antialiased">
        <SpatialBackdrop />

        <Suspense fallback={null}>
          <UnifiedFloatingTopbar />
        </Suspense>

        <Suspense fallback={<SuloPageSkeleton />}>
          <main className="min-h-[100dvh]">{children}</main>
        </Suspense>

        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}