"use client";

import type { SymbolType } from "../../../lib/plan-electric/types";
import { getSymbolSvgMarkup } from "../../../lib/plan-electric/symbol-svg";

/** SVG previews matching Romanian normative Konva glyphs. */
export function SymbolPreview({ type }: { type: SymbolType }) {
  return <span className="pe-symbol-svg" dangerouslySetInnerHTML={{ __html: getSymbolSvgMarkup(type) }} />;
}
