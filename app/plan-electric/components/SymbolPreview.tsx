"use client";

import type { SymbolType } from "../../../lib/plan-electric/types";
import { SYMBOL_COLORS } from "../../../lib/plan-electric/symbols";

const S = "#e5e7eb";
const R = SYMBOL_COLORS.outlet;
const G = SYMBOL_COLORS.fixtureGreen;
const Y = SYMBOL_COLORS.led;

/** SVG previews matching Romanian normative Konva glyphs. */
export function SymbolPreview({ type }: { type: SymbolType }) {
  switch (type) {
    case "priza_simpla":
      return (
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="10" fill="none" stroke={R} strokeWidth="1.6" />
          <path d="M10 13.5 H22 M10 16 H22" fill="none" stroke={R} strokeWidth="1.4" />
          <path d="M16 18.5 V22.5 M13.2 22.5 H18.8 M13.8 24 H18.2" fill="none" stroke={R} strokeWidth="1.2" />
        </svg>
      );
    case "priza_dubla":
      return (
        <svg viewBox="0 0 40 32" aria-hidden="true">
          <circle cx="12" cy="16" r="8" fill="none" stroke={R} strokeWidth="1.5" />
          <path d="M7.5 14 H16.5 M7.5 16 H16.5 M12 18 V21 M10 21 H14" fill="none" stroke={R} strokeWidth="1.2" />
          <circle cx="28" cy="16" r="8" fill="none" stroke={R} strokeWidth="1.5" />
          <path d="M23.5 14 H32.5 M23.5 16 H32.5 M28 18 V21 M26 21 H30" fill="none" stroke={R} strokeWidth="1.2" />
        </svg>
      );
    case "priza_tripla":
      return (
        <svg viewBox="0 0 52 32" aria-hidden="true">
          <circle cx="10" cy="16" r="7" fill="none" stroke={R} strokeWidth="1.4" />
          <path d="M6 14 H14 M6 16 H14 M10 18 V21" fill="none" stroke={R} strokeWidth="1.1" />
          <circle cx="26" cy="16" r="7" fill="none" stroke={R} strokeWidth="1.4" />
          <path d="M22 14 H30 M22 16 H30 M26 18 V21" fill="none" stroke={R} strokeWidth="1.1" />
          <circle cx="42" cy="16" r="7" fill="none" stroke={R} strokeWidth="1.4" />
          <path d="M38 14 H46 M38 16 H46 M42 18 V21" fill="none" stroke={R} strokeWidth="1.1" />
        </svg>
      );
    case "priza_ip54":
      return (
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <rect x="4" y="4" width="24" height="24" fill="none" stroke={R} strokeWidth="1.6" />
          <circle cx="16" cy="15" r="7" fill="none" stroke={R} strokeWidth="1.4" />
          <path d="M11 13 H21 M11 15 H21 M16 17 V20 M14 20 H18" fill="none" stroke={R} strokeWidth="1.1" />
        </svg>
      );
    case "priza_tv":
      return (
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="10" fill="none" stroke={R} strokeWidth="1.6" />
          <path d="M16 18 V10 M10 14 L16 9 L22 14" fill="none" stroke={R} strokeWidth="1.3" />
          <text x="16" y="24" textAnchor="middle" fill={R} fontSize="7" fontFamily="Arial">TV</text>
        </svg>
      );
    case "priza_data":
      return (
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="10" fill="none" stroke={R} strokeWidth="1.6" />
          <rect x="10" y="12" width="12" height="8" fill="none" stroke={R} strokeWidth="1.2" />
          <path d="M12 14 V18 M16 14 V18 M20 14 V18" fill="none" stroke={R} strokeWidth="1.1" />
        </svg>
      );
    case "priza_ac":
      return (
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="10" fill="none" stroke={R} strokeWidth="1.6" />
          <path d="M9 16 L12 12 L16 20 L20 13 L23 16" fill="none" stroke={R} strokeWidth="1.3" />
          <text x="16" y="25" textAnchor="middle" fill={R} fontSize="7" fontFamily="Arial">AC</text>
        </svg>
      );
    case "priza_400v":
      return (
        <svg viewBox="0 0 34 32" aria-hidden="true">
          <circle cx="17" cy="15" r="11" fill="none" stroke={R} strokeWidth="1.6" />
          <path d="M17 8 L23 19 H11 Z" fill="none" stroke={R} strokeWidth="1.4" />
          <text x="17" y="30" textAnchor="middle" fill={R} fontSize="6" fontFamily="Arial">400V</text>
        </svg>
      );
    case "intrerupator_simplu":
      return switchPreview(1, "normal");
    case "intrerupator_dublu":
      return switchPreview(2, "normal");
    case "intrerupator_triplu":
      return switchPreview(3, "normal");
    case "intrerupator_cap_scara":
      return switchPreview(1, "cs");
    case "intrerupator_dublu_cs":
      return switchPreview(2, "cs");
    case "intrerupator_triplu_cs":
      return switchPreview(3, "cs");
    case "intrerupator_cruce":
      return switchPreview(1, "cruce");
    case "intrerupator_dublu_cruce":
      return switchPreview(2, "cruce");
    case "intrerupator_triplu_cruce":
      return switchPreview(3, "cruce");
    case "corp_iluminat":
      return (
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="10" fill="none" stroke={S} strokeWidth="1.6" />
          <path d="M16 6 V26 M6 16 H26" fill="none" stroke={S} strokeWidth="1.4" />
        </svg>
      );
    case "spot":
      return (
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="9" fill="none" stroke={S} strokeWidth="1.6" />
          <circle cx="16" cy="16" r="3" fill="none" stroke={S} strokeWidth="1.2" />
          <path d="M16 19 V25 M13 23 H19" fill="none" stroke={S} strokeWidth="1.2" />
        </svg>
      );
    case "aplica":
      return (
        <svg viewBox="0 0 32 28" aria-hidden="true">
          <path d="M4 24 H28" fill="none" stroke={G} strokeWidth="1.6" />
          <path d="M6 24 A10 10 0 0 1 26 24" fill="none" stroke={G} strokeWidth="1.6" />
          <path d="M16 14 V18 M12 16 H20" fill="none" stroke={G} strokeWidth="1.2" />
        </svg>
      );
    case "pendul":
      return (
        <svg viewBox="0 0 32 34" aria-hidden="true">
          <path d="M16 2 V10" fill="none" stroke={G} strokeWidth="1.5" />
          <circle cx="16" cy="20" r="8" fill="none" stroke={G} strokeWidth="1.6" />
          <path d="M16 12 V28 M8 20 H24" fill="none" stroke={G} strokeWidth="1.3" />
        </svg>
      );
    case "led":
      return (
        <svg viewBox="0 0 48 18" aria-hidden="true">
          <path d="M4 9 H44" fill="none" stroke={Y} strokeWidth="2" strokeDasharray="5 4" />
          <circle cx="10" cy="9" r="3" fill={SYMBOL_COLORS.ledBulb} stroke={Y} strokeWidth="1" />
          <circle cx="24" cy="9" r="3" fill={SYMBOL_COLORS.ledBulb} stroke={Y} strokeWidth="1" />
          <circle cx="38" cy="9" r="3" fill={SYMBOL_COLORS.ledBulb} stroke={Y} strokeWidth="1" />
        </svg>
      );
    case "detector_fum":
      return (
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="10" fill="none" stroke={S} strokeWidth="1.6" />
          <text x="16" y="20" textAnchor="middle" fill={S} fontSize="8" fontFamily="Arial">DF</text>
        </svg>
      );
    case "detector_gaz":
      return (
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="10" fill="none" stroke={S} strokeWidth="1.6" />
          <text x="16" y="20" textAnchor="middle" fill={S} fontSize="8" fontFamily="Arial">DG</text>
        </svg>
      );
    case "tablou_electric":
      return (
        <svg viewBox="0 0 34 38" aria-hidden="true">
          <rect x="5" y="3" width="24" height="32" fill="none" stroke={S} strokeWidth="2" />
          <rect x="8" y="6" width="18" height="26" fill="none" stroke={S} strokeWidth="1.1" />
          <path d="M10 14 H24 M10 18 H24 M10 22 H24" fill="none" stroke={S} strokeWidth="1.2" />
          <text x="17" y="30" textAnchor="middle" fill={S} fontSize="8" fontFamily="Arial">TE</text>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <rect x="6" y="6" width="20" height="20" fill="none" stroke={S} strokeWidth="1.6" />
        </svg>
      );
  }
}

function switchPreview(gangs: 1 | 2 | 3, variant: "normal" | "cs" | "cruce") {
  const width = gangs === 1 ? 32 : gangs === 2 ? 44 : 56;
  const gap = gangs === 1 ? 0 : 2;
  const cell = (width - gap * (gangs - 1)) / gangs;
  const r = Math.min(cell, 32) / 2 - 2.5;
  const modules = Array.from({ length: gangs }, (_, index) => {
    const cx = cell * index + cell / 2 + gap * index;
    const cy = 16;
    const levers =
      variant === "cs"
        ? `M${cx} ${cy} L${cx + r * 0.7} ${cy - r * 0.55} M${cx} ${cy} L${cx - r * 0.7} ${cy + r * 0.55}`
        : variant === "cruce"
          ? `M${cx - r * 0.6} ${cy - r * 0.6} L${cx + r * 0.6} ${cy + r * 0.6} M${cx + r * 0.6} ${cy - r * 0.6} L${cx - r * 0.6} ${cy + r * 0.6}`
          : `M${cx} ${cy} L${cx + r * 0.7} ${cy - r * 0.55}`;
    return (
      <g key={`${variant}-${index}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={S} strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r="1.2" fill={S} />
        <path d={levers} fill="none" stroke={S} strokeWidth="1.4" strokeLinecap="round" />
      </g>
    );
  });
  return (
    <svg viewBox={`0 0 ${width} 32`} aria-hidden="true">
      {modules}
    </svg>
  );
}
