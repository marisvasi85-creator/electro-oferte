"use client";

import { CATEGORY_LABELS, SYMBOL_LIBRARY, symbolsByCategory } from "../../../lib/plan-electric/symbols";
import type { SymbolCategory, SymbolType } from "../../../lib/plan-electric/types";
import { SymbolPreview } from "./SymbolPreview";

type SidebarSymbolsProps = {
  onPlace: (type: SymbolType) => void;
  onDragStart: (type: SymbolType, event: React.DragEvent) => void;
};

const categories: SymbolCategory[] = ["prize", "intrerupatoare", "iluminat", "diverse"];

export function SidebarSymbols({ onPlace, onDragStart }: SidebarSymbolsProps) {
  return (
    <aside className="pe-sidebar">
      <div className="pe-panel-title">
        <span>Bibliotecă</span>
        <small>{SYMBOL_LIBRARY.length} simboluri CAD</small>
      </div>
      {categories.map((category) => (
        <section key={category} className="pe-symbol-group">
          <h3>{CATEGORY_LABELS[category]}</h3>
          <div className="pe-symbol-grid">
            {symbolsByCategory(category).map((symbol) => (
              <button
                key={symbol.type}
                type="button"
                className="pe-symbol-card"
                draggable
                onDragStart={(event) => onDragStart(symbol.type, event)}
                onClick={() => onPlace(symbol.type)}
                title={symbol.label}
              >
                <SymbolPreview type={symbol.type} />
                <span>{symbol.label}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </aside>
  );
}
