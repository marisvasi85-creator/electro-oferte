"use client";

type ToolbarProps = {
  title: string;
  snapEnabled: boolean;
  canUndo: boolean;
  canRedo: boolean;
  busy?: string;
  onBack: () => void;
  onImport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onResetZoom: () => void;
  onToggleSnap: () => void;
  onSave: () => void;
  onExport: (format: "pdf-a4" | "pdf-a3" | "png" | "jpeg") => void;
};

export function PlanToolbar({
  title,
  snapEnabled,
  canUndo,
  canRedo,
  busy,
  onBack,
  onImport,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFit,
  onResetZoom,
  onToggleSnap,
  onSave,
  onExport,
}: ToolbarProps) {
  return (
    <header className="pe-toolbar">
      <div className="pe-toolbar-left">
        <button type="button" onClick={onBack}>← Proiecte</button>
        <strong>{title}</strong>
        {busy && <span className="pe-busy">{busy}</span>}
      </div>
      <div className="pe-toolbar-actions">
        <button type="button" onClick={onImport}>Import</button>
        <button type="button" onClick={onUndo} disabled={!canUndo}>Undo</button>
        <button type="button" onClick={onRedo} disabled={!canRedo}>Redo</button>
        <button type="button" onClick={onZoomOut}>Zoom −</button>
        <button type="button" onClick={onZoomIn}>Zoom +</button>
        <button type="button" onClick={onFit}>Fit</button>
        <button type="button" onClick={onResetZoom}>Reset zoom</button>
        <button type="button" className={snapEnabled ? "active" : ""} onClick={onToggleSnap}>
          Snap {snapEnabled ? "ON" : "OFF"}
        </button>
        <button type="button" onClick={onSave}>Salvează</button>
        <div className="pe-export-group">
          <button type="button" onClick={() => onExport("pdf-a4")}>PDF A4</button>
          <button type="button" onClick={() => onExport("pdf-a3")}>PDF A3</button>
          <button type="button" onClick={() => onExport("png")}>PNG</button>
          <button type="button" onClick={() => onExport("jpeg")}>JPEG</button>
        </div>
      </div>
    </header>
  );
}
