"use client";

import type { SymbolInstance } from "../../../lib/plan-electric/types";
import {
  defaultMountingHeightM,
  resolveMountingHeightM,
} from "../../../lib/plan-electric/cable";
import type { CableSettings } from "../../../lib/plan-electric/types";
import { getSymbolDefinition } from "../../../lib/plan-electric/symbols";

type InspectorProps = {
  symbol: SymbolInstance | null;
  settings: CableSettings;
  onChange: (patch: Partial<SymbolInstance>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

export function Inspector({ symbol, settings, onChange, onDelete, onDuplicate }: InspectorProps) {
  if (!symbol) {
    return (
      <section className="pe-symbol-inspector">
        <div className="pe-panel-title">
          <span>Proprietăți</span>
          <small>Selectează un simbol pe plan</small>
        </div>
        <p className="pe-muted">Click pe un simbol pentru denumire, observații, rotație și înălțime montaj.</p>
      </section>
    );
  }

  const def = getSymbolDefinition(symbol.symbolType);
  const height = resolveMountingHeightM(symbol, settings);
  const hasOverride = typeof symbol.metadata?.mountingHeightM === "number";

  return (
    <section className="pe-symbol-inspector">
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
        Înălțime montaj (m)
        <input
          type="number"
          min={0}
          max={5}
          step={0.05}
          value={height}
          onChange={(event) => {
            const value = Number(event.target.value);
            onChange({
              metadata: {
                ...symbol.metadata,
                mountingHeightM: Number.isFinite(value) ? value : defaultMountingHeightM(symbol.symbolType, settings),
              },
            });
          }}
        />
      </label>
      {hasOverride && (
        <button
          type="button"
          className="pe-cable-calibrate-btn"
          onClick={() => {
            const next = { ...symbol.metadata };
            delete next.mountingHeightM;
            onChange({ metadata: next });
          }}
        >
          Resetează la default categorie
        </button>
      )}
      <label>
        Rotație (°)
        <input
          type="number"
          value={Math.round(symbol.rotation)}
          onChange={(event) => onChange({ rotation: Number(event.target.value) || 0 })}
        />
      </label>
      <label>
        Scară simbol
        <input
          type="number"
          min={0.3}
          max={3}
          step={0.1}
          value={symbol.scale}
          onChange={(event) => onChange({ scale: Number(event.target.value) || 1 })}
        />
      </label>
      {symbol.symbolType === "led" && (
        <label>
          Lungime bandă LED (px)
          <input
            type="number"
            min={40}
            max={4000}
            step={10}
            value={typeof symbol.metadata?.ledLengthPx === "number" ? symbol.metadata.ledLengthPx : 120}
            onChange={(event) => {
              const value = Number(event.target.value) || 120;
              onChange({
                metadata: {
                  ...symbol.metadata,
                  ledLengthPx: Math.min(4000, Math.max(40, value)),
                },
              });
            }}
          />
        </label>
      )}
      {symbol.symbolType === "led" && (
        <p className="pe-muted pe-cable-hint">
        Selectează banda LED și trage capetele (cercurile) ca să o alungești sau scurtezi.
      </p>
      )}
      <div className="pe-inspector-actions">
        <button type="button" onClick={onDuplicate}>Duplică</button>
        <button type="button" className="danger" onClick={onDelete}>Șterge</button>
      </div>
    </section>
  );
}
