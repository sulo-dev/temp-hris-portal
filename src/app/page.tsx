// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { canAccessAdminPortal, useSuloStore } from "@/store/use-sulo-store";
import { SuloPageSkeleton } from "@/components/layout/sulo-page-skeleton";

export default function HomeEntryRedirectPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const initVault = useSuloStore((s) => s.initVault);
  const initialized = useSuloStore((s) => s.initialized);
  const isAuthenticated = useSuloStore((s) => s.isAuthenticated);
  const activeRole = useSuloStore((s) => s.activeRole);
  const activeUserId = useSuloStore((s) => s.activeUserId);
  const employees = useSuloStore((s) => s.employees);

  useEffect(() => {
    setMounted(true);
    initVault();
  }, [initVault]);

  useEffect(() => {
    if (!mounted || !initialized) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    const currentUser = employees.find((e) => e.id === activeUserId);
    const isAdminSession =
      activeRole === "HR_ADMIN" && canAccessAdminPortal(currentUser);

    router.replace(isAdminSession ? "/admin/dashboard" : "/ess/home");
  }, [
    mounted,
    initialized,
    isAuthenticated,
    activeRole,
    activeUserId,
    employees,
    router,
  ]);

  return <SuloPageSkeleton />;
}