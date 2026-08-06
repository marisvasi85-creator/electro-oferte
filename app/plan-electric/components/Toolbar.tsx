"use client";

type ToolbarProps = {
  title: string;
  snapEnabled: boolean;
  showCableGuides: boolean;
  calibrating: boolean;
  panMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  busy?: string;
  cableTotalLabel?: string;
  libraryOpen?: boolean;
  inspectorOpen?: boolean;
  onBack: () => void;
  onImport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onResetZoom: () => void;
  onToggleSnap: () => void;
  onToggleCableGuides: () => void;
  onTogglePanMode: () => void;
  onCalibrate: () => void;
  onSave: () => void;
  onToggleLibrary?: () => void;
  onToggleInspector?: () => void;
  onExport: (format: "pdf-a4" | "pdf-a3" | "png" | "jpeg") => void;
  onExportMaterialsCsv?: () => void;
  onExportMaterialsPdf?: () => void;
  canExportMaterials?: boolean;
};

export function PlanToolbar({
  title,
  snapEnabled,
  showCableGuides,
  calibrating,
  panMode,
  canUndo,
  canRedo,
  busy,
  cableTotalLabel,
  libraryOpen = false,
  inspectorOpen = false,
  onBack,
  onImport,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFit,
  onResetZoom,
  onToggleSnap,
  onToggleCableGuides,
  onTogglePanMode,
  onCalibrate,
  onSave,
  onToggleLibrary,
  onToggleInspector,
  onExport,
  onExportMaterialsCsv,
  onExportMaterialsPdf,
  canExportMaterials = false,
}: ToolbarProps) {
  return (
    <header className="pe-toolbar">
      <div className="pe-toolbar-left">
        <button type="button" onClick={onBack}>← Proiecte</button>
        <strong>{title}</strong>
        {cableTotalLabel && <span className="pe-cable-badge">{cableTotalLabel}</span>}
        {busy && <span className="pe-busy">{busy}</span>}
      </div>
      <div className="pe-toolbar-actions">
        <div className="pe-mobile-tools">
          <button
            type="button"
            data-tool="library"
            className={libraryOpen ? "active pe-mobile-primary" : "pe-mobile-primary"}
            onClick={onToggleLibrary}
          >
            Bibliotecă
          </button>
          <button
            type="button"
            data-tool="deviz"
            className={inspectorOpen ? "active pe-mobile-primary" : "pe-mobile-primary"}
            onClick={onToggleInspector}
          >
            Deviz
          </button>
        </div>
        <button type="button" onClick={onImport}>Import</button>
        <button type="button" onClick={onUndo} disabled={!canUndo}>Undo</button>
        <button type="button" onClick={onRedo} disabled={!canRedo}>Redo</button>
        <button type="button" className={panMode ? "active" : ""} onClick={onTogglePanMode} title="Mută planul (fără zoom)">
          Mână
        </button>
        <button type="button" onClick={onZoomOut}>Zoom −</button>
        <button type="button" onClick={onZoomIn}>Zoom +</button>
        <button type="button" onClick={onFit}>Fit</button>
        <button type="button" onClick={onResetZoom}>Reset zoom</button>
        <button type="button" className={snapEnabled ? "active" : ""} onClick={onToggleSnap}>
          Snap {snapEnabled ? "ON" : "OFF"}
        </button>
        <button type="button" className={calibrating ? "active" : ""} onClick={onCalibrate}>
          Calibrare
        </button>
        <button type="button" className={showCableGuides ? "active" : ""} onClick={onToggleCableGuides}>
          Trasee
        </button>
        <button type="button" onClick={onSave}>Salvează</button>
        <div className="pe-export-group">
          <button type="button" onClick={() => onExport("pdf-a4")}>PDF A4</button>
          <button type="button" onClick={() => onExport("pdf-a3")}>PDF A3</button>
          <button type="button" onClick={() => onExport("png")}>PNG</button>
          <button type="button" onClick={() => onExport("jpeg")}>JPEG</button>
          <button
            type="button"
            className="pe-deviz-btn"
            disabled={!canExportMaterials || !onExportMaterialsCsv}
            onClick={() => onExportMaterialsCsv?.()}
            title="Descarcă devizul de materiale CSV"
          >
            Deviz CSV
          </button>
          <button
            type="button"
            className="pe-deviz-btn"
            disabled={!canExportMaterials || !onExportMaterialsPdf}
            onClick={() => onExportMaterialsPdf?.()}
            title="Descarcă devizul de materiale PDF"
          >
            Deviz PDF
          </button>
        </div>
      </div>
    </header>
  );
}
