"use client";

import type { SymbolType } from "../../../lib/plan-electric/types";

/** Lightweight SVG previews for the library panel (not Konva). */
export function SymbolPreview({ type }: { type: SymbolType }) {
  const common = { fill: "none", stroke: "#e5e7eb", strokeWidth: 1.6 } as const;
  switch (type) {
    case "priza_simpla":
      return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="9" {...common} /><circle cx="12.5" cy="16" r="1.3" fill="#e5e7eb" stroke="none" /><circle cx="19.5" cy="16" r="1.3" fill="#e5e7eb" stroke="none" /></svg>;
    case "priza_dubla":
      return <svg viewBox="0 0 36 32" aria-hidden="true"><circle cx="12" cy="16" r="7" {...common} /><circle cx="24" cy="16" r="7" {...common} /></svg>;
    case "priza_ip54":
      return <svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="6" width="20" height="20" {...common} /><circle cx="16" cy="16" r="6" {...common} /></svg>;
    case "priza_tv":
      return labelCircle("TV");
    case "priza_data":
      return labelRect("DATA");
    case "priza_ac":
      return labelCircle("AC");
    case "priza_400v":
      return labelRect("400V");
    case "intrerupator_simplu":
      return labelCircle("S1");
    case "intrerupator_dublu":
      return labelRect("S2");
    case "intrerupator_cap_scara":
      return labelCircle("CS");
    case "intrerupator_cruce":
      return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="9" {...common} /><path d="M9 9 L23 23 M23 9 L9 23" {...common} /></svg>;
    case "corp_iluminat":
      return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="9" {...common} /><path d="M16 5 V27 M5 16 H27" {...common} /></svg>;
    case "spot":
      return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="8" {...common} /><circle cx="16" cy="16" r="2.5" fill="#e5e7eb" stroke="none" /></svg>;
    case "aplica":
      return <svg viewBox="0 0 32 28" aria-hidden="true"><path d="M6 22 A10 10 0 0 1 26 22" {...common} /><path d="M6 22 H26" {...common} /></svg>;
    case "pendul":
      return <svg viewBox="0 0 32 34" aria-hidden="true"><path d="M16 3 V12" {...common} /><circle cx="16" cy="20" r="7" {...common} /></svg>;
    case "led":
      return labelRect("LED");
    case "detector_fum":
      return labelCircle("DF");
    case "detector_gaz":
      return labelCircle("DG");
    case "tablou_electric":
      return <svg viewBox="0 0 34 38" aria-hidden="true"><rect x="6" y="4" width="22" height="30" {...common} /><path d="M6 14 H28" {...common} /><text x="17" y="26" textAnchor="middle" fill="#e5e7eb" fontSize="8" fontFamily="Arial">TE</text></svg>;
    default:
      return <svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="6" width="20" height="20" {...common} /></svg>;
  }
}

function labelCircle(label: string) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="9" fill="none" stroke="#e5e7eb" strokeWidth="1.6" />
      <text x="16" y="19" textAnchor="middle" fill="#e5e7eb" fontSize="7" fontFamily="Arial">{label}</text>
    </svg>
  );
}

function labelRect(label: string) {
  return (
    <svg viewBox="0 0 36 30" aria-hidden="true">
      <rect x="4" y="5" width="28" height="20" fill="none" stroke="#e5e7eb" strokeWidth="1.6" />
      <text x="18" y="18" textAnchor="middle" fill="#e5e7eb" fontSize="7" fontFamily="Arial">{label}</text>
    </svg>
  );
}
