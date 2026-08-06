import type { SymbolType } from "../types";

/** Engineering category used by the calculation engine (not UI sidebar category). */
export type DeviceCategory =
  | "socket"
  | "switch"
  | "light"
  | "panel"
  | "detector"
  | "other";

export type SwitchKind =
  | "simple"
  | "double"
  | "triple"
  | "staircase"
  | "cross"
  | "double_staircase"
  | "triple_staircase"
  | "double_cross"
  | "triple_cross";

export type AccessorySpec = {
  /** Stable technical key — never a free-form display name. */
  technicalKey: string;
  description: string;
  unit: "buc" | "m" | "set";
  quantity: number;
};

/**
 * Catalog metadata for one symbol type.
 * The calculation engine reads only these fields — no symbol-specific hardcoding.
 */
export type SymbolCatalogEntry = {
  symbolType: SymbolType;
  category: DeviceCategory;
  /** Cable article technical key, e.g. cable.n2xh.3x2.5 */
  cableType: string;
  /** Logical circuit name, e.g. Prize / Iluminat */
  circuit: string;
  /** Device mounting boxes (doze aparat), not junction boxes. */
  deviceBoxes: number;
  /** Modular width occupied in a frame. */
  modules: number;
  /** Frame type key, e.g. frame.1m — null if no frame. */
  frame: string | null;
  switchKind?: SwitchKind;
  /** Extra conductors beyond the feed (e.g. staircase traveler pairs). */
  extraConductors?: number;
  accessoryItems: AccessorySpec[];
};

export type CableArticle = {
  technicalKey: string;
  label: string;
  unit: "m";
  /** Optional commercial catalog code for later mapping. */
  catalogCodeHint?: string;
};

export type FrameArticle = {
  technicalKey: string;
  label: string;
  modules: number;
};

export type ProjectMaterialCatalog = {
  symbols: Record<SymbolType, SymbolCatalogEntry>;
  cables: Record<string, CableArticle>;
  frames: Record<string, FrameArticle>;
  accessories: Record<string, { technicalKey: string; label: string; unit: AccessorySpec["unit"] }>;
};
