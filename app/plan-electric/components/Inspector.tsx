"use client";

import type { SymbolInstance } from "../../../lib/plan-electric/types";
import { getSymbolDefinition } from "../../../lib/plan-electric/symbols";

type InspectorProps = {
  symbol: SymbolInstance | null;
  onChange: (patch: Partial<SymbolInstance>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

export function Inspector({ symbol, onChange, onDelete, onDuplicate }: InspectorProps) {
  if (!symbol) {
    return (
      <aside className="pe-inspector">
        <div className="pe-panel-title"><span>Inspector</span></div>
        <p className="pe-muted">Selectează un simbol pe plan pentru a-i edita proprietățile.</p>
      </aside>
    );
  }

  const def = getSymbolDefinition(symbol.symbolType);

  return (
    <aside className="pe-inspector">
      <div className="pe-panel-title">
        <span>Proprietăți</span>
        <small>{def.label}</small>
      </div>
      <label>
        Denumire
        <input value={symbol.label} onChange={(event) => onChange({ label: event.target.value })} />
      </label>
      <label>
        Observații
        <textarea value={symbol.notes} rows={3} onChange={(event) => onChange({ notes: event.target.value })} />
      </label>
      <label>
        Rotație (°)
        <input
          type="number"
          value={Math.round(symbol.rotation)}
          onChange={(event) => onChange({ rotation: Number(event.target.value) || 0 })}
        />
      </label>
      <label>
        Scară
        <input
          type="number"
          min={0.4}
          max={3}
          step={0.1}
          value={symbol.scale}
          onChange={(event) => onChange({ scale: Number(event.target.value) || 1 })}
        />
      </label>
      <div className="pe-inspector-actions">
        <button type="button" onClick={onDuplicate}>Duplică</button>
        <button type="button" className="danger" onClick={onDelete}>Șterge</button>
      </div>
    </aside>
  );
}
