// src/app/ess/layout.tsx
"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, CalendarCheck, FileSpreadsheet } from "lucide-react";
import { useSuloStore } from "@/store/use-sulo-store";
import { SuloPageSkeleton } from "@/components/layout/sulo-page-skeleton";

const ESS_NAV_ITEMS = [
  { href: "/ess/home", label: "Beranda", icon: Home },
  { href: "/ess/leaves", label: "Cuti & Izin", icon: CalendarCheck },
  { href: "/ess/payslips", label: "Slip Gaji", icon: FileSpreadsheet },
];

function EssGuardContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const initVault = useSuloStore((s) => s.initVault);
  const initialized = useSuloStore((s) => s.initialized);
  const isAuthenticated = useSuloStore((s) => s.isAuthenticated);
  const activeUserId = useSuloStore((s) => s.activeUserId);
  const leaves = useSuloStore((s) => s.leaves);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initVault();
  }, [initVault]);

  useEffect(() => {
    if (!mounted || !initialized) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [mounted, initialized, isAuthenticated, router]);

  const myPendingLeavesCount = useMemo(() => {
    if (!mounted) return 0;
    return leaves.filter(
      (l) => l.employeeId === activeUserId && l.status === "PENDING",
    ).length;
  }, [mounted, leaves, activeUserId]);

  const isAuthorized = mounted && initialized && isAuthenticated;

  return (
    <div className="min-h-screen text-slate-900 selection:bg-orange-500/20 selection:text-orange-900">
      {!isAuthorized && <SuloPageSkeleton />}

      <main
        aria-hidden={!isAuthorized}
        className={isAuthorized ? "w-full" : "hidden"}
      >
        {/* Strip navigasi cepat khusus layar < lg */}
        <div className="no-print mx-auto max-w-[1440px] px-4 pt-24 sm:px-6 lg:hidden print:hidden">
          <nav
            aria-label="Navigasi Cepat Portal ESS Mobile"
            className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/85 bg-white/85 p-1.5 shadow-2xs backdrop-blur-md"
          >
            {ESS_NAV_ITEMS.map((item) => {
              const IconComp = item.icon;
              const isActive =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);
              const showPending =
                item.href === "/ess/leaves" && myPendingLeavesCount > 0;

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
                      {myPendingLeavesCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {children}
      </main>
    </div>
  );
}

export default function EssLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<SuloPageSkeleton />}>
      <EssGuardContent>{children}</EssGuardContent>
    </Suspense>
  );
}