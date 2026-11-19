// src/components/security/pii-mask.tsx
"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useSuloStore } from "@/store/use-sulo-store";
import { maskSensitiveValue } from "@/lib/security-utils";

interface PiiMaskProps {
  value: string;
  formattedDisplay?: string;
  label: string;
}

export function PiiMask({ value, formattedDisplay, label }: PiiMaskProps) {
  const privacyShield = useSuloStore((s) => s.privacyShield);
  const logSecurityEvent = useSuloStore((s) => s.logSecurityEvent);
  const [revealed, setRevealed] = useState(false);

  // Kunci kembali otomatis jika Privacy Shield global diaktifkan
  useEffect(() => {
    if (privacyShield && revealed) {
      setRevealed(false);
    }
  }, [privacyShield, revealed]);

  // Auto-relock setelah 30 detik sesuai kebijakan UU PDP
  useEffect(() => {
    if (!revealed) return;
    const timer = setTimeout(() => {
      setRevealed(false);
    }, 30_000);
    return () => clearTimeout(timer);
  }, [revealed]);

  function handleToggle() {
    if (!revealed) {
      setRevealed(true);
      logSecurityEvent(
        "PII_DATA_UNMASKED",
        "WARNING",
        `Membuka data sensitif (${label}) dengan auto-relock 30 detik.`,
      );
    } else {
      setRevealed(false);
    }
  }

  const displayText = revealed
    ? (formattedDisplay ?? value)
    : maskSensitiveValue(value);

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={
        revealed
          ? "Klik untuk menyamarkan kembali"
          : `Klik untuk membuka ${label} (Auto-relock 30d)`
      }
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-semibold tabular-nums transition-all ${
        revealed
          ? "border-orange-300 bg-orange-50 text-orange-800 shadow-2xs"
          : "border-slate-200/90 bg-slate-100/90 text-slate-700 hover:border-blue-300 hover:bg-blue-50/80 hover:text-blue-800"
      }`}
    >
      <span>{displayText}</span>
      {revealed ? (
        <EyeOff className="size-3.5 text-orange-600" />
      ) : (
        <Eye className="size-3.5 text-blue-600" />
      )}
    </button>
  );
}