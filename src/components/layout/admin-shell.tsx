// src/components/layout/admin-shell.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Clock,
  CheckSquare,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useSuloStore } from "@/store/use-sulo-store";
import {
  LivePulseBeacon,
  SULO_SPRING,
} from "@/components/motion/motion-primitives";
import { SuloPageSkeleton } from "@/components/layout/sulo-page-skeleton";

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/employees", label: "Karyawan & Vault", icon: Users },
  { href: "/admin/attendance", label: "Presensi", icon: Clock },
  { href: "/admin/approvals", label: "Persetujuan", icon: CheckSquare },
  { href: "/admin/payroll", label: "Payroll Engine", icon: Wallet },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const initVault = useSuloStore((s) => s.initVault);
  const initialized = useSuloStore((s) => s.initialized);
  const activeRole = useSuloStore((s) => s.activeRole);
  const logSecurityEvent = useSuloStore((s) => s.logSecurityEvent);

  useEffect(() => {
    initVault();
  }, [initVault]);

  useEffect(() => {
    if (!initialized) return;
    if (activeRole !== "HR_ADMIN") {
      logSecurityEvent(
        "ROUTE_GUARD_BLOCKED_403",
        "CRITICAL",
        `Akses ilegal ke ${pathname} oleh peran ${activeRole} diblokir.`,
      );
      toast.error("403 Access Restricted: Halaman ini khusus HR Admin.");
      router.replace("/ess/home");
    }
  }, [initialized, activeRole, pathname, router, logSecurityEvent]);

  const isAuthorized = initialized && activeRole === "HR_ADMIN";

  return (
    <>
      {!isAuthorized && <SuloPageSkeleton />}

      {/* {children} tetap terpasang di render tree agar validator Next.js tidak melaporkan dropped segment */}
      <div
        aria-hidden={!isAuthorized}
        className={
          isAuthorized
            ? "mx-auto grid w-full max-w-[1720px] grid-cols-1 gap-6 px-4 pt-28 pb-12 sm:px-6 md:pt-24 lg:grid-cols-12 lg:px-10"
            : "hidden"
        }
      >
        <aside className="no-print lg:col-span-3 xl:col-span-2">
          <nav
            aria-label="Navigasi Modul HR Admin"
            className="glass-sulo-card sticky top-24 flex flex-row gap-1.5 overflow-x-auto rounded-2xl p-2.5 lg:flex-col"
          >
            <div className="mb-1.5 hidden items-center justify-between border-b border-slate-200/80 px-2.5 pt-1 pb-2.5 lg:flex">
              <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                <ShieldCheck className="size-3.5 text-blue-600" />
                HR Console
              </span>
              <LivePulseBeacon colorClass="bg-orange-500" />
            </div>

            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative flex items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors"
                >
                  {isActive && (
                    <motion.span
                      layoutId="admin-sidebar-pill"
                      transition={SULO_SPRING}
                      className="bg-sulo-blue-pill absolute inset-0 rounded-xl"
                    />
                  )}

                  <span className="relative z-10 flex items-center gap-2.5">
                    <Icon
                      className={`size-4 transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-slate-500 group-hover:text-blue-600"
                      }`}
                    />
                    <span
                      className={
                        isActive
                          ? "font-semibold text-white"
                          : "text-slate-700 group-hover:text-slate-900"
                      }
                    >
                      {item.label}
                    </span>
                  </span>

                  {isActive && (
                    <span className="relative z-10 hidden size-2 rounded-full bg-orange-400 shadow-xs lg:inline-block" />
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 lg:col-span-9 xl:col-span-10">
          {children}
        </section>
      </div>
    </>
  );
}