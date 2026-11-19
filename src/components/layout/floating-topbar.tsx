// src/components/layout/floating-topbar.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  EyeOff,
  Eye,
  RotateCcw,
  ScrollText,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
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
import { useSuloStore } from "@/store/use-sulo-store";
import { SULO_SPRING } from "@/components/motion/motion-primitives";

export function FloatingTopbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    initVault,
    activeRole,
    switchRole,
    privacyShield,
    togglePrivacyShield,
    auditLogs,
    resetDemoVault,
  } = useSuloStore();

  useEffect(() => {
    initVault();
  }, [initVault]);

  function handleRoleChange(targetRole: "HR_ADMIN" | "EMPLOYEE") {
    if (targetRole === activeRole) return;
    switchRole(targetRole);

    if (targetRole === "EMPLOYEE" && pathname.startsWith("/admin")) {
      toast.warning(
        "Perlindungan Rute Aktif: Dialihkan ke Portal ESS karena peran berubah ke Karyawan.",
      );
      router.push("/ess/home");
    } else if (targetRole === "HR_ADMIN" && pathname.startsWith("/ess")) {
      toast.success("Beralih ke mode Executive HR Admin (Rina Kusuma).");
      router.push("/admin/dashboard");
    } else {
      toast.info(
        targetRole === "HR_ADMIN"
          ? "Sesi aktif: Rina Kusuma (HR Manager)"
          : "Sesi aktif: Dimas Pratama (Senior Frontend Engineer)",
      );
    }
  }

  return (
    <header className="no-print fixed inset-x-0 top-0 z-40 px-4 py-3">
      <div className="glass-sulo-elevated mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-2.5">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="bg-sulo-cta flex size-9 items-center justify-center rounded-xl text-white transition-transform duration-300 group-hover:scale-105">
            <Layers className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-base font-bold tracking-tight text-slate-900">
              SuloHR <span className="text-blue-600">v3.0</span>
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              PT Sulo Enterprise
            </span>
          </div>
        </Link>

        {/* Dynamic Island Role Switcher (Cool Gray Capsule + Futuristic Blue Pill) */}
        <div className="flex items-center gap-1 rounded-full border border-slate-200/90 bg-slate-100/90 p-1 shadow-inner">
          {(
            [
              { role: "HR_ADMIN", label: "Rina Kusuma (HR Admin)" },
              { role: "EMPLOYEE", label: "Dimas Pratama (Karyawan)" },
            ] as const
          ).map((item) => {
            const isActive = activeRole === item.role;
            return (
              <button
                key={item.role}
                type="button"
                onClick={() => handleRoleChange(item.role)}
                className="relative rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors"
              >
                {isActive && (
                  <motion.span
                    layoutId="sulo-role-pill"
                    transition={SULO_SPRING}
                    className="bg-sulo-cta absolute inset-0 rounded-full"
                  />
                )}
                <span
                  className={`relative z-10 ${
                    isActive
                      ? "font-semibold text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Security Shield & Audit Drawer */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={togglePrivacyShield}
            className={
              privacyShield
                ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                : "border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-100"
            }
          >
            {privacyShield ? (
              <EyeOff data-icon="inline-start" className="text-blue-600" />
            ) : (
              <Eye data-icon="inline-start" className="text-emerald-600" />
            )}
            {privacyShield ? "Shield ON" : "Privacy Mask"}
          </Button>

          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-100"
                />
              }
            >
              <ScrollText data-icon="inline-start" className="text-blue-600" />
              Audit ({auditLogs.length})
            </SheetTrigger>

            <SheetContent className="glass-sulo-elevated border-l border-slate-200 text-slate-900 sm:max-w-lg">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-slate-900">
                  <ShieldCheck className="size-5 text-blue-600" />
                  Security & Immutable Audit Trail
                </SheetTitle>
                <SheetDescription className="text-slate-600">
                  Seluruh peristiwa RBAC, pembukaan data PII, koreksi presensi,
                  dan penerbitan payroll tercatat secara kronologis.
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
        </div>
      </div>
    </header>
  );
}