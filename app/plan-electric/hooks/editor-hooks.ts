"use client";

import { useCallback, useMemo, useState } from "react";

export function useZoom(initial = 0.45) {
  const [scale, setScale] = useState(initial);

  const zoomBy = useCallback((factor: number, min = 0.1, max = 4) => {
    setScale((current) => Math.min(max, Math.max(min, Number((current * factor).toFixed(4)))));
  }, []);

  const zoomTo = useCallback((value: number, min = 0.1, max = 4) => {
    setScale(Math.min(max, Math.max(min, value)));
  }, []);

  return useMemo(() => ({ scale, setScale: zoomTo, zoomBy, zoomTo }), [scale, zoomBy, zoomTo]);
}

export function usePan() {
  const [position, setPosition] = useState({ x: 40, y: 40 });
  const [spacePressed, setSpacePressed] = useState(false);

  const panBy = useCallback((dx: number, dy: number) => {
    setPosition((current) => ({ x: current.x + dx, y: current.y + dy }));
  }, []);

  return { position, setPosition, panBy, spacePressed, setSpacePressed };
}

export function useHistory<T>(initial: T) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initial);
  const [future, setFuture] = useState<T[]>([]);

  const set = useCallback((value: T | ((current: T) => T), record = true) => {
    setPresent((current) => {
      const next = typeof value === "function" ? (value as (current: T) => T)(current) : value;
      if (record) {
        setPast((items) => [...items.slice(-79), current]);
        setFuture([]);
      }
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((items) => {
      if (!items.length) return items;
      const previous = items[items.length - 1];
      setFuture((nextItems) => [present, ...nextItems]);
      setPresent(previous);
      return items.slice(0, -1);
    });
  }, [present]);

  const redo = useCallback(() => {
    setFuture((items) => {
      if (!items.length) return items;
      const [next, ...rest] = items;
      setPast((pastItems) => [...pastItems, present]);
      setPresent(next);
      return rest;
    });
  }, [present]);

  const reset = useCallback((value: T) => {
    setPast([]);
    setFuture([]);
    setPresent(value);
  }, []);

  return {
    present,
    set,
    undo,
    redo,
    reset,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}

/** Simple wall/edge snap using luminance edges from background canvas. */
export function buildEdgeGuides(
  image: HTMLImageElement,
  sample = 4,
): { vertical: number[]; horizontal: number[] } {
  const canvas = document.createElement("canvas");
  const width = Math.min(image.naturalWidth, 1800);
  const height = Math.min(image.naturalHeight, 1800);
  const scaleX = image.naturalWidth / width;
  const scaleY = image.naturalHeight / height;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { vertical: [], horizontal: [] };
  ctx.drawImage(image, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;
  const verticalHits = new Map<number, number>();
  const horizontalHits = new Map<number, number>();

  for (let y = 1; y < height - 1; y += sample) {
    for (let x = 1; x < width - 1; x += sample) {
      const i = (y * width + x) * 4;
      const lum = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
      const right = data[i + 4] * 0.3 + data[i + 5] * 0.59 + data[i + 6] * 0.11;
      const down = data[((y + 1) * width + x) * 4] * 0.3
        + data[((y + 1) * width + x) * 4 + 1] * 0.59
        + data[((y + 1) * width + x) * 4 + 2] * 0.11;
      if (Math.abs(lum - right) > 38) {
        const key = Math.round(x * scaleX);
        verticalHits.set(key, (verticalHits.get(key) ?? 0) + 1);
      }
      if (Math.abs(lum - down) > 38) {
        const key = Math.round(y * scaleY);
        horizontalHits.set(key, (horizontalHits.get(key) ?? 0) + 1);
      }
    }
  }

  const pick = (map: Map<number, number>) =>
    [...map.entries()]
      .filter(([, count]) => count > 18)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 80)
      .map(([value]) => value);

  return { vertical: pick(verticalHits), horizontal: pick(horizontalHits) };
}

export function snapPoint(
  x: number,
  y: number,
  guides: { vertical: number[]; horizontal: number[] },
  enabled: boolean,
  threshold = 12,
  offset = 14,
) {
  if (!enabled) return { x, y };
  let nextX = x;
  let nextY = y;
  let bestVX = threshold + 1;
  let bestHY = threshold + 1;
  for (const guide of guides.vertical) {
    const dist = Math.abs(x - guide);
    if (dist < bestVX) {
      bestVX = dist;
      nextX = x >= guide ? guide + offset : guide - offset;
    }
  }
  for (const guide of guides.horizontal) {
    const dist = Math.abs(y - guide);
    if (dist < bestHY) {
      bestHY = dist;
      nextY = y >= guide ? guide + offset : guide - offset;
    }
  }
  return { x: nextX, y: nextY };
}
