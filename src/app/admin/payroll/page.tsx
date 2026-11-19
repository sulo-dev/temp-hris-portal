// src/app/admin/payroll/page.tsx
"use client";

import { useState } from "react";
import { Calculator, Lock, Printer, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSuloStore } from "@/store/use-sulo-store";
import { formatRupiah } from "@/lib/business-rules";
import { PayrollItem } from "@/lib/types";

export default function AdminPayrollPage() {
  const {
    employees,
    payrolls,
    privacyShield,
    runPayrollCalculation,
    lockAndPayPeriod,
  } = useSuloStore();

  const [period, setPeriod] = useState("2026-11");
  const [selectedSlip, setSelectedSlip] = useState<PayrollItem | null>(null);

  const periodItems = payrolls.filter((p) => p.period === period);
  const isPeriodPaid =
    periodItems.length > 0 && periodItems.every((p) => p.status === "PAID");

  const selectedEmployee = selectedSlip
    ? employees.find((e) => e.id === selectedSlip.employeeId)
    : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Automated Payroll Engine
          </h1>
          <p className="text-sm text-slate-300">
            Sinkronisasi keterlambatan, lembur, BPJS (1% + 2%), dan PPh 21 TER.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={period}
            onValueChange={(val) => {
              if (val) setPeriod(val);
            }}
          >
            <SelectTrigger className="w-[230px] border-white/15 bg-[#011D58] font-mono text-xs text-white">
              <SelectValue placeholder="Pilih periode payroll" />
            </SelectTrigger>
            <SelectContent className="glass-sulo-elevated border-white/15 text-white">
              <SelectGroup>
                <SelectItem value="2026-11">
                  Periode 2026-11 (Nov 2026)
                </SelectItem>
                <SelectItem value="2026-10">
                  Periode 2026-10 (Okt 2026)
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            disabled={isPeriodPaid}
            onClick={() => {
              const res = runPayrollCalculation(period);
              if (res.ok) toast.success(res.message);
              else toast.error(res.message);
            }}
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            <Calculator data-icon="inline-start" />
            Hitung Otomatis
          </Button>

          <Button
            type="button"
            disabled={isPeriodPaid}
            onClick={() => {
              const res = lockAndPayPeriod(period);
              if (res.ok) toast.success(res.message);
              else toast.error(res.message);
            }}
            className="bg-sulo-cta border-0 text-white"
          >
            <Lock data-icon="inline-start" />
            {isPeriodPaid ? "Periode Terkunci (PAID)" : "Tandai Semua Dibayar"}
          </Button>
        </div>
      </div>

      <div className="no-print glass-sulo-card overflow-hidden rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-slate-300">Karyawan</TableHead>
              <TableHead className="text-right text-slate-300">
                Penerimaan
              </TableHead>
              <TableHead className="text-right text-slate-300">
                Potongan
              </TableHead>
              <TableHead className="text-right text-slate-300">
                Take Home Pay
              </TableHead>
              <TableHead className="text-slate-300">Status</TableHead>
              <TableHead className="text-right text-slate-300">
                Slip Gaji
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periodItems.length === 0 ? (
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-slate-400"
                >
                  Belum ada data kalkulasi payroll untuk periode {period}. Klik{" "}
                  <strong className="text-white">Hitung Otomatis</strong> untuk
                  memulai.
                </TableCell>
              </TableRow>
            ) : (
              periodItems.map((item) => {
                const emp = employees.find((e) => e.id === item.employeeId);
                return (
                  <TableRow
                    key={item.id}
                    className="border-white/10 hover:bg-white/5"
                  >
                    <TableCell>
                      <p className="font-semibold text-white">
                        {emp?.fullName}
                      </p>
                      <p className="font-mono text-xs text-slate-400 tabular-nums">
                        {emp?.nip}
                      </p>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-200 tabular-nums">
                      <span
                        className={privacyShield ? "blur-xs select-none" : ""}
                      >
                        {formatRupiah(item.totalEarnings)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-rose-400 tabular-nums">
                      <span
                        className={privacyShield ? "blur-xs select-none" : ""}
                      >
                        -{formatRupiah(item.totalDeductions)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-[#FF9F03] tabular-nums">
                      <span
                        className={privacyShield ? "blur-xs select-none" : ""}
                      >
                        {formatRupiah(item.takeHomePay)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.status === "PAID"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-amber-500/20 text-amber-300"
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedSlip(item)}
                        className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                      >
                        <FileText data-icon="inline-start" />
                        Pratinjau A4
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Pratinjau Slip Gaji & Print-Ready A4 (Base UI Dialog) */}
      <Dialog
        open={Boolean(selectedSlip)}
        onOpenChange={(open) => {
          if (!open) setSelectedSlip(null);
        }}
      >
        <DialogContent className="glass-sulo-elevated max-w-2xl border-[#FF9F03]/40 text-white">
          <DialogHeader className="no-print">
            <DialogTitle className="text-white">
              Pratinjau Slip Gaji Resmi — PT Sulo
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Dokumen otomatis dikonversi ke format kertas A4 putih bersih saat
              dicetak atau disimpan sebagai PDF.
            </DialogDescription>
          </DialogHeader>

          {selectedSlip && selectedEmployee && (
            <div className="print-payslip-sheet rounded-xl border border-white/15 bg-[#020E2B]/90 p-6 text-sm">
              <div className="flex items-start justify-between border-b border-current/15 pb-4">
                <div>
                  <h2 className="font-display text-lg font-bold">
                    PT SULO INDONESIA
                  </h2>
                  <p className="text-xs opacity-75">
                    Slip Gaji Elektronik • Periode {selectedSlip.period}
                  </p>
                </div>
                <div className="text-right font-mono text-xs tabular-nums">
                  <p>Ref: {selectedSlip.id}</p>
                  <p className="opacity-75">
                    Hash: {selectedSlip.verificationHash}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <p>
                  <strong>Nama:</strong> {selectedEmployee.fullName}
                </p>
                <p className="font-mono tabular-nums">
                  <strong>NIP:</strong> {selectedEmployee.nip}
                </p>
                <p>
                  <strong>Departemen:</strong> {selectedEmployee.department}
                </p>
                <p>
                  <strong>Jabatan:</strong> {selectedEmployee.position}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-6 border-y border-current/15 py-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold tracking-wider uppercase opacity-80">
                    Penerimaan
                  </h3>
                  <div className="flex justify-between font-mono text-xs tabular-nums">
                    <span>Gaji Pokok</span>
                    <span>{formatRupiah(selectedSlip.baseSalary)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-xs tabular-nums">
                    <span>Tunjangan Tetap</span>
                    <span>{formatRupiah(selectedSlip.fixedAllowance)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-xs tabular-nums">
                    <span>Uang Lembur</span>
                    <span>{formatRupiah(selectedSlip.overtimePay)}</span>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-current/15 pt-1.5 font-mono text-xs font-semibold tabular-nums">
                    <span>Total Penerimaan</span>
                    <span>{formatRupiah(selectedSlip.totalEarnings)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold tracking-wider uppercase opacity-80">
                    Potongan
                  </h3>
                  <div className="flex justify-between font-mono text-xs tabular-nums">
                    <span>Keterlambatan ({selectedSlip.lateCount}x)</span>
                    <span>-{formatRupiah(selectedSlip.lateDeduction)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-xs tabular-nums">
                    <span>BPJS Kesehatan (1%)</span>
                    <span>-{formatRupiah(selectedSlip.bpjsKesehatan)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-xs tabular-nums">
                    <span>BPJS TK JHT (2%)</span>
                    <span>-{formatRupiah(selectedSlip.bpjsTkJht)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-xs tabular-nums">
                    <span>PPh 21 (TER)</span>
                    <span>-{formatRupiah(selectedSlip.pph21)}</span>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-current/15 pt-1.5 font-mono text-xs font-semibold tabular-nums">
                    <span>Total Potongan</span>
                    <span>-{formatRupiah(selectedSlip.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="font-semibold">
                  TAKE HOME PAY (GAJI BERSIH)
                </span>
                <span className="font-mono text-xl font-bold tabular-nums">
                  {formatRupiah(selectedSlip.takeHomePay)}
                </span>
              </div>

              <div className="mt-6 flex items-end justify-between border-t border-current/15 pt-4 text-xs opacity-80">
                <div>
                  <p>Status Pembayaran: {selectedSlip.status}</p>
                  <p className="font-mono text-[11px]">
                    Verifikasi Dokumen: {selectedSlip.verificationHash}
                  </p>
                </div>
                <div className="text-right">
                  <p>Disahkan secara elektronik oleh,</p>
                  <p className="mt-4 font-semibold">Rina Kusuma</p>
                  <p className="text-[11px]">HR Manager — PT Sulo Indonesia</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="no-print">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedSlip(null)}
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              Tutup
            </Button>
            <Button
              type="button"
              onClick={() => window.print()}
              className="bg-sulo-cta border-0 text-white"
            >
              <Printer data-icon="inline-start" />
              Cetak / Simpan PDF A4
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
