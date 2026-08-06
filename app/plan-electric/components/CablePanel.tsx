"use client";

import { useState } from "react";
import { formatMeters } from "../../../lib/plan-electric/cable";
import type { CalculationResult } from "../../../lib/plan-electric/calculation";
import type { CableSettings } from "../../../lib/plan-electric/types";

type CablePanelProps = {
  settings: CableSettings;
  calculation: CalculationResult;
  calibrating: boolean;
  calibrationPixels: number | null;
  onChangeSettings: (patch: Partial<CableSettings>) => void;
  onStartCalibration: () => void;
  onCancelCalibration: () => void;
  onApplyCalibration: (realDistanceM: number) => void;
  onExportMaterialsCsv?: () => void;
  onExportMaterialsPdf?: () => void;
};

export function CablePanel({
  settings,
  calculation,
  calibrating,
  calibrationPixels,
  onChangeSettings,
  onStartCalibration,
  onCancelCalibration,
  onApplyCalibration,
  onExportMaterialsCsv,
  onExportMaterialsPdf,
}: CablePanelProps) {
  const [calibrateMeters, setCalibrateMeters] = useState(
    String(settings.calibrationRealDistanceM ?? 1),
  );

  const cable15 = calculation.cables.find((item) => item.technicalKey.includes("3x1.5") || item.technicalKey.includes("3x1,5"));
  const cable25 = calculation.cables.find((item) => item.technicalKey.includes("3x2.5") || item.technicalKey.includes("3x2,5"));
  const otherCables = calculation.cables.filter(
    (item) => item !== cable15 && item !== cable25,
  );
  const framesTotal = calculation.frames.reduce((sum, item) => sum + item.quantity, 0);
  const accessoriesTotal = calculation.accessories.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <section className="pe-cable-panel">
      <div className="pe-panel-title">
        <span>Calculation Engine</span>
        <small>Materiale calculate din catalog + trasee logice</small>
      </div>

      <div className="pe-cable-totals">
        <div>
          <strong>{formatMeters(calculation.totals.cableWithReserveM)}</strong>
          <span>cablu total + rezervă {calculation.reservePercent}%</span>
        </div>
        <div>
          <strong>{formatMeters(calculation.totals.cableRawM)}</strong>
          <span>brut · {calculation.counts.devicesTotal} aparate</span>
        </div>
      </div>

      {!calculation.calibrated && (
        <p className="pe-cable-warn">Calibrează scara planului pentru metri reali.</p>
      )}
      {calculation.calibrated && calculation.missingPanel && (
        <p className="pe-cable-warn">Plasează un tablou electric pe plan.</p>
      )}
      {calculation.diagnostics.map((message) => (
        <p key={message} className="pe-cable-warn">{message}</p>
      ))}

      <div className="pe-panel-title pe-panel-title-tight">
        <span>Cabluri</span>
      </div>
      <div className="pe-cable-breakdown">
        <div>
          <span>3x1,5 mm²</span>
          <strong>{formatMeters(cable15?.lengthWithReserveM ?? 0)}</strong>
        </div>
        <div>
          <span>3x2,5 mm²</span>
          <strong>{formatMeters(cable25?.lengthWithReserveM ?? 0)}</strong>
        </div>
        {otherCables.map((cable) => (
          <div key={cable.technicalKey}>
            <span>{cable.label}</span>
            <strong>{formatMeters(cable.lengthWithReserveM)}</strong>
          </div>
        ))}
      </div>

      <div className="pe-panel-title pe-panel-title-tight">
        <span>Aparate & doze</span>
      </div>
      <div className="pe-cable-breakdown">
        <div><span>Prize</span><strong>{calculation.counts.sockets}</strong></div>
        <div><span>Întrerupătoare</span><strong>{calculation.counts.switches}</strong></div>
        <div><span>Corpuri iluminat</span><strong>{calculation.counts.lights}</strong></div>
        <div><span>Doze aparat</span><strong>{calculation.deviceBoxes}</strong></div>
        <div><span>Rame</span><strong>{framesTotal}</strong></div>
        <div><span>Accesorii</span><strong>{accessoriesTotal}</strong></div>
      </div>

      {calculation.circuits.length > 0 && (
        <>
          <div className="pe-panel-title pe-panel-title-tight">
            <span>Circuite</span>
          </div>
          <div className="pe-cable-breakdown">
            {calculation.circuits.map((circuit) => (
              <div key={circuit.name}>
                <span>{circuit.name} · {circuit.deviceCount} aparate</span>
                <strong>{formatMeters(circuit.lengthWithReserveM)}</strong>
              </div>
            ))}
          </div>
        </>
      )}

      {calculation.billOfMaterials.length > 0 && (
        <>
          <div className="pe-panel-title pe-panel-title-tight">
            <span>Deviz materiale</span>
          </div>
          <div className="pe-export-group pe-bom-export">
            <button
              type="button"
              className="pe-cable-calibrate-btn"
              disabled={!onExportMaterialsCsv}
              onClick={() => onExportMaterialsCsv?.()}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="pe-cable-calibrate-btn"
              disabled={!onExportMaterialsPdf}
              onClick={() => onExportMaterialsPdf?.()}
            >
              Export PDF deviz
            </button>
          </div>
          <div className="pe-bom-list">
            {calculation.billOfMaterials.map((line) => (
              <div key={`${line.group}-${line.technicalKey}`} className="pe-bom-row">
                <span className="pe-bom-group">{labelForGroup(line.group)}</span>
                <span className="pe-bom-desc">{line.description}</span>
                <strong>
                  {line.unit === "m" ? formatMeters(line.quantity) : `${roundQty(line.quantity)} ${line.unit}`}
                </strong>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="pe-panel-title pe-panel-title-tight">
        <span>Scară</span>
      </div>
      {calibrating ? (
        <div className="pe-calibrate-box">
          <p className="pe-muted">
            Click pe două puncte pe plan
            {calibrationPixels != null ? ` · ${Math.round(calibrationPixels)} px` : ""}.
          </p>
          <label>
            Distanță reală (m)
            <input
              type="number"
              min={0.1}
              step={0.01}
              value={calibrateMeters}
              onChange={(event) => setCalibrateMeters(event.target.value)}
            />
          </label>
          <div className="pe-inspector-actions">
            <button
              type="button"
              disabled={!(calibrationPixels && calibrationPixels > 0)}
              onClick={() => onApplyCalibration(Number(calibrateMeters) || 0)}
            >
              Aplică
            </button>
            <button type="button" onClick={onCancelCalibration}>Anulează</button>
          </div>
        </div>
      ) : (
        <>
          <p className="pe-muted pe-cable-scale">
            {settings.metersPerPixel
              ? `1 px = ${(settings.metersPerPixel * 1000).toFixed(2)} mm · ${settings.calibrationRealDistanceM ?? "—"} m / ${settings.calibrationPixelDistance ? Math.round(settings.calibrationPixelDistance) : "—"} px`
              : "Scară necalibrată"}
          </p>
          <button type="button" className="pe-cable-calibrate-btn" onClick={onStartCalibration}>
            Calibrează scara
          </button>
        </>
      )}

      <div className="pe-panel-title pe-panel-title-tight">
        <span>Configurație calcul</span>
      </div>
      <label>
        Prize (m)
        <input
          type="number"
          min={0}
          max={3}
          step={0.05}
          value={settings.outletHeightM}
          onChange={(event) => onChangeSettings({ outletHeightM: Number(event.target.value) || 0 })}
        />
      </label>
      <label>
        Întrerupătoare (m)
        <input
          type="number"
          min={0}
          max={3}
          step={0.05}
          value={settings.switchHeightM}
          onChange={(event) => onChangeSettings({ switchHeightM: Number(event.target.value) || 0 })}
        />
      </label>
      <label>
        Tablou (m)
        <input
          type="number"
          min={0}
          max={3}
          step={0.05}
          value={settings.panelHeightM}
          onChange={(event) => onChangeSettings({ panelHeightM: Number(event.target.value) || 0 })}
        />
      </label>
      <label>
        Iluminat / tavan (m)
        <input
          type="number"
          min={0}
          max={5}
          step={0.05}
          value={settings.lightHeightM}
          onChange={(event) => onChangeSettings({ lightHeightM: Number(event.target.value) || 0 })}
        />
      </label>
      <label>
        Detectoare (m)
        <input
          type="number"
          min={0}
          max={5}
          step={0.05}
          value={settings.detectorHeightM}
          onChange={(event) => onChangeSettings({ detectorHeightM: Number(event.target.value) || 0 })}
        />
      </label>
      <label>
        Rezervă cablu (%)
        <input
          type="number"
          min={0}
          max={50}
          step={1}
          value={settings.reservePercent}
          onChange={(event) => onChangeSettings({ reservePercent: Number(event.target.value) || 0 })}
        />
      </label>
      <label>
        Geometrie pardoseală
        <select
          value={settings.routing}
          onChange={(event) =>
            onChangeSettings({
              routing: event.target.value === "floor_euclidean" ? "floor_euclidean" : "floor_orthogonal",
            })
          }
        >
          <option value="floor_orthogonal">Ortogonal (recomandat)</option>
          <option value="floor_euclidean">Linie dreaptă</option>
        </select>
      </label>
      <label>
        Topologie trasee
        <select
          value={settings.routingMode}
          onChange={(event) =>
            onChangeSettings({
              routingMode: event.target.value === "home_run" ? "home_run" : "circuit_tree",
            })
          }
        >
          <option value="circuit_tree">Arbore pe circuit (realist)</option>
          <option value="home_run">Home-run din tablou</option>
        </select>
      </label>
      <p className="pe-muted pe-cable-hint">
        Motor modular: cabluri, doze aparat, rame și accesorii din metadatele catalogului. Extensibil pentru I7, cădere tensiune, siguranțe, manoperă.
      </p>
    </section>
  );
}

function labelForGroup(group: string): string {
  if (group === "cable") return "Cablu";
  if (group === "device") return "Aparat";
  if (group === "box") return "Doză";
  if (group === "frame") return "Ramă";
  return "Acc.";
}

function roundQty(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}
