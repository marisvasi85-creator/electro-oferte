"use client";

import { Group, Circle, Line, Rect, Text, Arc } from "react-konva";
import type { SymbolType } from "../../../lib/plan-electric/types";
import { getSymbolDefinition } from "../../../lib/plan-electric/symbols";

const STROKE = "#111827";
const FILL = "#ffffff";

type SymbolShapeProps = {
  type: SymbolType;
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
  selected?: boolean;
  draggable?: boolean;
  onClick?: () => void;
  onDragEnd?: (x: number, y: number) => void;
  onTransformEnd?: (rotation: number, scale: number) => void;
};

export function SymbolShape({
  type,
  x,
  y,
  rotation = 0,
  scale = 1,
  selected = false,
  draggable = false,
  onClick,
  onDragEnd,
}: SymbolShapeProps) {
  const def = getSymbolDefinition(type);
  const w = def.width;
  const h = def.height;

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation}
      scaleX={scale}
      scaleY={scale}
      draggable={draggable}
      onClick={onClick}
      onTap={onClick}
      onDragEnd={(event) => onDragEnd?.(event.target.x(), event.target.y())}
      offsetX={w / 2}
      offsetY={h / 2}
    >
      {selected && (
        <Rect x={-3} y={-3} width={w + 6} height={h + 6} stroke="#38bdf8" strokeWidth={1.5} dash={[4, 3]} />
      )}
      {renderGlyph(type, w, h)}
    </Group>
  );
}

function renderGlyph(type: SymbolType, w: number, h: number) {
  switch (type) {
    case "priza_simpla":
      return (
        <>
          <Circle x={w / 2} y={h / 2} radius={10} stroke={STROKE} strokeWidth={1.8} fill={FILL} />
          <Circle x={w / 2 - 3.5} y={h / 2} radius={1.4} fill={STROKE} />
          <Circle x={w / 2 + 3.5} y={h / 2} radius={1.4} fill={STROKE} />
        </>
      );
    case "priza_dubla":
      return (
        <>
          <Circle x={w / 2 - 7} y={h / 2} radius={8} stroke={STROKE} strokeWidth={1.6} fill={FILL} />
          <Circle x={w / 2 + 7} y={h / 2} radius={8} stroke={STROKE} strokeWidth={1.6} fill={FILL} />
          <Circle x={w / 2 - 7} y={h / 2} radius={5} stroke={STROKE} strokeWidth={1.2} />
          <Circle x={w / 2 + 7} y={h / 2} radius={5} stroke={STROKE} strokeWidth={1.2} />
        </>
      );
    case "priza_ip54":
      return (
        <>
          <Rect x={2} y={2} width={w - 4} height={h - 4} stroke={STROKE} strokeWidth={1.8} fill={FILL} />
          <Circle x={w / 2} y={h / 2} radius={7} stroke={STROKE} strokeWidth={1.5} />
          <Text x={0} y={h - 1} width={w} align="center" text="IP54" fontSize={6} fill={STROKE} />
        </>
      );
    case "priza_tv":
      return labeledCircle(w, h, "TV");
    case "priza_data":
      return labeledRect(w, h, "DATA");
    case "priza_ac":
      return labeledCircle(w, h, "AC");
    case "priza_400v":
      return labeledRect(w, h, "400V");
    case "intrerupator_simplu":
      return (
        <>
          <Circle x={w / 2} y={h / 2} radius={9} stroke={STROKE} strokeWidth={1.7} fill={FILL} />
          <Text x={0} y={h / 2 - 3.5} width={w} align="center" text="S1" fontSize={8} fontStyle="bold" fill={STROKE} />
        </>
      );
    case "intrerupator_dublu":
      return (
        <>
          <Rect x={2} y={4} width={w - 4} height={h - 8} cornerRadius={3} stroke={STROKE} strokeWidth={1.7} fill={FILL} />
          <Text x={0} y={h / 2 - 3.5} width={w} align="center" text="S2" fontSize={8} fontStyle="bold" fill={STROKE} />
        </>
      );
    case "intrerupator_cap_scara":
      return (
        <>
          <Circle x={w / 2} y={h / 2} radius={9} stroke={STROKE} strokeWidth={1.7} fill={FILL} />
          <Text x={0} y={h / 2 - 3.5} width={w} align="center" text="CS" fontSize={8} fontStyle="bold" fill={STROKE} />
        </>
      );
    case "intrerupator_cruce":
      return (
        <>
          <Circle x={w / 2} y={h / 2} radius={10} stroke={STROKE} strokeWidth={1.7} fill={FILL} />
          <Line points={[6, 6, w - 6, h - 6]} stroke={STROKE} strokeWidth={1.6} />
          <Line points={[w - 6, 6, 6, h - 6]} stroke={STROKE} strokeWidth={1.6} />
        </>
      );
    case "corp_iluminat":
      return (
        <>
          <Circle x={w / 2} y={h / 2} radius={10} stroke={STROKE} strokeWidth={1.7} fill={FILL} />
          <Line points={[w / 2, 3, w / 2, h - 3]} stroke={STROKE} strokeWidth={1.3} />
          <Line points={[3, h / 2, w - 3, h / 2]} stroke={STROKE} strokeWidth={1.3} />
        </>
      );
    case "spot":
      return (
        <>
          <Circle x={w / 2} y={h / 2} radius={8} stroke={STROKE} strokeWidth={1.7} fill={FILL} />
          <Circle x={w / 2} y={h / 2} radius={3} fill={STROKE} />
        </>
      );
    case "aplica":
      return (
        <>
          <Arc x={w / 2} y={h - 4} innerRadius={0} outerRadius={12} angle={180} rotation={180} stroke={STROKE} strokeWidth={1.6} fill={FILL} />
          <Line points={[4, h - 4, w - 4, h - 4]} stroke={STROKE} strokeWidth={1.6} />
        </>
      );
    case "pendul":
      return (
        <>
          <Line points={[w / 2, 2, w / 2, 12]} stroke={STROKE} strokeWidth={1.5} />
          <Circle x={w / 2} y={20} radius={8} stroke={STROKE} strokeWidth={1.6} fill={FILL} />
        </>
      );
    case "led":
      return (
        <>
          <Rect x={2} y={4} width={w - 4} height={h - 8} stroke={STROKE} strokeWidth={1.5} fill={FILL} />
          <Text x={0} y={h / 2 - 3} width={w} align="center" text="LED" fontSize={8} fontStyle="bold" fill={STROKE} />
        </>
      );
    case "detector_fum":
      return labeledCircle(w, h, "DF");
    case "detector_gaz":
      return labeledCircle(w, h, "DG");
    case "tablou_electric":
      return (
        <>
          <Rect x={2} y={2} width={w - 4} height={h - 4} stroke={STROKE} strokeWidth={2} fill={FILL} />
          <Line points={[2, 12, w - 2, 12]} stroke={STROKE} strokeWidth={1.4} />
          <Text x={0} y={h / 2} width={w} align="center" text="TE" fontSize={9} fontStyle="bold" fill={STROKE} />
        </>
      );
    default:
      return <Rect width={w} height={h} stroke={STROKE} />;
  }
}

function labeledCircle(w: number, h: number, label: string) {
  return (
    <>
      <Circle x={w / 2} y={h / 2} radius={Math.min(w, h) / 2 - 2} stroke={STROKE} strokeWidth={1.7} fill={FILL} />
      <Text x={0} y={h / 2 - 3.5} width={w} align="center" text={label} fontSize={label.length > 3 ? 7 : 8} fontStyle="bold" fill={STROKE} />
    </>
  );
}

function labeledRect(w: number, h: number, label: string) {
  return (
    <>
      <Rect x={2} y={3} width={w - 4} height={h - 6} stroke={STROKE} strokeWidth={1.7} fill={FILL} />
      <Text x={0} y={h / 2 - 3.5} width={w} align="center" text={label} fontSize={label.length > 3 ? 7 : 8} fontStyle="bold" fill={STROKE} />
    </>
  );
}
