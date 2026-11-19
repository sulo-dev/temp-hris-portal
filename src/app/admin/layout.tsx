// src/app/admin/layout.tsx
import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { SuloPageSkeleton } from "@/components/layout/sulo-page-skeleton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<SuloPageSkeleton />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}