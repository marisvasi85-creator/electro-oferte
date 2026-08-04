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

export type PlanPage = {
  id: string;
  projectId: string;
  name: string;
  backgroundPath: string;
  backgroundUrl: string;
  width: number;
  height: number;
  sortOrder: number;
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
  | "intrerupator_cap_scara"
  | "intrerupator_cruce"
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
