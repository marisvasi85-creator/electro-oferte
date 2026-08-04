import { supabase } from "../supabase";
import { mergeCableSettings } from "./cable";
import type { CableSettings, PlanPage, PlanProject, SymbolInstance, SymbolType } from "./types";

function mapProject(row: Record<string, unknown>): PlanProject {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id ?? ""),
    companyId: String(row.company_id ?? ""),
    name: String(row.name ?? ""),
    client: String(row.client ?? ""),
    address: String(row.address ?? ""),
    notes: String(row.notes ?? ""),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

function mapPage(row: Record<string, unknown>): PlanPage {
  const backgroundPath = String(row.background_path ?? "");
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    name: String(row.name ?? "Plan 1"),
    backgroundPath,
    backgroundUrl: backgroundPath
      ? supabase.storage.from("plan-backgrounds").getPublicUrl(backgroundPath).data.publicUrl
      : "",
    width: Number(row.width ?? 2480),
    height: Number(row.height ?? 3508),
    sortOrder: Number(row.sort_order ?? 0),
    settings: mergeCableSettings((row.settings as Partial<CableSettings> | null) ?? null),
  };
}

function mapSymbol(row: Record<string, unknown>): SymbolInstance {
  return {
    id: String(row.id),
    pageId: String(row.page_id),
    symbolType: String(row.symbol_type) as SymbolType,
    x: Number(row.x ?? 0),
    y: Number(row.y ?? 0),
    rotation: Number(row.rotation ?? 0),
    scale: Number(row.scale ?? 1),
    label: String(row.label ?? ""),
    notes: String(row.notes ?? ""),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}

export async function listPlanProjects(companyId: string, ownerId: string) {
  let query = supabase
    .from("plan_projects")
    .select("*")
    .order("updated_at", { ascending: false });
  if (companyId) query = query.eq("company_id", companyId);
  else query = query.eq("owner_id", ownerId);
  const result = await query;
  if (result.error) {
    // Local/offline fallback when migration is not applied yet.
    if (result.error.message.includes("plan_projects") || result.error.code === "42P01") {
      return readLocalProjects(companyId || ownerId);
    }
    throw new Error(result.error.message);
  }
  return (result.data ?? []).map((row) => mapProject(row));
}

export async function createPlanProject(input: {
  ownerId: string;
  companyId: string;
  name: string;
  client: string;
  address: string;
  notes: string;
}) {
  const inserted = await supabase.from("plan_projects").insert({
    owner_id: input.ownerId,
    company_id: input.companyId || null,
    name: input.name,
    client: input.client,
    address: input.address,
    notes: input.notes,
  }).select("*").single();

  if (inserted.error) {
    if (inserted.error.message.includes("plan_projects") || inserted.error.code === "42P01") {
      const local = createLocalProject(input);
      return local;
    }
    throw new Error(inserted.error.message);
  }

  const project = mapProject(inserted.data);
  const page = await supabase.from("plan_pages").insert({
    project_id: project.id,
    name: "Plan 1",
    width: 2480,
    height: 3508,
  }).select("*").single();
  if (page.error) throw new Error(page.error.message);
  return { project, page: mapPage(page.data) };
}

export async function getPlanProjectBundle(projectId: string) {
  const projectResult = await supabase.from("plan_projects").select("*").eq("id", projectId).maybeSingle();
  if (projectResult.error) {
    if (projectResult.error.message.includes("plan_projects") || projectResult.error.code === "42P01") {
      return readLocalBundle(projectId);
    }
    throw new Error(projectResult.error.message);
  }
  if (!projectResult.data) throw new Error("Proiectul nu a fost găsit.");

  const pagesResult = await supabase
    .from("plan_pages")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order");
  if (pagesResult.error) throw new Error(pagesResult.error.message);
  const pages = (pagesResult.data ?? []).map((row) => mapPage(row));
  const pageId = pages[0]?.id;
  let symbols: SymbolInstance[] = [];
  if (pageId) {
    const symbolsResult = await supabase
      .from("plan_symbol_instances")
      .select("*")
      .eq("page_id", pageId)
      .order("created_at");
    if (symbolsResult.error) throw new Error(symbolsResult.error.message);
    symbols = (symbolsResult.data ?? []).map((row) => mapSymbol(row));
  }
  return { project: mapProject(projectResult.data), pages, symbols };
}

export async function updatePlanPageBackground(input: {
  pageId: string;
  backgroundPath: string;
  width: number;
  height: number;
}) {
  const result = await supabase.from("plan_pages").update({
    background_path: input.backgroundPath,
    width: input.width,
    height: input.height,
    updated_at: new Date().toISOString(),
  }).eq("id", input.pageId).select("*").single();
  if (result.error) {
    if (result.error.message.includes("plan_pages") || result.error.code === "42P01") {
      return updateLocalPageBackground(input);
    }
    throw new Error(result.error.message);
  }
  return mapPage(result.data);
}

export async function updatePlanPageSettings(pageId: string, settings: CableSettings) {
  const result = await supabase.from("plan_pages").update({
    settings,
    updated_at: new Date().toISOString(),
  }).eq("id", pageId).select("*").single();
  if (result.error) {
    if (
      result.error.message.includes("plan_pages")
      || result.error.message.includes("settings")
      || result.error.code === "42P01"
      || result.error.code === "PGRST204"
    ) {
      return updateLocalPageSettings(pageId, settings);
    }
    throw new Error(result.error.message);
  }
  return mapPage(result.data);
}

export async function uploadPlanBackground(userId: string, projectId: string, file: Blob, fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "png";
  const path = `${userId}/${projectId}/plan-${Date.now()}.${extension}`;
  const upload = await supabase.storage.from("plan-backgrounds").upload(path, file, {
    upsert: true,
    contentType: file.type || "image/png",
  });
  if (upload.error) {
    // Fallback: object URL for local editing when storage bucket is missing.
    const localUrl = URL.createObjectURL(file);
    return { path: `local:${localUrl}`, url: localUrl };
  }
  const url = supabase.storage.from("plan-backgrounds").getPublicUrl(path).data.publicUrl;
  return { path, url };
}

export async function savePlanSymbols(pageId: string, symbols: SymbolInstance[]) {
  const removed = await supabase.from("plan_symbol_instances").delete().eq("page_id", pageId);
  if (removed.error) {
    if (removed.error.message.includes("plan_symbol_instances") || removed.error.code === "42P01") {
      return saveLocalSymbols(pageId, symbols);
    }
    throw new Error(removed.error.message);
  }
  if (!symbols.length) return;
  const inserted = await supabase.from("plan_symbol_instances").insert(symbols.map((symbol) => ({
    id: symbol.id,
    page_id: pageId,
    symbol_type: symbol.symbolType,
    x: symbol.x,
    y: symbol.y,
    rotation: symbol.rotation,
    scale: symbol.scale,
    label: symbol.label,
    notes: symbol.notes,
    metadata: symbol.metadata ?? {},
  })));
  if (inserted.error) throw new Error(inserted.error.message);
}

export async function deletePlanProject(projectId: string) {
  const result = await supabase.from("plan_projects").delete().eq("id", projectId);
  if (result.error) {
    if (result.error.message.includes("plan_projects") || result.error.code === "42P01") {
      deleteLocalProject(projectId);
      return;
    }
    throw new Error(result.error.message);
  }
}

/* -------- LocalStorage fallback when SQL migration is not yet applied -------- */

const LOCAL_KEY = "frizeo-plan-electric:v1";

type LocalStore = {
  projects: PlanProject[];
  pages: PlanPage[];
  symbols: SymbolInstance[];
};

function readStore(): LocalStore {
  if (typeof window === "undefined") return { projects: [], pages: [], symbols: [] };
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return { projects: [], pages: [], symbols: [] };
    return JSON.parse(raw) as LocalStore;
  } catch {
    return { projects: [], pages: [], symbols: [] };
  }
}

function writeStore(store: LocalStore) {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(store));
}

function readLocalProjects(scopeId: string) {
  const store = readStore();
  return store.projects.filter((project) => project.companyId === scopeId || project.ownerId === scopeId);
}

function createLocalProject(input: {
  ownerId: string;
  companyId: string;
  name: string;
  client: string;
  address: string;
  notes: string;
}) {
  const now = new Date().toISOString();
  const project: PlanProject = {
    id: crypto.randomUUID(),
    ownerId: input.ownerId,
    companyId: input.companyId,
    name: input.name,
    client: input.client,
    address: input.address,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  const page: PlanPage = {
    id: crypto.randomUUID(),
    projectId: project.id,
    name: "Plan 1",
    backgroundPath: "",
    backgroundUrl: "",
    width: 2480,
    height: 3508,
    sortOrder: 0,
    settings: mergeCableSettings(),
  };
  const store = readStore();
  store.projects.unshift(project);
  store.pages.push(page);
  writeStore(store);
  return { project, page };
}

function readLocalBundle(projectId: string) {
  const store = readStore();
  const project = store.projects.find((entry) => entry.id === projectId);
  if (!project) throw new Error("Proiectul nu a fost găsit.");
  const pages = store.pages
    .filter((page) => page.projectId === projectId)
    .map((page) => ({ ...page, settings: mergeCableSettings(page.settings) }));
  const pageId = pages[0]?.id;
  const symbols = pageId ? store.symbols.filter((symbol) => symbol.pageId === pageId) : [];
  return { project, pages, symbols };
}

function updateLocalPageBackground(input: {
  pageId: string;
  backgroundPath: string;
  width: number;
  height: number;
}) {
  const store = readStore();
  const page = store.pages.find((entry) => entry.id === input.pageId);
  if (!page) throw new Error("Pagina nu a fost găsită.");
  page.backgroundPath = input.backgroundPath;
  page.backgroundUrl = input.backgroundPath.startsWith("local:")
    ? input.backgroundPath.slice(6)
    : input.backgroundPath;
  page.width = input.width;
  page.height = input.height;
  writeStore(store);
  return page;
}

function updateLocalPageSettings(pageId: string, settings: CableSettings) {
  const store = readStore();
  const page = store.pages.find((entry) => entry.id === pageId);
  if (!page) throw new Error("Pagina nu a fost găsită.");
  page.settings = mergeCableSettings(settings);
  writeStore(store);
  return page;
}

function saveLocalSymbols(pageId: string, symbols: SymbolInstance[]) {
  const store = readStore();
  store.symbols = [
    ...store.symbols.filter((symbol) => symbol.pageId !== pageId),
    ...symbols.map((symbol) => ({ ...symbol, pageId })),
  ];
  writeStore(store);
}

function deleteLocalProject(projectId: string) {
  const store = readStore();
  const pageIds = new Set(store.pages.filter((page) => page.projectId === projectId).map((page) => page.id));
  store.projects = store.projects.filter((project) => project.id !== projectId);
  store.pages = store.pages.filter((page) => page.projectId !== projectId);
  store.symbols = store.symbols.filter((symbol) => !pageIds.has(symbol.pageId));
  writeStore(store);
}
