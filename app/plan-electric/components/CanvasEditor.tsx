"use client";

import { useEffect, useState } from "react";
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
  snapEnabled: boolean;
  calibrating: boolean;
  calibrationPoints: { x: number; y: number }[];
  cableRuns: CableRun[];
  showCableGuides: boolean;
  guides: { vertical: number[]; horizontal: number[] };
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onStagePan: (x: number, y: number) => void;
  onZoomAt: (factor: number, pointer: { x: number; y: number }) => void;
  onDropSymbol: (type: SymbolType, x: number, y: number) => void;
  onCalibrationClick: (x: number, y: number) => void;
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
  snapEnabled,
  calibrating,
  calibrationPoints,
  cableRuns,
  showCableGuides,
  guides,
  onSelect,
  onMove,
  onStagePan,
  onZoomAt,
  onDropSymbol,
  onCalibrationClick,
  stageRef,
}: CanvasEditorProps) {
  const background = useHtmlImage(backgroundUrl);
  const symbolById = new Map(symbols.map((symbol) => [symbol.id, symbol]));

  return (
    <div
      className={`pe-canvas-shell ${spacePressed ? "panning" : ""} ${calibrating ? "calibrating" : ""}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (calibrating) return;
        const type = event.dataTransfer.getData("application/plan-symbol") as SymbolType;
        if (!type || !stageRef.current) return;
        const stage = stageRef.current;
        stage.setPointersPositions(event.nativeEvent);
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const x = (pointer.x - position.x) / scale;
        const y = (pointer.y - position.y) / scale;
        const snapped = snapPoint(x, y, guides, snapEnabled);
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
        draggable={spacePressed && !calibrating}
        onDragEnd={(event) => {
          if (!spacePressed || calibrating) return;
          onStagePan(event.target.x(), event.target.y());
        }}
        onMouseDown={(event) => {
          if (calibrating) {
            const stage = event.target.getStage();
            if (!stage) return;
            const pointer = stage.getPointerPosition();
            if (!pointer) return;
            const x = (pointer.x - position.x) / scale;
            const y = (pointer.y - position.y) / scale;
            onCalibrationClick(x, y);
            return;
          }
          if (event.target === event.target.getStage()) onSelect(null);
        }}
        onWheel={(event) => {
          event.evt.preventDefault();
          const stage = event.target.getStage();
          if (!stage) return;
          const pointer = stage.getPointerPosition();
          if (!pointer) return;
          const direction = event.evt.deltaY > 0 ? 0.9 : 1.1;
          onZoomAt(direction, pointer);
        }}
      >
        <Layer>
          <Rect x={0} y={0} width={width} height={height} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1} />
          {background && (
            <KonvaImage image={background} x={0} y={0} width={width} height={height} listening={false} />
          )}
          {showCableGuides && cableRuns.map((run) => {
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
          })}
          {symbols.map((symbol) => (
            <SymbolShape
              key={symbol.id}
              type={symbol.symbolType}
              x={symbol.x}
              y={symbol.y}
              rotation={symbol.rotation}
              scale={symbol.scale}
              selected={symbol.id === selectedId}
              draggable={!spacePressed && !calibrating}
              onClick={() => onSelect(symbol.id)}
              onDragEnd={(x, y) => {
                const snapped = snapPoint(x, y, guides, snapEnabled);
                onMove(symbol.id, snapped.x, snapped.y);
              }}
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
