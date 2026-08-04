"use client";

import { Group, Circle, Line, Rect, Text, Arc, RegularPolygon } from "react-konva";
import type { SymbolType } from "../../../lib/plan-electric/types";
import { getSymbolDefinition } from "../../../lib/plan-electric/symbols";

/** Black-on-white CAD look, similar to Romanian AutoCAD electrical plans. */
const STROKE = "#0f172a";
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
  const sw = Math.max(1, Math.min(w, h) * 0.1);

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
        <Rect
          x={-2}
          y={-2}
          width={w + 4}
          height={h + 4}
          stroke="#38bdf8"
          strokeWidth={1}
          dash={[3, 2]}
        />
      )}
      {renderGlyph(type, w, h, sw)}
    </Group>
  );
}

/**
 * Glyphs sized relative to symbol width/height so library sizes stay compact
 * on architectural plans (Romanian SR EN 60617 practice).
 */
function renderGlyph(type: SymbolType, w: number, h: number, sw: number) {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - sw * 0.4;
  const font = Math.max(4, Math.min(w, h) * 0.32);

  switch (type) {
    case "priza_simpla":
      return <Socket2PT cx={cx} cy={cy} r={r} sw={sw} />;
    case "priza_dubla":
      return (
        <>
          <Socket2PT cx={w * 0.28} cy={cy} r={r * 0.85} sw={sw} />
          <Socket2PT cx={w * 0.72} cy={cy} r={r * 0.85} sw={sw} />
        </>
      );
    case "priza_ip54":
      return (
        <>
          <Rect x={sw * 0.3} y={sw * 0.3} width={w - sw * 0.6} height={h - sw * 0.6} stroke={STROKE} strokeWidth={sw} fill={FILL} />
          <Socket2PT cx={cx} cy={cy * 0.92} r={r * 0.72} sw={sw * 0.9} />
        </>
      );
    case "priza_tv":
      return (
        <>
          <Circle x={cx} y={cy} radius={r} stroke={STROKE} strokeWidth={sw} fill={FILL} />
          <Line points={[cx, cy + r * 0.15, cx, cy - r * 0.55]} stroke={STROKE} strokeWidth={sw * 0.85} />
          <Line
            points={[cx - r * 0.55, cy - r * 0.15, cx, cy - r * 0.65, cx + r * 0.55, cy - r * 0.15]}
            stroke={STROKE}
            strokeWidth={sw * 0.85}
          />
          <Text x={0} y={cy + r * 0.15} width={w} align="center" text="TV" fontSize={font} fontStyle="bold" fill={STROKE} fontFamily="Arial" />
        </>
      );
    case "priza_data":
      return (
        <>
          <Circle x={cx} y={cy} radius={r} stroke={STROKE} strokeWidth={sw} fill={FILL} />
          <Rect
            x={cx - r * 0.55}
            y={cy - r * 0.35}
            width={r * 1.1}
            height={r * 0.7}
            stroke={STROKE}
            strokeWidth={sw * 0.8}
            fill={FILL}
          />
          <Line points={[cx - r * 0.3, cy - r * 0.1, cx - r * 0.3, cy + r * 0.2]} stroke={STROKE} strokeWidth={sw * 0.7} />
          <Line points={[cx, cy - r * 0.1, cx, cy + r * 0.2]} stroke={STROKE} strokeWidth={sw * 0.7} />
          <Line points={[cx + r * 0.3, cy - r * 0.1, cx + r * 0.3, cy + r * 0.2]} stroke={STROKE} strokeWidth={sw * 0.7} />
        </>
      );
    case "priza_ac":
      return (
        <>
          <Circle x={cx} y={cy} radius={r} stroke={STROKE} strokeWidth={sw} fill={FILL} />
          <Line
            points={[
              cx - r * 0.65, cy,
              cx - r * 0.25, cy - r * 0.35,
              cx + r * 0.1, cy + r * 0.35,
              cx + r * 0.45, cy - r * 0.25,
              cx + r * 0.65, cy,
            ]}
            stroke={STROKE}
            strokeWidth={sw * 0.85}
          />
          <Text x={0} y={cy + r * 0.25} width={w} align="center" text="AC" fontSize={font} fontStyle="bold" fill={STROKE} fontFamily="Arial" />
        </>
      );
    case "priza_400v":
      return (
        <>
          <Circle x={cx} y={cy} radius={r} stroke={STROKE} strokeWidth={sw} fill={FILL} />
          <RegularPolygon x={cx} y={cy - r * 0.05} sides={3} radius={r * 0.55} stroke={STROKE} strokeWidth={sw * 0.9} fill={FILL} />
          <Text x={0} y={h - font - 1} width={w} align="center" text="3~" fontSize={font} fontStyle="bold" fill={STROKE} fontFamily="Arial" />
        </>
      );
    case "intrerupator_simplu":
      return <SwitchBank w={w} h={h} sw={sw} gangs={1} variant="normal" />;
    case "intrerupator_dublu":
      return <SwitchBank w={w} h={h} sw={sw} gangs={2} variant="normal" />;
    case "intrerupator_triplu":
      return <SwitchBank w={w} h={h} sw={sw} gangs={3} variant="normal" />;
    case "intrerupator_cap_scara":
      return <SwitchBank w={w} h={h} sw={sw} gangs={1} variant="cs" />;
    case "intrerupator_dublu_cs":
      return <SwitchBank w={w} h={h} sw={sw} gangs={2} variant="cs" />;
    case "intrerupator_triplu_cs":
      return <SwitchBank w={w} h={h} sw={sw} gangs={3} variant="cs" />;
    case "intrerupator_cruce":
      return <SwitchBank w={w} h={h} sw={sw} gangs={1} variant="cruce" />;
    case "intrerupator_dublu_cruce":
      return <SwitchBank w={w} h={h} sw={sw} gangs={2} variant="cruce" />;
    case "intrerupator_triplu_cruce":
      return <SwitchBank w={w} h={h} sw={sw} gangs={3} variant="cruce" />;
    case "corp_iluminat":
      return (
        <>
          <Circle x={cx} y={cy} radius={r} stroke={STROKE} strokeWidth={sw} fill={FILL} />
          <Line points={[cx, cy - r * 0.9, cx, cy + r * 0.9]} stroke={STROKE} strokeWidth={sw * 0.9} />
          <Line points={[cx - r * 0.9, cy, cx + r * 0.9, cy]} stroke={STROKE} strokeWidth={sw * 0.9} />
        </>
      );
    case "spot":
      return (
        <>
          <Circle x={cx} y={cy} radius={r} stroke={STROKE} strokeWidth={sw} fill={FILL} />
          <Circle x={cx} y={cy} radius={r * 0.32} stroke={STROKE} strokeWidth={sw * 0.8} fill={FILL} />
          <Line points={[cx, cy + r * 0.4, cx, cy + r * 0.95]} stroke={STROKE} strokeWidth={sw * 0.8} />
          <Line points={[cx - r * 0.28, cy + r * 0.75, cx + r * 0.28, cy + r * 0.75]} stroke={STROKE} strokeWidth={sw * 0.75} />
        </>
      );
    case "aplica":
      return (
        <>
          <Line points={[sw, h - sw, w - sw, h - sw]} stroke={STROKE} strokeWidth={sw} />
          <Arc
            x={cx}
            y={h - sw}
            innerRadius={0}
            outerRadius={r * 1.05}
            angle={180}
            rotation={180}
            stroke={STROKE}
            strokeWidth={sw}
            fill={FILL}
          />
          <Line points={[cx, h - r * 1.2, cx, h - r * 0.55]} stroke={STROKE} strokeWidth={sw * 0.8} />
          <Line points={[cx - r * 0.35, h - r * 0.9, cx + r * 0.35, h - r * 0.9]} stroke={STROKE} strokeWidth={sw * 0.75} />
        </>
      );
    case "pendul":
      return (
        <>
          <Line points={[cx, 1, cx, h * 0.28]} stroke={STROKE} strokeWidth={sw * 0.9} />
          <Circle x={cx} y={h * 0.62} radius={r * 0.85} stroke={STROKE} strokeWidth={sw} fill={FILL} />
          <Line points={[cx, h * 0.62 - r * 0.75, cx, h * 0.62 + r * 0.75]} stroke={STROKE} strokeWidth={sw * 0.8} />
          <Line points={[cx - r * 0.75, h * 0.62, cx + r * 0.75, h * 0.62]} stroke={STROKE} strokeWidth={sw * 0.8} />
        </>
      );
    case "led":
      return (
        <>
          <Rect x={sw * 0.4} y={sw * 0.4} width={w - sw * 0.8} height={h - sw * 0.8} stroke={STROKE} strokeWidth={sw} fill={FILL} />
          <Text x={0} y={cy - font * 0.35} width={w} align="center" text="LED" fontSize={font} fontStyle="bold" fill={STROKE} fontFamily="Arial" />
        </>
      );
    case "detector_fum":
      return (
        <>
          <Circle x={cx} y={cy} radius={r} stroke={STROKE} strokeWidth={sw} fill={FILL} />
          <Text x={0} y={cy - font * 0.35} width={w} align="center" text="DF" fontSize={font} fontStyle="bold" fill={STROKE} fontFamily="Arial" />
        </>
      );
    case "detector_gaz":
      return (
        <>
          <Circle x={cx} y={cy} radius={r} stroke={STROKE} strokeWidth={sw} fill={FILL} />
          <Text x={0} y={cy - font * 0.35} width={w} align="center" text="DG" fontSize={font} fontStyle="bold" fill={STROKE} fontFamily="Arial" />
        </>
      );
    case "tablou_electric":
      return (
        <>
          <Rect x={sw * 0.3} y={sw * 0.3} width={w - sw * 0.6} height={h - sw * 0.6} stroke={STROKE} strokeWidth={sw * 1.25} fill={FILL} />
          <Rect x={sw * 1.1} y={sw * 1.1} width={w - sw * 2.2} height={h - sw * 2.2} stroke={STROKE} strokeWidth={sw * 0.7} />
          <Line points={[sw * 1.5, h * 0.35, w - sw * 1.5, h * 0.35]} stroke={STROKE} strokeWidth={sw * 0.75} />
          <Line points={[sw * 1.5, h * 0.48, w - sw * 1.5, h * 0.48]} stroke={STROKE} strokeWidth={sw * 0.75} />
          <Line points={[sw * 1.5, h * 0.61, w - sw * 1.5, h * 0.61]} stroke={STROKE} strokeWidth={sw * 0.75} />
          <Text x={0} y={h - font - sw} width={w} align="center" text="TE" fontSize={font} fontStyle="bold" fill={STROKE} fontFamily="Arial" />
        </>
      );
    default:
      return <Rect width={w} height={h} stroke={STROKE} strokeWidth={sw} />;
  }
}

function Socket2PT({ cx, cy, r, sw }: { cx: number; cy: number; r: number; sw: number }) {
  const gap = r * 0.2;
  const bar = r * 0.55;
  return (
    <>
      <Circle x={cx} y={cy} radius={r} stroke={STROKE} strokeWidth={sw} fill={FILL} />
      <Line points={[cx - bar, cy - gap, cx + bar, cy - gap]} stroke={STROKE} strokeWidth={sw * 0.85} />
      <Line points={[cx - bar, cy + gap * 0.1, cx + bar, cy + gap * 0.1]} stroke={STROKE} strokeWidth={sw * 0.85} />
      <Line points={[cx, cy + r * 0.25, cx, cy + r * 0.6]} stroke={STROKE} strokeWidth={sw * 0.75} />
      <Line points={[cx - r * 0.28, cy + r * 0.6, cx + r * 0.28, cy + r * 0.6]} stroke={STROKE} strokeWidth={sw * 0.75} />
      <Line points={[cx - r * 0.18, cy + r * 0.72, cx + r * 0.18, cy + r * 0.72]} stroke={STROKE} strokeWidth={sw * 0.7} />
    </>
  );
}

function SwitchBank({
  w,
  h,
  sw,
  gangs,
  variant,
}: {
  w: number;
  h: number;
  sw: number;
  gangs: 1 | 2 | 3;
  variant: "normal" | "cs" | "cruce";
}) {
  const gap = gangs === 1 ? 0 : Math.max(1, w * 0.04);
  const cell = (w - gap * (gangs - 1)) / gangs;
  const r = Math.min(cell, h) / 2 - sw * 0.35;
  const cy = h / 2;
  const modules = [];
  for (let i = 0; i < gangs; i += 1) {
    const cx = cell * i + cell / 2 + gap * i;
    modules.push(
      <SwitchModule key={`sw-${variant}-${i}`} cx={cx} cy={cy} r={r} sw={sw} variant={variant} />,
    );
  }
  return <>{modules}</>;
}

function SwitchModule({
  cx,
  cy,
  r,
  sw,
  variant,
}: {
  cx: number;
  cy: number;
  r: number;
  sw: number;
  variant: "normal" | "cs" | "cruce";
}) {
  const hub = Math.max(0.7, r * 0.12);
  if (variant === "cs") {
    return (
      <>
        <Circle x={cx} y={cy} radius={r} stroke={STROKE} strokeWidth={sw} fill={FILL} />
        <SwitchLever cx={cx} cy={cy} length={r * 0.85} angleDeg={-50} sw={sw} />
        <SwitchLever cx={cx} cy={cy} length={r * 0.85} angleDeg={130} sw={sw} />
        <Circle x={cx} y={cy} radius={hub} fill={STROKE} />
      </>
    );
  }
  if (variant === "cruce") {
    return (
      <>
        <Circle x={cx} y={cy} radius={r} stroke={STROKE} strokeWidth={sw} fill={FILL} />
        <SwitchLever cx={cx} cy={cy} length={r * 0.85} angleDeg={-45} sw={sw} />
        <SwitchLever cx={cx} cy={cy} length={r * 0.85} angleDeg={45} sw={sw} />
        <SwitchLever cx={cx} cy={cy} length={r * 0.85} angleDeg={135} sw={sw} />
        <SwitchLever cx={cx} cy={cy} length={r * 0.85} angleDeg={-135} sw={sw} />
        <Circle x={cx} y={cy} radius={hub} fill={STROKE} />
      </>
    );
  }
  return (
    <>
      <Circle x={cx} y={cy} radius={r} stroke={STROKE} strokeWidth={sw} fill={FILL} />
      <SwitchLever cx={cx} cy={cy} length={r * 0.85} angleDeg={-55} sw={sw} />
      <Circle x={cx} y={cy} radius={hub} fill={STROKE} />
    </>
  );
}

function SwitchLever({
  cx,
  cy,
  length,
  angleDeg,
  sw,
}: {
  cx: number;
  cy: number;
  length: number;
  angleDeg: number;
  sw: number;
}) {
  const rad = (angleDeg * Math.PI) / 180;
  const x2 = cx + Math.cos(rad) * length;
  const y2 = cy + Math.sin(rad) * length;
  return <Line points={[cx, cy, x2, y2]} stroke={STROKE} strokeWidth={sw} lineCap="round" />;
}
