"use client";

import type { SymbolInstance } from "../../../lib/plan-electric/types";
import { getSymbolDefinition } from "../../../lib/plan-electric/symbols";
import { SymbolPreview } from "./SymbolPreview";

export function Legend({ symbols }: { symbols: SymbolInstance[] }) {
  const used = new Map<string, string>();
  for (const symbol of symbols) {
    if (!used.has(symbol.symbolType)) {
      used.set(symbol.symbolType, getSymbolDefinition(symbol.symbolType).legend);
    }
  }
  const items = [...used.entries()];

  return (
    <div className="pe-legend">
      <strong>Legendă</strong>
      {items.length === 0 ? (
        <p>Niciun simbol pe plan.</p>
      ) : (
        <ul>
          {items.map(([type, legend]) => (
            <li key={type}>
              <span className="pe-legend-icon"><SymbolPreview type={type as never} /></span>
              <span>{legend}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
