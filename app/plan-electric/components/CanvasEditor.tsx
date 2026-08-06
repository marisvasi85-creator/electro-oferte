"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Rect, Line, Circle } from "react-konva";
import type Konva from "konva";
import type { CableRun, SymbolInstance, SymbolType } from "../../../lib/plan-electric/types";
import { SymbolShape } from "./SymbolShape";
import { snapPoint } from "../hooks/editor-hooks";

type CanvasEditorProps = {
  width: number;
  height: number;
  stageWidth: number;
  stageHeight: number;
  scale: number;
  position: { x: number; y: number };
  backgroundUrl: string;
  symbols: SymbolInstance[];
  selectedId: string | null;
  spacePressed: boolean;
  panMode: boolean;
  snapEnabled: boolean;
  calibrating: boolean;
  calibrationPoints: { x: number; y: number }[];
  cableRuns: CableRun[];
  routeSegments?: Array<{ fromId: string; toId: string }>;
  showCableGuides: boolean;
  guides: { vertical: number[]; horizontal: number[] };
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onZoomAt: (factor: number, pointer: { x: number; y: number }) => void;
  onPanBy: (dx: number, dy: number) => void;
  onDropSymbol: (type: SymbolType, x: number, y: number) => void;
  onCalibrationClick: (x: number, y: number) => void;
  onLedLengthChange: (id: string, lengthPx: number, commit?: boolean) => void;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
};

export function CanvasEditor({
  width,
  height,
  stageWidth,
  stageHeight,
  scale,
  position,
  backgroundUrl,
  symbols,
  selectedId,
  spacePressed,
  panMode,
  snapEnabled,
  calibrating,
  calibrationPoints,
  cableRuns,
  routeSegments = [],
  showCableGuides,
  guides,
  onSelect,
  onMove,
  onZoomAt,
  onPanBy,
  onDropSymbol,
  onCalibrationClick,
  onLedLengthChange,
  stageRef,
}: CanvasEditorProps) {
  const background = useHtmlImage(backgroundUrl);
  const symbolById = new Map(symbols.map((symbol) => [symbol.id, symbol]));
  const panSession = useRef<{
    lastX: number;
    lastY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const forcePan = panMode || spacePressed;
  const canPanView = !calibrating;

  function pointerToPlan(pointer: { x: number; y: number }) {
    return {
      x: (pointer.x - position.x) / scale,
      y: (pointer.y - position.y) / scale,
    };
  }

  function beginPan(clientX: number, clientY: number) {
    panSession.current = {
      lastX: clientX,
      lastY: clientY,
      originX: position.x,
      originY: position.y,
    };
    setIsPanning(true);
  }

  function movePan(clientX: number, clientY: number) {
    const session = panSession.current;
    if (!session) return;
    const dx = clientX - session.lastX;
    const dy = clientY - session.lastY;
    session.lastX = clientX;
    session.lastY = clientY;
    onPanBy(dx, dy);
  }

  function endPan() {
    panSession.current = null;
    setIsPanning(false);
  }

  useEffect(() => {
    if (!isPanning) return;
    const onMoveWindow = (event: PointerEvent) => {
      movePan(event.clientX, event.clientY);
    };
    const onUpWindow = () => endPan();
    window.addEventListener("pointermove", onMoveWindow);
    window.addEventListener("pointerup", onUpWindow);
    window.addEventListener("pointercancel", onUpWindow);
    return () => {
      window.removeEventListener("pointermove", onMoveWindow);
      window.removeEventListener("pointerup", onUpWindow);
      window.removeEventListener("pointercancel", onUpWindow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPanning, onPanBy]);

  return (
    <div
      className={`pe-canvas-shell ${forcePan || isPanning ? "panning" : ""} ${calibrating ? "calibrating" : ""} ${panMode ? "pan-mode" : ""}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (calibrating || forcePan) return;
        const type = event.dataTransfer.getData("application/plan-symbol") as SymbolType;
        if (!type || !stageRef.current) return;
        const stage = stageRef.current;
        stage.setPointersPositions(event.nativeEvent);
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const point = pointerToPlan(pointer);
        const snapped = snapPoint(point.x, point.y, guides, snapEnabled);
        onDropSymbol(type, snapped.x, snapped.y);
      }}
    >
      <Stage
        ref={(node) => {
          stageRef.current = node;
        }}
        width={stageWidth}
        height={stageHeight}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={false}
        onMouseDown={(event) => {
          if (calibrating) {
            const stage = event.target.getStage();
            if (!stage) return;
            const pointer = stage.getPointerPosition();
            if (!pointer) return;
            const point = pointerToPlan(pointer);
            onCalibrationClick(point.x, point.y);
            return;
          }

          const native = event.evt;
          const isMiddle = native.button === 1;
          const isLeft = native.button === 0;
          const clickedEmpty = event.target === event.target.getStage();

          if (canPanView && (isMiddle || (isLeft && (forcePan || clickedEmpty)))) {
            native.preventDefault();
            beginPan(native.clientX, native.clientY);
            if (clickedEmpty && !forcePan) onSelect(null);
            return;
          }

          if (clickedEmpty) onSelect(null);
        }}
        onTouchStart={(event) => {
          if (!canPanView || calibrating) return;
          if (forcePan || event.target === event.target.getStage()) {
            const touch = event.evt.touches[0];
            if (!touch) return;
            beginPan(touch.clientX, touch.clientY);
            if (event.target === event.target.getStage()) onSelect(null);
          }
        }}
        onWheel={(event) => {
          event.evt.preventDefault();
          const stage = event.target.getStage();
          if (!stage) return;
          const pointer = stage.getPointerPosition();
          if (!pointer) return;

          // Shift + scroll = pan orizontal; swipe trackpad = pan fără zoom
          if (event.evt.shiftKey) {
            onPanBy(-event.evt.deltaY, 0);
            return;
          }
          if (Math.abs(event.evt.deltaX) > Math.abs(event.evt.deltaY)) {
            onPanBy(-event.evt.deltaX, -event.evt.deltaY);
            return;
          }

          const direction = event.evt.deltaY > 0 ? 0.9 : 1.1;
          onZoomAt(direction, pointer);
        }}
        onContextMenu={(event) => event.evt.preventDefault()}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="#f8fafc"
            stroke="#94a3b8"
            strokeWidth={1}
            listening={false}
          />
          {background && (
            <KonvaImage image={background} x={0} y={0} width={width} height={height} listening={false} />
          )}
          {showCableGuides && (routeSegments.length
            ? routeSegments.map((segment, index) => {
              const from = symbolById.get(segment.fromId);
              const to = symbolById.get(segment.toId);
              if (!from || !to) return null;
              return (
                <Line
                  key={`cable-seg-${segment.fromId}-${segment.toId}-${index}`}
                  points={[from.x, from.y, to.x, from.y, to.x, to.y]}
                  stroke="#0284c7"
                  strokeWidth={1.5}
                  dash={[8, 6]}
                  opacity={0.55}
                  listening={false}
                />
              );
            })
            : cableRuns.map((run) => {
              const panel = symbolById.get(run.panelId);
              const device = symbolById.get(run.deviceId);
              if (!panel || !device) return null;
              return (
                <Line
                  key={`cable-${run.deviceId}`}
                  points={[panel.x, panel.y, device.x, panel.y, device.x, device.y]}
                  stroke="#0284c7"
                  strokeWidth={1.5}
                  dash={[8, 6]}
                  opacity={0.55}
                  listening={false}
                />
              );
            }))}
          {symbols.map((symbol) => (
            <SymbolShape
              key={symbol.id}
              type={symbol.symbolType}
              x={symbol.x}
              y={symbol.y}
              rotation={symbol.rotation}
              scale={symbol.scale}
              metadata={symbol.metadata}
              selected={symbol.id === selectedId}
              draggable={!forcePan && !calibrating && !isPanning}
              onClick={() => {
                if (forcePan) return;
                onSelect(symbol.id);
              }}
              onDragEnd={(x, y) => {
                const snapped = snapPoint(x, y, guides, snapEnabled);
                onMove(symbol.id, snapped.x, snapped.y);
              }}
              onLedLengthChange={(lengthPx, commit) => onLedLengthChange(symbol.id, lengthPx, commit)}
            />
          ))}
          {calibrationPoints.map((point, index) => (
            <Circle
              key={`cal-${index}`}
              x={point.x}
              y={point.y}
              radius={6}
              fill="#f59e0b"
              stroke="#fff"
              strokeWidth={2}
              listening={false}
            />
          ))}
          {calibrationPoints.length === 2 && (
            <Line
              points={[
                calibrationPoints[0].x,
                calibrationPoints[0].y,
                calibrationPoints[1].x,
                calibrationPoints[1].y,
              ]}
              stroke="#f59e0b"
              strokeWidth={2}
              dash={[6, 4]}
              listening={false}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}

function useHtmlImage(url: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }
    const element = new window.Image();
    element.crossOrigin = "anonymous";
    element.onload = () => setImage(element);
    element.onerror = () => setImage(null);
    element.src = url;
  }, [url]);
  return image;
}
