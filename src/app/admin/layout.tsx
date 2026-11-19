// src/app/admin/layout.tsx
"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock,
  CheckSquare,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { canAccessAdminPortal, useSuloStore } from "@/store/use-sulo-store";
import { SuloPageSkeleton } from "@/components/layout/sulo-page-skeleton";

const ADMIN_NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/employees", label: "Karyawan", icon: Users },
  { href: "/admin/attendance", label: "Presensi", icon: Clock },
  { href: "/admin/approvals", label: "Persetujuan", icon: CheckSquare },
  { href: "/admin/payroll", label: "Payroll", icon: Wallet },
];

function AdminGuardContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const initVault = useSuloStore((s) => s.initVault);
  const initialized = useSuloStore((s) => s.initialized);
  const isAuthenticated = useSuloStore((s) => s.isAuthenticated);
  const activeRole = useSuloStore((s) => s.activeRole);
  const activeUserId = useSuloStore((s) => s.activeUserId);
  const employees = useSuloStore((s) => s.employees);
  const leaves = useSuloStore((s) => s.leaves);
  const logSecurityEvent = useSuloStore((s) => s.logSecurityEvent);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initVault();
  }, [initVault]);

  const currentAdmin = useMemo(() => {
    if (!mounted) return undefined;
    return employees.find((e) => e.id === activeUserId);
  }, [mounted, employees, activeUserId]);

  const hasAdminAccess =
    activeRole === "HR_ADMIN" && canAccessAdminPortal(currentAdmin);

  useEffect(() => {
    if (!mounted || !initialized) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!hasAdminAccess) {
      if (activeRole === "HR_ADMIN") {
        useSuloStore.setState({ activeRole: "EMPLOYEE" });
      }
      logSecurityEvent(
        "ROUTE_GUARD_BLOCKED_403",
        "CRITICAL",
        `Akses ilegal ke ${pathname} oleh ${
          currentAdmin?.fullName ?? activeUserId
        } (${currentAdmin?.department ?? activeRole}) diblokir.`,
      );
      toast.error("403 Access Restricted: Halaman ini khusus HR Admin.");
      router.replace("/ess/home");
    }
  }, [
    mounted,
    initialized,
    isAuthenticated,
    hasAdminAccess,
    activeRole,
    activeUserId,
    currentAdmin,
    pathname,
    router,
    logSecurityEvent,
  ]);

  const pendingApprovalsCount = useMemo(() => {
    if (!mounted) return 0;
    return leaves.filter((l) => l.status === "PENDING").length;
  }, [mounted, leaves]);

  const isAuthorized =
    mounted && initialized && isAuthenticated && hasAdminAccess;

  return (
    <div className="min-h-screen text-slate-900 selection:bg-orange-500/20 selection:text-orange-900">
      {!isAuthorized && <SuloPageSkeleton />}

      <main
        aria-hidden={!isAuthorized}
        className={
          isAuthorized
            ? "mx-auto w-full max-w-[1440px] px-4 pt-24 pb-12 sm:px-6 md:pt-28"
            : "hidden"
        }
      >
        {/* Strip navigasi cepat khusus layar < lg */}
        <nav
          aria-label="Navigasi Cepat HR Admin Mobile"
          className="no-print mb-5 flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/85 bg-white/85 p-1.5 shadow-2xs backdrop-blur-md lg:hidden print:hidden"
        >
          {ADMIN_NAV_ITEMS.map((item) => {
            const IconComp = item.icon;
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const showPending =
              item.href === "/admin/approvals" && pendingApprovalsCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-sulo-cta text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <IconComp className="size-3.5" />
                <span>{item.label}</span>
                {showPending && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold tabular-nums ${
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

        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<SuloPageSkeleton />}>
      <AdminGuardContent>{children}</AdminGuardContent>
    </Suspense>
  );
}