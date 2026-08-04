export type PlanProject = {
  id: string;
  ownerId: string;
  companyId: string;
  name: string;
  client: string;
  address: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CableSettings = {
  /** Real meters represented by one plan pixel. Null until calibrated. */
  metersPerPixel: number | null;
  calibrationPixelDistance: number | null;
  calibrationRealDistanceM: number | null;
  /** Default outlet mounting height (m). Typical 0.35–0.40. */
  outletHeightM: number;
  /** Default switch mounting height (m). Typical 1.10. */
  switchHeightM: number;
  /** Electrical panel mounting height (m). */
  panelHeightM: number;
  /** Ceiling / light mounting height (m). */
  lightHeightM: number;
  /** Smoke/gas detector height (m). */
  detectorHeightM: number;
  /** Extra cable reserve percentage. */
  reservePercent: number;
  /** Floor routing model. */
  routing: "floor_orthogonal" | "floor_euclidean";
};

export type PlanPage = {
  id: string;
  projectId: string;
  name: string;
  backgroundPath: string;
  backgroundUrl: string;
  width: number;
  height: number;
  sortOrder: number;
  settings: CableSettings;
};

export type CableRun = {
  deviceId: string;
  panelId: string;
  label: string;
  category: SymbolCategory;
  floorM: number;
  dropM: number;
  riseM: number;
  totalM: number;
};

export type CableEstimate = {
  runs: CableRun[];
  byCategory: Record<SymbolCategory, number>;
  rawTotalM: number;
  withReserveM: number;
  deviceCount: number;
  panelCount: number;
  calibrated: boolean;
  missingPanel: boolean;
};

export type SymbolCategory = "prize" | "intrerupatoare" | "iluminat" | "diverse";

export type SymbolType =
  | "priza_simpla"
  | "priza_dubla"
  | "priza_ip54"
  | "priza_tv"
  | "priza_data"
  | "priza_ac"
  | "priza_400v"
  | "intrerupator_simplu"
  | "intrerupator_dublu"
  | "intrerupator_triplu"
  | "intrerupator_cap_scara"
  | "intrerupator_dublu_cs"
  | "intrerupator_triplu_cs"
  | "intrerupator_cruce"
  | "intrerupator_dublu_cruce"
  | "intrerupator_triplu_cruce"
  | "corp_iluminat"
  | "spot"
  | "aplica"
  | "pendul"
  | "led"
  | "detector_fum"
  | "detector_gaz"
  | "tablou_electric";

export type SymbolDefinition = {
  type: SymbolType;
  category: SymbolCategory;
  label: string;
  legend: string;
  width: number;
  height: number;
};

export type SymbolInstance = {
  id: string;
  pageId: string;
  symbolType: SymbolType;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  label: string;
  notes: string;
  metadata: Record<string, unknown>;
};

export type EditorSnapshot = {
  symbols: SymbolInstance[];
  selectedId: string | null;
};
