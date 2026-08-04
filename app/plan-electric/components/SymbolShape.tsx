"use client";

import { Group, Circle, Line, Rect, Text, Arc, RegularPolygon } from "react-konva";
import type { SymbolType } from "../../../lib/plan-electric/types";
import { getSymbolDefinition } from "../../../lib/plan-electric/symbols";

/** Black-on-white CAD look, similar to Romanian AutoCAD electrical plans. */
const STROKE = "#0f172a";
const FILL = "#ffffff";
const SW = 1.7;

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

/**
 * Glyphs aligned with Romanian installation plan practice (SR EN 60617 style):
 * sockets = circle + parallel contacts + PE; switches = circle + lever(s);
 * luminaires = circle + cross; panel = double rectangle.
 */
function renderGlyph(type: SymbolType, w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;

  switch (type) {
    case "priza_simpla":
      return <Socket2PT cx={cx} cy={cy} r={11} />;
    case "priza_dubla":
      return (
        <>
          <Socket2PT cx={cx - 9} cy={cy} r={9} />
          <Socket2PT cx={cx + 9} cy={cy} r={9} />
        </>
      );
    case "priza_ip54":
      return (
        <>
          <Rect x={1.5} y={1.5} width={w - 3} height={h - 3} stroke={STROKE} strokeWidth={SW} fill={FILL} />
          <Socket2PT cx={cx} cy={cy - 1} r={8} />
          <Text x={0} y={h - 9} width={w} align="center" text="IP54" fontSize={6} fill={STROKE} fontFamily="Arial" />
        </>
      );
    case "priza_tv":
      return (
        <>
          <Circle x={cx} y={cy} radius={11} stroke={STROKE} strokeWidth={SW} fill={FILL} />
          <Line points={[cx, cy + 2, cx, cy - 6]} stroke={STROKE} strokeWidth={1.4} />
          <Line points={[cx - 6, cy - 2, cx, cy - 7, cx + 6, cy - 2]} stroke={STROKE} strokeWidth={1.4} />
          <Text x={0} y={cy + 3} width={w} align="center" text="TV" fontSize={7} fontStyle="bold" fill={STROKE} fontFamily="Arial" />
        </>
      );
    case "priza_data":
      return (
        <>
          <Circle x={cx} y={cy} radius={11} stroke={STROKE} strokeWidth={SW} fill={FILL} />
          <Rect x={cx - 6} y={cy - 4} width={12} height={8} stroke={STROKE} strokeWidth={1.3} fill={FILL} />
          <Line points={[cx - 4, cy - 1, cx - 4, cy + 2]} stroke={STROKE} strokeWidth={1.1} />
          <Line points={[cx, cy - 1, cx, cy + 2]} stroke={STROKE} strokeWidth={1.1} />
          <Line points={[cx + 4, cy - 1, cx + 4, cy + 2]} stroke={STROKE} strokeWidth={1.1} />
          <Text x={0} y={h - 8} width={w} align="center" text="RJ" fontSize={6} fill={STROKE} fontFamily="Arial" />
        </>
      );
    case "priza_ac":
      return (
        <>
          <Circle x={cx} y={cy} radius={11} stroke={STROKE} strokeWidth={SW} fill={FILL} />
          <Line
            points={[cx - 7, cy, cx - 3, cy - 4, cx + 1, cy + 4, cx + 5, cy - 3, cx + 7, cy]}
            stroke={STROKE}
            strokeWidth={1.4}
          />
          <Text x={0} y={cy + 4} width={w} align="center" text="AC" fontSize={7} fontStyle="bold" fill={STROKE} fontFamily="Arial" />
        </>
      );
    case "priza_400v":
      return (
        <>
          <Circle x={cx} y={cy} radius={12} stroke={STROKE} strokeWidth={SW} fill={FILL} />
          <RegularPolygon x={cx} y={cy - 1} sides={3} radius={7} stroke={STROKE} strokeWidth={1.5} fill={FILL} />
          <Text x={0} y={h - 9} width={w} align="center" text="400V" fontSize={6} fontStyle="bold" fill={STROKE} fontFamily="Arial" />
        </>
      );
    case "intrerupator_simplu":
      return (
        <>
          <Circle x={cx} y={cy} radius={11} stroke={STROKE} strokeWidth={SW} fill={FILL} />
          <SwitchLever cx={cx} cy={cy} length={9} angleDeg={-55} />
          <Circle x={cx} y={cy} radius={1.6} fill={STROKE} />
        </>
      );
    case "intrerupator_dublu":
      return (
        <>
          <Circle x={cx} y={cy} radius={11} stroke={STROKE} strokeWidth={SW} fill={FILL} />
          <SwitchLever cx={cx - 2.5} cy={cy} length={9} angleDeg={-55} />
          <SwitchLever cx={cx + 2.5} cy={cy} length={9} angleDeg={-55} />
          <Circle x={cx - 2.5} y={cy} radius={1.3} fill={STROKE} />
          <Circle x={cx + 2.5} y={cy} radius={1.3} fill={STROKE} />
        </>
      );
    case "intrerupator_cap_scara":
      return (
        <>
          <Circle x={cx} y={cy} radius={11} stroke={STROKE} strokeWidth={SW} fill={FILL} />
          <SwitchLever cx={cx} cy={cy} length={9} angleDeg={-50} />
          <SwitchLever cx={cx} cy={cy} length={9} angleDeg={130} />
          <Circle x={cx} y={cy} radius={1.6} fill={STROKE} />
        </>
      );
    case "intrerupator_cruce":
      return (
        <>
          <Circle x={cx} y={cy} radius={11} stroke={STROKE} strokeWidth={SW} fill={FILL} />
          <SwitchLever cx={cx} cy={cy} length={9} angleDeg={-45} />
          <SwitchLever cx={cx} cy={cy} length={9} angleDeg={45} />
          <SwitchLever cx={cx} cy={cy} length={9} angleDeg={135} />
          <SwitchLever cx={cx} cy={cy} length={9} angleDeg={-135} />
          <Circle x={cx} y={cy} radius={1.6} fill={STROKE} />
        </>
      );
    case "corp_iluminat":
      return (
        <>
          <Circle x={cx} y={cy} radius={11} stroke={STROKE} strokeWidth={SW} fill={FILL} />
          <Line points={[cx, cy - 10, cx, cy + 10]} stroke={STROKE} strokeWidth={1.5} />
          <Line points={[cx - 10, cy, cx + 10, cy]} stroke={STROKE} strokeWidth={1.5} />
        </>
      );
    case "spot":
      return (
        <>
          <Circle x={cx} y={cy} radius={10} stroke={STROKE} strokeWidth={SW} fill={FILL} />
          <Circle x={cx} y={cy} radius={3.2} stroke={STROKE} strokeWidth={1.3} fill={FILL} />
          <Line points={[cx, cy + 4, cx, cy + 10]} stroke={STROKE} strokeWidth={1.3} />
          <Line points={[cx - 3, cy + 8, cx + 3, cy + 8]} stroke={STROKE} strokeWidth={1.2} />
        </>
      );
    case "aplica":
      return (
        <>
          <Line points={[2, h - 4, w - 2, h - 4]} stroke={STROKE} strokeWidth={1.8} />
          <Arc
            x={cx}
            y={h - 4}
            innerRadius={0}
            outerRadius={12}
            angle={180}
            rotation={180}
            stroke={STROKE}
            strokeWidth={SW}
            fill={FILL}
          />
          <Line points={[cx, h - 14, cx, h - 8]} stroke={STROKE} strokeWidth={1.3} />
          <Line points={[cx - 4, h - 11, cx + 4, h - 11]} stroke={STROKE} strokeWidth={1.2} />
        </>
      );
    case "pendul":
      return (
        <>
          <Line points={[cx, 1, cx, 10]} stroke={STROKE} strokeWidth={1.5} />
          <Circle x={cx} y={21} radius={9} stroke={STROKE} strokeWidth={SW} fill={FILL} />
          <Line points={[cx, 13, cx, 29]} stroke={STROKE} strokeWidth={1.3} />
          <Line points={[cx - 8, 21, cx + 8, 21]} stroke={STROKE} strokeWidth={1.3} />
        </>
      );
    case "led":
      return (
        <>
          <Rect x={2} y={3} width={w - 4} height={h - 6} stroke={STROKE} strokeWidth={SW} fill={FILL} />
          <Line points={[8, cy, 12, cy - 3, 16, cy + 3, 20, cy - 3, 24, cy + 2, 28, cy]} stroke={STROKE} strokeWidth={1.3} />
          <Text x={0} y={cy - 2} width={w} align="center" text="LED" fontSize={7} fontStyle="bold" fill={STROKE} fontFamily="Arial" />
        </>
      );
    case "detector_fum":
      return (
        <>
          <Circle x={cx} y={cy} radius={11} stroke={STROKE} strokeWidth={SW} fill={FILL} />
          <Arc x={cx} y={cy + 2} innerRadius={4} outerRadius={4} angle={180} rotation={180} stroke={STROKE} strokeWidth={1.4} />
          <Arc x={cx} y={cy + 5} innerRadius={6} outerRadius={6} angle={180} rotation={180} stroke={STROKE} strokeWidth={1.2} />
          <Text x={0} y={cy + 2} width={w} align="center" text="DF" fontSize={7} fontStyle="bold" fill={STROKE} fontFamily="Arial" />
        </>
      );
    case "detector_gaz":
      return (
        <>
          <Circle x={cx} y={cy} radius={11} stroke={STROKE} strokeWidth={SW} fill={FILL} />
          <Circle x={cx} y={cy - 2} radius={3} stroke={STROKE} strokeWidth={1.3} fill={FILL} />
          <Line points={[cx, cy + 1, cx, cy + 6]} stroke={STROKE} strokeWidth={1.3} />
          <Text x={0} y={cy + 4} width={w} align="center" text="DG" fontSize={7} fontStyle="bold" fill={STROKE} fontFamily="Arial" />
        </>
      );
    case "tablou_electric":
      return (
        <>
          <Rect x={2} y={2} width={w - 4} height={h - 4} stroke={STROKE} strokeWidth={2.2} fill={FILL} />
          <Rect x={5} y={5} width={w - 10} height={h - 10} stroke={STROKE} strokeWidth={1.2} />
          <Line points={[7, 14, w - 7, 14]} stroke={STROKE} strokeWidth={1.3} />
          <Line points={[7, 18, w - 7, 18]} stroke={STROKE} strokeWidth={1.3} />
          <Line points={[7, 22, w - 7, 22]} stroke={STROKE} strokeWidth={1.3} />
          <Text x={0} y={h - 14} width={w} align="center" text="TE" fontSize={9} fontStyle="bold" fill={STROKE} fontFamily="Arial" />
        </>
      );
    default:
      return <Rect width={w} height={h} stroke={STROKE} />;
  }
}

/** Romanian / European socket outlet 2P+T on architectural plans. */
function Socket2PT({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const gap = r * 0.22;
  const bar = r * 0.55;
  return (
    <>
      <Circle x={cx} y={cy} radius={r} stroke={STROKE} strokeWidth={SW} fill={FILL} />
      <Line points={[cx - bar, cy - gap, cx + bar, cy - gap]} stroke={STROKE} strokeWidth={1.5} />
      <Line points={[cx - bar, cy + gap * 0.15, cx + bar, cy + gap * 0.15]} stroke={STROKE} strokeWidth={1.5} />
      {/* PE / earth mark */}
      <Line points={[cx, cy + r * 0.25, cx, cy + r * 0.62]} stroke={STROKE} strokeWidth={1.3} />
      <Line points={[cx - r * 0.28, cy + r * 0.62, cx + r * 0.28, cy + r * 0.62]} stroke={STROKE} strokeWidth={1.3} />
      <Line points={[cx - r * 0.18, cy + r * 0.75, cx + r * 0.18, cy + r * 0.75]} stroke={STROKE} strokeWidth={1.2} />
    </>
  );
}

function SwitchLever({
  cx,
  cy,
  length,
  angleDeg,
}: {
  cx: number;
  cy: number;
  length: number;
  angleDeg: number;
}) {
  const rad = (angleDeg * Math.PI) / 180;
  const x2 = cx + Math.cos(rad) * length;
  const y2 = cy + Math.sin(rad) * length;
  return <Line points={[cx, cy, x2, y2]} stroke={STROKE} strokeWidth={1.7} lineCap="round" />;
}
