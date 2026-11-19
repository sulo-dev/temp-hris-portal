// src/components/layout/sulo-page-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function SuloPageSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Memuat halaman SuloHR"
      className="mx-auto flex w-full max-w-[1720px] flex-col gap-6 px-4 pt-24 pb-12 sm:px-6 lg:px-10"
    >
      {/* Header & Action Button Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2.5">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200/70 bg-white/80 px-3 py-1">
            <span className="size-2 animate-pulse rounded-full bg-orange-500" />
            <Skeleton className="h-3.5 w-36 rounded-full bg-slate-200/85" />
          </div>
          <Skeleton className="h-9 w-72 rounded-xl bg-slate-200/90 sm:w-96" />
          <Skeleton className="h-4 w-64 rounded-lg bg-slate-200/70 sm:w-80" />
        </div>

        <Skeleton className="h-10 w-48 rounded-xl bg-gradient-to-r from-orange-200/80 to-amber-200/80" />
      </div>

      {/* 4 KPI 3D Glass Cards Skeleton */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="glass-sulo-card flex flex-col gap-3 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded-md bg-slate-200/80" />
              <Skeleton
                className={
                  item <= 2
                    ? "size-9 rounded-xl bg-blue-100/90"
                    : "size-9 rounded-xl bg-orange-100/90"
                }
              />
            </div>
            <Skeleton className="h-8 w-32 rounded-lg bg-slate-200/90" />
            <Skeleton className="h-3.5 w-24 rounded-md bg-slate-200/65" />
          </div>
        ))}
      </div>

      {/* Primary Content & Analytics Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="glass-sulo-card flex flex-col gap-4 rounded-2xl p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-52 rounded-md bg-slate-200/90" />
              <Skeleton className="h-3.5 w-64 rounded-md bg-slate-200/65" />
            </div>
            <Skeleton className="h-6 w-28 rounded-full bg-blue-100/80" />
          </div>
          <Skeleton className="h-56 w-full rounded-xl bg-slate-100/90" />
        </div>

        <div className="glass-sulo-card flex flex-col gap-4 rounded-2xl p-6 lg:col-span-5">
          <Skeleton className="h-5 w-44 rounded-md bg-slate-200/90" />
          <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
            <Skeleton className="size-40 shrink-0 rounded-full bg-slate-200/80" />
            <div className="flex w-full flex-1 flex-col gap-3">
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-28 rounded-md bg-slate-200/80" />
                  <Skeleton className="h-3.5 w-14 rounded-md bg-blue-100/80" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom List / Table Skeleton */}
      <div className="glass-sulo-card flex flex-col gap-3 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-56 rounded-md bg-slate-200/90" />
          <Skeleton className="h-6 w-20 rounded-full bg-orange-100/90" />
        </div>
        {[1, 2, 3].map((row) => (
          <div
            key={row}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/80 p-4"
          >
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-48 rounded-md bg-slate-200/90" />
              <Skeleton className="h-3.5 w-36 rounded-md bg-slate-200/65" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded-lg bg-blue-100/90" />
              <Skeleton className="h-8 w-16 rounded-lg bg-orange-100/90" />
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Memuat data sistem SuloHR...</span>
    </div>
  );
}