"use client";

import { useState } from "react";
import type { CableEstimate, CableSettings } from "../../../lib/plan-electric/types";
import { formatMeters } from "../../../lib/plan-electric/cable";

type CablePanelProps = {
  settings: CableSettings;
  estimate: CableEstimate;
  calibrating: boolean;
  calibrationPixels: number | null;
  onChangeSettings: (patch: Partial<CableSettings>) => void;
  onStartCalibration: () => void;
  onCancelCalibration: () => void;
  onApplyCalibration: (realDistanceM: number) => void;
};

export function CablePanel({
  settings,
  estimate,
  calibrating,
  calibrationPixels,
  onChangeSettings,
  onStartCalibration,
  onCancelCalibration,
  onApplyCalibration,
}: CablePanelProps) {
  const [calibrateMeters, setCalibrateMeters] = useState(
    String(settings.calibrationRealDistanceM ?? 1),
  );

  return (
    <section className="pe-cable-panel">
      <div className="pe-panel-title">
        <span>Cablu pardoseală</span>
        <small>Calcul live pe măsură ce plasezi simboluri</small>
      </div>

      <div className="pe-cable-totals">
        <div>
          <strong>{formatMeters(estimate.withReserveM)}</strong>
          <span>total cu rezervă {settings.reservePercent}%</span>
        </div>
        <div>
          <strong>{formatMeters(estimate.rawTotalM)}</strong>
          <span>brut ({estimate.deviceCount} aparate)</span>
        </div>
      </div>

      {!estimate.calibrated && (
        <p className="pe-cable-warn">Calibrează scara planului pentru metri reali.</p>
      )}
      {estimate.calibrated && estimate.missingPanel && (
        <p className="pe-cable-warn">Plasează un tablou electric pe plan.</p>
      )}

      <div className="pe-cable-breakdown">
        <div><span>Prize</span><strong>{formatMeters(estimate.byCategory.prize)}</strong></div>
        <div><span>Întrerupătoare</span><strong>{formatMeters(estimate.byCategory.intrerupatoare)}</strong></div>
        <div><span>Iluminat</span><strong>{formatMeters(estimate.byCategory.iluminat)}</strong></div>
        <div><span>Diverse</span><strong>{formatMeters(estimate.byCategory.diverse)}</strong></div>
      </div>

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
        <span>Înălțimi montaj (m)</span>
      </div>
      <label>
        Prize
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
        Întrerupătoare
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
        Tablou
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
        Iluminat / tavan
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
        Detectoare
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
        Model traseu
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
      <p className="pe-muted pe-cable-hint">
        Formulă: coborâre tablou + traseu pe pardoseală + urcare la aparat.
      </p>
    </section>
  );
}
