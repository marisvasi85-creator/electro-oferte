"use client";

import { useEffect, useState } from "react";
import type { SymbolInstance } from "../../../lib/plan-electric/types";
import { getSymbolDefinition } from "../../../lib/plan-electric/symbols";
import { SymbolPreview } from "./SymbolPreview";

const STORAGE_KEY = "plan-electric.legend.collapsed";

export function Legend({ symbols }: { symbols: SymbolInstance[] }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // ignore storage errors
    }
  }, []);

  const used = new Map<string, string>();
  for (const symbol of symbols) {
    if (!used.has(symbol.symbolType)) {
      used.set(symbol.symbolType, getSymbolDefinition(symbol.symbolType).legend);
    }
  }
  const items = [...used.entries()];

  function toggle() {
    setCollapsed((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }

  return (
    <div className={`pe-legend${collapsed ? " is-collapsed" : ""}`}>
      <button
        type="button"
        className="pe-legend-toggle"
        onClick={toggle}
        aria-expanded={!collapsed}
        title={collapsed ? "Extinde legenda" : "Minimizează legenda"}
      >
        <strong>Legendă{items.length ? ` (${items.length})` : ""}</strong>
        <span aria-hidden="true">{collapsed ? "▸" : "▾"}</span>
      </button>
      {!collapsed && (
        items.length === 0 ? (
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
        )
      )}
    </div>
  );
}
