"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type Konva from "konva";
import type { User } from "@supabase/supabase-js";
import { PlanToolbar } from "../components/Toolbar";
import { SidebarSymbols } from "../components/SidebarSymbols";
import { Inspector } from "../components/Inspector";
import { CablePanel } from "../components/CablePanel";
import { Legend } from "../components/Legend";
import { buildEdgeGuides, useHistory, usePan, useZoom } from "../hooks/editor-hooks";
import {
  getPlanProjectBundle,
  savePlanSymbols,
  updatePlanPageBackground,
  updatePlanPageSettings,
  uploadPlanBackground,
} from "../../../lib/plan-electric/data";
import { importPlanFile } from "../../../lib/plan-electric/import-plan";
import { exportPlanImage, exportPlanPdf } from "../../../lib/plan-electric/export";
import {
  estimateCable,
  mergeCableSettings,
  metersPerPixelFromCalibration,
} from "../../../lib/plan-electric/cable";
import type { CableSettings, PlanPage, PlanProject, SymbolInstance, SymbolType } from "../../../lib/plan-electric/types";
import { getSymbolDefinition, DEFAULT_SYMBOL_SCALE, DEFAULT_LED_LENGTH_PX } from "../../../lib/plan-electric/symbols";
import { supabase } from "../../../lib/supabase";

const CanvasEditor = dynamic(
  () => import("../components/CanvasEditor").then((mod) => mod.CanvasEditor),
  { ssr: false },
);

export function PlanEditorApp({ projectId }: { projectId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<PlanProject | null>(null);
  const [page, setPage] = useState<PlanPage | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [panMode, setPanMode] = useState(false);
  const [showCableGuides, setShowCableGuides] = useState(true);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<{ x: number; y: number }[]>([]);
  const [busy, setBusy] = useState("Se încarcă proiectul…");
  const [guides, setGuides] = useState<{ vertical: number[]; horizontal: number[] }>({ vertical: [], horizontal: [] });
  const [stageSize, setStageSize] = useState({ width: 900, height: 700 });
  const history = useHistory<SymbolInstance[]>([]);
  const zoom = useZoom(0.35);
  const pan = usePan();
  const stageRef = useRef<Konva.Stage | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const settingsSaveTimer = useRef<number | null>(null);

  const settings = page?.settings ?? mergeCableSettings();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    let cancelled = false;
    getPlanProjectBundle(projectId)
      .then((bundle) => {
        if (cancelled) return;
        setProject(bundle.project);
        setPage(bundle.pages[0] ?? null);
        history.reset(bundle.symbols);
        setBusy("");
      })
      .catch((error: Error) => setBusy(error.message));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        pan.setSpacePressed(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) history.redo();
        else history.undo();
      }
      if (event.key === "Escape" && calibrating) {
        setCalibrating(false);
        setCalibrationPoints([]);
      }
      if (event.key.toLowerCase() === "h" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return;
        }
        event.preventDefault();
        setPanMode((value) => !value);
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedId && !calibrating) {
          history.set((symbols) => symbols.filter((symbol) => symbol.id !== selectedId));
          setSelectedId(null);
        }
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") pan.setSpacePressed(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [calibrating, history, pan, selectedId]);

  useEffect(() => {
    const node = shellRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setStageSize({
        width: Math.max(320, Math.floor(entry.contentRect.width)),
        height: Math.max(320, Math.floor(entry.contentRect.height)),
      });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!page?.backgroundUrl) {
      setGuides({ vertical: [], horizontal: [] });
      return;
    }
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => setGuides(buildEdgeGuides(image));
    image.src = page.backgroundUrl;
  }, [page?.backgroundUrl]);

  const selected = useMemo(
    () => history.present.find((symbol) => symbol.id === selectedId) ?? null,
    [history.present, selectedId],
  );

  const cableEstimate = useMemo(
    () => estimateCable(history.present, settings),
    [history.present, settings],
  );

  const calibrationPixels = useMemo(() => {
    if (calibrationPoints.length < 2) return null;
    const [a, b] = calibrationPoints;
    return Math.hypot(b.x - a.x, b.y - a.y);
  }, [calibrationPoints]);

  const persistSettings = useCallback((pageId: string, nextSettings: CableSettings) => {
    if (settingsSaveTimer.current) window.clearTimeout(settingsSaveTimer.current);
    settingsSaveTimer.current = window.setTimeout(() => {
      void updatePlanPageSettings(pageId, nextSettings).catch(() => {
        // Local fallback already handled inside updatePlanPageSettings.
      });
    }, 400);
  }, []);

  const patchSettings = useCallback((patch: Partial<CableSettings>) => {
    setPage((current) => {
      if (!current) return current;
      const nextSettings = mergeCableSettings({ ...current.settings, ...patch });
      persistSettings(current.id, nextSettings);
      return { ...current, settings: nextSettings };
    });
  }, [persistSettings]);

  const fitToScreen = useCallback(() => {
    if (!page) return;
    const next = Math.min(
      (stageSize.width - 48) / page.width,
      (stageSize.height - 48) / page.height,
    );
    zoom.zoomTo(Math.max(0.1, next));
    pan.setPosition({
      x: (stageSize.width - page.width * next) / 2,
      y: (stageSize.height - page.height * next) / 2,
    });
  }, [page, pan, stageSize.height, stageSize.width, zoom]);

  const placeSymbol = useCallback((type: SymbolType, x?: number, y?: number) => {
    if (!page || calibrating) return;
    const def = getSymbolDefinition(type);
    const instance: SymbolInstance = {
      id: crypto.randomUUID(),
      pageId: page.id,
      symbolType: type,
      x: x ?? page.width / 2,
      y: y ?? page.height / 2,
      rotation: 0,
      scale: DEFAULT_SYMBOL_SCALE,
      label: def.label,
      notes: "",
      metadata: type === "led"
        ? { ledLengthPx: DEFAULT_LED_LENGTH_PX, ledOrientation: "horizontal" }
        : {},
    };
    history.set((symbols) => [...symbols, instance]);
    setSelectedId(instance.id);
  }, [calibrating, history, page]);

  async function handleImport(file: File) {
    if (!user || !project || !page) return;
    setBusy("Se importă planul…");
    try {
      const imported = await importPlanFile(file);
      const uploaded = await uploadPlanBackground(user.id, project.id, imported.blob, `${file.name}.png`);
      const updated = await updatePlanPageBackground({
        pageId: page.id,
        backgroundPath: uploaded.path,
        width: imported.width,
        height: imported.height,
      });
      setPage({
        ...updated,
        backgroundUrl: uploaded.url || updated.backgroundUrl,
        settings: page.settings,
      });
      setBusy("Plan importat.");
      window.setTimeout(() => setBusy(""), 1200);
    } catch (error) {
      setBusy(error instanceof Error ? error.message : "Import eșuat.");
    }
  }

  async function handleSave() {
    if (!page) return;
    setBusy("Se salvează…");
    try {
      await savePlanSymbols(page.id, history.present);
      await updatePlanPageSettings(page.id, page.settings);
      setBusy("Salvat.");
      window.setTimeout(() => setBusy(""), 1200);
    } catch (error) {
      setBusy(error instanceof Error ? error.message : "Salvarea a eșuat.");
    }
  }

  async function handleExport(format: "pdf-a4" | "pdf-a3" | "png" | "jpeg") {
    if (!stageRef.current || !project || !page) return;
    setBusy("Se exportă…");
    try {
      const fileName = (project.name || "plan-electric").replace(/\s+/g, "-").toLowerCase();
      if (format === "png" || format === "jpeg") {
        await exportPlanImage({ stage: stageRef.current, format, fileName });
      } else {
        await exportPlanPdf({
          stage: stageRef.current,
          project,
          page,
          symbols: history.present,
          size: format === "pdf-a3" ? "a3" : "a4",
          fileName,
        });
      }
      setBusy("Export finalizat.");
      window.setTimeout(() => setBusy(""), 1200);
    } catch (error) {
      setBusy(error instanceof Error ? error.message : "Export eșuat.");
    }
  }

  function applyCalibration(realDistanceM: number) {
    if (!calibrationPixels || calibrationPixels <= 0 || !(realDistanceM > 0)) {
      setBusy("Calibrare invalidă — setează distanța reală.");
      return;
    }
    const metersPerPixel = metersPerPixelFromCalibration(calibrationPixels, realDistanceM);
    if (!metersPerPixel) return;
    patchSettings({
      metersPerPixel,
      calibrationPixelDistance: calibrationPixels,
      calibrationRealDistanceM: realDistanceM,
    });
    setCalibrating(false);
    setCalibrationPoints([]);
    setBusy("Scară calibrată.");
    window.setTimeout(() => setBusy(""), 1200);
  }

  if (!project || !page) {
    return (
      <main className="pe-app">
        <div className="pe-loading">
          <p>{busy || "Se încarcă…"}</p>
          <Link href="/plan-electric">← Înapoi la proiecte</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pe-app">
      <PlanToolbar
        title={project.name}
        snapEnabled={snapEnabled}
        panMode={panMode}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        busy={busy}
        cableTotalLabel={cableEstimate.calibrated && !cableEstimate.missingPanel
          ? `${cableEstimate.withReserveM.toFixed(1)} m cablu`
          : undefined}
        onBack={() => { window.location.href = "/plan-electric"; }}
        onImport={() => importInput.current?.click()}
        onUndo={history.undo}
        onRedo={history.redo}
        onZoomIn={() => zoom.zoomBy(1.15)}
        onZoomOut={() => zoom.zoomBy(1 / 1.15)}
        onFit={fitToScreen}
        onResetZoom={() => { zoom.zoomTo(0.35); pan.setPosition({ x: 40, y: 40 }); }}
        onToggleSnap={() => setSnapEnabled((value) => !value)}
        onTogglePanMode={() => setPanMode((value) => !value)}
        onToggleCableGuides={() => setShowCableGuides((value) => !value)}
        showCableGuides={showCableGuides}
        onCalibrate={() => {
          setCalibrating(true);
          setCalibrationPoints([]);
          setSelectedId(null);
          setPanMode(false);
        }}
        calibrating={calibrating}
        onSave={() => void handleSave()}
        onExport={(format) => void handleExport(format)}
      />
      <input
        ref={importInput}
        hidden
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleImport(file);
          event.currentTarget.value = "";
        }}
      />
      <div className="pe-workspace">
        <SidebarSymbols
          onPlace={(type) => placeSymbol(type)}
          onDragStart={(type, event) => {
            event.dataTransfer.setData("application/plan-symbol", type);
            event.dataTransfer.effectAllowed = "copy";
          }}
        />
        <div className="pe-canvas-wrap" ref={shellRef}>
          <CanvasEditor
            width={page.width}
            height={page.height}
            stageWidth={stageSize.width}
            stageHeight={stageSize.height}
            scale={zoom.scale}
            position={pan.position}
            backgroundUrl={page.backgroundUrl}
            symbols={history.present}
            selectedId={selectedId}
            spacePressed={pan.spacePressed}
            panMode={panMode}
            snapEnabled={snapEnabled}
            calibrating={calibrating}
            calibrationPoints={calibrationPoints}
            cableRuns={cableEstimate.runs}
            showCableGuides={showCableGuides && cableEstimate.calibrated && !cableEstimate.missingPanel}
            guides={guides}
            stageRef={stageRef}
            onSelect={setSelectedId}
            onMove={(id, x, y) => {
              history.set((symbols) => symbols.map((symbol) => (symbol.id === id ? { ...symbol, x, y } : symbol)));
            }}
            onPanBy={(dx, dy) => pan.panBy(dx, dy)}
            onZoomAt={(factor, pointer) => {
              const oldScale = zoom.scale;
              const next = Math.min(4, Math.max(0.1, oldScale * factor));
              const mousePointTo = {
                x: (pointer.x - pan.position.x) / oldScale,
                y: (pointer.y - pan.position.y) / oldScale,
              };
              zoom.zoomTo(next);
              pan.setPosition({
                x: pointer.x - mousePointTo.x * next,
                y: pointer.y - mousePointTo.y * next,
              });
            }}
            onDropSymbol={(type, x, y) => placeSymbol(type, x, y)}
            onLedLengthChange={(id, lengthPx, commit = true) => {
              history.set((symbols) => symbols.map((symbol) => (
                symbol.id === id
                  ? { ...symbol, metadata: { ...symbol.metadata, ledLengthPx: lengthPx } }
                  : symbol
              )), commit);
            }}
            onCalibrationClick={(x, y) => {
              setCalibrationPoints((points) => {
                if (points.length >= 2) return [{ x, y }];
                return [...points, { x, y }];
              });
            }}
          />
          <Legend symbols={history.present} />
        </div>
        <aside className="pe-inspector">
          <CablePanel
            settings={settings}
            estimate={cableEstimate}
            calibrating={calibrating}
            calibrationPixels={calibrationPixels}
            onChangeSettings={patchSettings}
            onStartCalibration={() => {
              setCalibrating(true);
              setCalibrationPoints([]);
              setSelectedId(null);
            }}
            onCancelCalibration={() => {
              setCalibrating(false);
              setCalibrationPoints([]);
            }}
            onApplyCalibration={applyCalibration}
          />
          <Inspector
            symbol={selected}
            settings={settings}
            onChange={(patch) => {
              if (!selectedId) return;
              history.set((symbols) => symbols.map((symbol) => {
                if (symbol.id !== selectedId) return symbol;
                if (patch.metadata) {
                  return { ...symbol, ...patch, metadata: patch.metadata };
                }
                return { ...symbol, ...patch };
              }));
            }}
            onDelete={() => {
              if (!selectedId) return;
              history.set((symbols) => symbols.filter((symbol) => symbol.id !== selectedId));
              setSelectedId(null);
            }}
            onDuplicate={() => {
              if (!selected) return;
              const clone: SymbolInstance = {
                ...selected,
                id: crypto.randomUUID(),
                x: selected.x + 24,
                y: selected.y + 24,
                metadata: { ...selected.metadata },
              };
              history.set((symbols) => [...symbols, clone]);
              setSelectedId(clone.id);
            }}
          />
        </aside>
      </div>
    </main>
  );
}
