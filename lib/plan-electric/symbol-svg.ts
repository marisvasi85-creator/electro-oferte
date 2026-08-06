import type { SymbolType } from "./types";
import { SYMBOL_COLORS } from "./symbols";

const S = "#e5e7eb";
const R = SYMBOL_COLORS.outlet;
const G = SYMBOL_COLORS.fixtureGreen;
const Y = SYMBOL_COLORS.led;
const B = SYMBOL_COLORS.switch;
const P = SYMBOL_COLORS.panel;

function svgDoc(viewBox: string, inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" aria-hidden="true">${inner}</svg>`;
}

function switchInner(gangs: 1 | 2 | 3, variant: "normal" | "cs" | "cruce"): string {
  const width = gangs === 1 ? 32 : gangs === 2 ? 44 : 56;
  const gap = gangs === 1 ? 0 : 2;
  const cell = (width - gap * (gangs - 1)) / gangs;
  const r = Math.min(cell, 32) / 2 - 2.5;

  return Array.from({ length: gangs }, (_, index) => {
    const cx = cell * index + cell / 2 + gap * index;
    const cy = 16;
    const levers =
      variant === "cs"
        ? `M${cx} ${cy} L${cx + r * 0.7} ${cy - r * 0.55} M${cx} ${cy} L${cx - r * 0.7} ${cy + r * 0.55}`
        : variant === "cruce"
          ? `M${cx - r * 0.6} ${cy - r * 0.6} L${cx + r * 0.6} ${cy + r * 0.6} M${cx + r * 0.6} ${cy - r * 0.6} L${cx - r * 0.6} ${cy + r * 0.6}`
          : `M${cx} ${cy} L${cx + r * 0.7} ${cy - r * 0.55}`;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${B}" stroke-width="1.5"/><circle cx="${cx}" cy="${cy}" r="1.2" fill="${B}"/><path d="${levers}" fill="none" stroke="${B}" stroke-width="1.4" stroke-linecap="round"/>`;
  }).join("");
}

function switchSvg(gangs: 1 | 2 | 3, variant: "normal" | "cs" | "cruce"): string {
  const width = gangs === 1 ? 32 : gangs === 2 ? 44 : 56;
  return svgDoc(`0 0 ${width} 32`, switchInner(gangs, variant));
}

const SYMBOL_SVG: Record<SymbolType, { width: number; height: number; markup: string }> = {
  priza_simpla: {
    width: 32,
    height: 32,
    markup: svgDoc(
      "0 0 32 32",
      `<circle cx="16" cy="16" r="10" fill="none" stroke="${R}" stroke-width="1.6"/><path d="M10 13.5 H22 M10 16 H22" fill="none" stroke="${R}" stroke-width="1.4"/><path d="M16 18.5 V22.5 M13.2 22.5 H18.8 M13.8 24 H18.2" fill="none" stroke="${R}" stroke-width="1.2"/>`,
    ),
  },
  priza_dubla: {
    width: 40,
    height: 32,
    markup: svgDoc(
      "0 0 40 32",
      `<circle cx="12" cy="16" r="8" fill="none" stroke="${R}" stroke-width="1.5"/><path d="M7.5 14 H16.5 M7.5 16 H16.5 M12 18 V21 M10 21 H14" fill="none" stroke="${R}" stroke-width="1.2"/><circle cx="28" cy="16" r="8" fill="none" stroke="${R}" stroke-width="1.5"/><path d="M23.5 14 H32.5 M23.5 16 H32.5 M28 18 V21 M26 21 H30" fill="none" stroke="${R}" stroke-width="1.2"/>`,
    ),
  },
  priza_tripla: {
    width: 52,
    height: 32,
    markup: svgDoc(
      "0 0 52 32",
      `<circle cx="10" cy="16" r="7" fill="none" stroke="${R}" stroke-width="1.4"/><path d="M6 14 H14 M6 16 H14 M10 18 V21" fill="none" stroke="${R}" stroke-width="1.1"/><circle cx="26" cy="16" r="7" fill="none" stroke="${R}" stroke-width="1.4"/><path d="M22 14 H30 M22 16 H30 M26 18 V21" fill="none" stroke="${R}" stroke-width="1.1"/><circle cx="42" cy="16" r="7" fill="none" stroke="${R}" stroke-width="1.4"/><path d="M38 14 H46 M38 16 H46 M42 18 V21" fill="none" stroke="${R}" stroke-width="1.1"/>`,
    ),
  },
  priza_ip54: {
    width: 32,
    height: 32,
    markup: svgDoc(
      "0 0 32 32",
      `<rect x="4" y="4" width="24" height="24" fill="none" stroke="${R}" stroke-width="1.6"/><circle cx="16" cy="15" r="7" fill="none" stroke="${R}" stroke-width="1.4"/><path d="M11 13 H21 M11 15 H21 M16 17 V20 M14 20 H18" fill="none" stroke="${R}" stroke-width="1.1"/>`,
    ),
  },
  priza_tv: {
    width: 32,
    height: 32,
    markup: svgDoc(
      "0 0 32 32",
      `<circle cx="16" cy="16" r="10" fill="none" stroke="${R}" stroke-width="1.6"/><path d="M16 18 V10 M10 14 L16 9 L22 14" fill="none" stroke="${R}" stroke-width="1.3"/><text x="16" y="24" text-anchor="middle" fill="${R}" font-size="7" font-family="Arial">TV</text>`,
    ),
  },
  priza_data: {
    width: 32,
    height: 32,
    markup: svgDoc(
      "0 0 32 32",
      `<circle cx="16" cy="16" r="10" fill="none" stroke="${R}" stroke-width="1.6"/><rect x="10" y="12" width="12" height="8" fill="none" stroke="${R}" stroke-width="1.2"/><path d="M12 14 V18 M16 14 V18 M20 14 V18" fill="none" stroke="${R}" stroke-width="1.1"/>`,
    ),
  },
  priza_ac: {
    width: 32,
    height: 32,
    markup: svgDoc(
      "0 0 32 32",
      `<circle cx="16" cy="16" r="10" fill="none" stroke="${R}" stroke-width="1.6"/><path d="M9 16 L12 12 L16 20 L20 13 L23 16" fill="none" stroke="${R}" stroke-width="1.3"/><text x="16" y="25" text-anchor="middle" fill="${R}" font-size="7" font-family="Arial">AC</text>`,
    ),
  },
  priza_400v: {
    width: 34,
    height: 32,
    markup: svgDoc(
      "0 0 34 32",
      `<circle cx="17" cy="15" r="11" fill="none" stroke="${R}" stroke-width="1.6"/><path d="M17 8 L23 19 H11 Z" fill="none" stroke="${R}" stroke-width="1.4"/><text x="17" y="30" text-anchor="middle" fill="${R}" font-size="6" font-family="Arial">400V</text>`,
    ),
  },
  intrerupator_simplu: { width: 32, height: 32, markup: switchSvg(1, "normal") },
  intrerupator_dublu: { width: 44, height: 32, markup: switchSvg(2, "normal") },
  intrerupator_triplu: { width: 56, height: 32, markup: switchSvg(3, "normal") },
  intrerupator_cap_scara: { width: 32, height: 32, markup: switchSvg(1, "cs") },
  intrerupator_dublu_cs: { width: 44, height: 32, markup: switchSvg(2, "cs") },
  intrerupator_triplu_cs: { width: 56, height: 32, markup: switchSvg(3, "cs") },
  intrerupator_cruce: { width: 32, height: 32, markup: switchSvg(1, "cruce") },
  intrerupator_dublu_cruce: { width: 44, height: 32, markup: switchSvg(2, "cruce") },
  intrerupator_triplu_cruce: { width: 56, height: 32, markup: switchSvg(3, "cruce") },
  corp_iluminat: {
    width: 32,
    height: 32,
    markup: svgDoc(
      "0 0 32 32",
      `<circle cx="16" cy="16" r="10" fill="none" stroke="${G}" stroke-width="1.6"/><path d="M16 6 V26 M6 16 H26" fill="none" stroke="${G}" stroke-width="1.4"/>`,
    ),
  },
  spot: {
    width: 32,
    height: 32,
    markup: svgDoc(
      "0 0 32 32",
      `<circle cx="16" cy="16" r="9" fill="none" stroke="${G}" stroke-width="1.6"/><circle cx="16" cy="16" r="3" fill="none" stroke="${G}" stroke-width="1.2"/><path d="M16 19 V25 M13 23 H19" fill="none" stroke="${G}" stroke-width="1.2"/>`,
    ),
  },
  aplica: {
    width: 32,
    height: 28,
    markup: svgDoc(
      "0 0 32 28",
      `<path d="M4 24 H28" fill="none" stroke="${G}" stroke-width="1.6"/><path d="M6 24 A10 10 0 0 1 26 24" fill="none" stroke="${G}" stroke-width="1.6"/><path d="M16 14 V18 M12 16 H20" fill="none" stroke="${G}" stroke-width="1.2"/>`,
    ),
  },
  pendul: {
    width: 32,
    height: 34,
    markup: svgDoc(
      "0 0 32 34",
      `<path d="M16 2 V10" fill="none" stroke="${G}" stroke-width="1.5"/><circle cx="16" cy="20" r="8" fill="none" stroke="${G}" stroke-width="1.6"/><path d="M16 12 V28 M8 20 H24" fill="none" stroke="${G}" stroke-width="1.3"/>`,
    ),
  },
  led: {
    width: 48,
    height: 18,
    markup: svgDoc(
      "0 0 48 18",
      `<path d="M4 9 H44" fill="none" stroke="${Y}" stroke-width="2" stroke-dasharray="5 4"/><circle cx="10" cy="9" r="3" fill="${SYMBOL_COLORS.ledBulb}" stroke="${Y}" stroke-width="1"/><circle cx="24" cy="9" r="3" fill="${SYMBOL_COLORS.ledBulb}" stroke="${Y}" stroke-width="1"/><circle cx="38" cy="9" r="3" fill="${SYMBOL_COLORS.ledBulb}" stroke="${Y}" stroke-width="1"/>`,
    ),
  },
  detector_fum: {
    width: 32,
    height: 32,
    markup: svgDoc(
      "0 0 32 32",
      `<circle cx="16" cy="16" r="10" fill="none" stroke="${S}" stroke-width="1.6"/><text x="16" y="20" text-anchor="middle" fill="${S}" font-size="8" font-family="Arial">DF</text>`,
    ),
  },
  detector_gaz: {
    width: 32,
    height: 32,
    markup: svgDoc(
      "0 0 32 32",
      `<circle cx="16" cy="16" r="10" fill="none" stroke="${S}" stroke-width="1.6"/><text x="16" y="20" text-anchor="middle" fill="${S}" font-size="8" font-family="Arial">DG</text>`,
    ),
  },
  tablou_electric: {
    width: 34,
    height: 38,
    markup: svgDoc(
      "0 0 34 38",
      `<rect x="5" y="3" width="24" height="32" fill="none" stroke="${P}" stroke-width="2"/><rect x="8" y="6" width="18" height="26" fill="none" stroke="${P}" stroke-width="1.1"/><path d="M10 14 H24 M10 18 H24 M10 22 H24" fill="none" stroke="${P}" stroke-width="1.2"/><text x="17" y="30" text-anchor="middle" fill="${P}" font-size="8" font-family="Arial">TE</text>`,
    ),
  },
};

/** Full standalone SVG document for a plan symbol (legend / PDF reuse). */
export function getSymbolSvgMarkup(type: SymbolType): string {
  return SYMBOL_SVG[type].markup;
}

/** viewBox dimensions for a plan symbol glyph. */
export function getSymbolSvgSize(type: SymbolType): { width: number; height: number } {
  const { width, height } = SYMBOL_SVG[type];
  return { width, height };
}
