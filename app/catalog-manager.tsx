"use client";

import { useMemo, useRef, useState } from "react";
import { firstPopulatedSheet, parseCatalogRows } from "./excel-import";

export type ManagedCatalogItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  subcategory: string;
  kind: "material" | "labor" | "expense";
  unit: string;
  unitPrice: number;
  currency: string;
  vatRate: number;
  specifications: string;
  sourceType: string;
  active: boolean;
};

type Props = {
  items: ManagedCatalogItem[];
  onSave: (item: ManagedCatalogItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImport: (items: ManagedCatalogItem[]) => Promise<void>;
  onBack: () => void;
};

function parseCsv(text: string) {
  const separator = text.split("\n")[0]?.includes(";") ? ";" : ",";
  return text.split(/\r?\n/).filter(Boolean).map((line) => {
    const cells: string[] = [];
    let current = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"') {
        if (quoted && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else quoted = !quoted;
      } else if (char === separator && !quoted) {
        cells.push(current.trim());
        current = "";
      } else current += char;
    }
    cells.push(current.trim());
    return cells;
  });
}

export function CatalogManager({ items, onSave, onDelete, onImport, onBack }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Toate");
  const [editing, setEditing] = useState<ManagedCatalogItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const categories = useMemo(() => ["Toate", ...Array.from(new Set(items.map((item) => item.category))).filter(Boolean).sort()], [items]);
  const filtered = useMemo(() => {
    const search = query.toLocaleLowerCase("ro");
    return items
      .filter((item) => category === "Toate" || item.category === category)
      .filter((item) => !search || `${item.code} ${item.name} ${item.category} ${item.subcategory}`.toLocaleLowerCase("ro").includes(search))
      .slice(0, 200);
  }, [items, query, category]);

  function newItem() {
    setEditing({
      id: crypto.randomUUID(), code: "", name: "", category: "Materiale personalizate", subcategory: "",
      kind: "material", unit: "buc", unitPrice: 0, currency: "RON", vatRate: 21,
      specifications: "", sourceType: "adăugat manual", active: true,
    });
  }

  async function saveEditing() {
    if (!editing?.name.trim()) {
      setMessage("Denumirea articolului este necesară.");
      return;
    }
    setBusy(true);
    try {
      await onSave({ ...editing, name: editing.name.trim() });
      setEditing(null);
      setMessage("Articol salvat.");
    } catch (error) {
      setMessage(`Salvarea a eșuat: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function importFile(file: File) {
    setBusy(true);
    setMessage("Se citește fișierul…");
    try {
      let rows: unknown[][];
      if (file.name.toLowerCase().endsWith(".csv")) {
        rows = parseCsv(await file.text());
      } else {
        const readXlsxFile = (await import("read-excel-file/browser")).default;
        rows = firstPopulatedSheet(await readXlsxFile(file));
      }
      const imported = parseCatalogRows(rows) as ManagedCatalogItem[];
      if (!imported.length) throw new Error("Nu am găsit coloana Denumire/Nume și articole valide.");
      await onImport(imported);
      setMessage(`${imported.length} articole importate.`);
    } catch (error) {
      setMessage(`Importul a eșuat: ${(error as Error).message}`);
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function downloadTemplate() {
    const anchor = document.createElement("a");
    anchor.href = "/model-import-catalog.xlsx";
    anchor.download = "model-import-catalog.xlsx";
    anchor.click();
  }

  async function toggleActive(item: ManagedCatalogItem) {
    setBusy(true);
    try {
      await onSave({ ...item, active: !item.active });
      setMessage(item.active ? "Articol dezactivat." : "Articol activat.");
    } catch (error) {
      setMessage(`Actualizarea a eșuat: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(item: ManagedCatalogItem) {
    if (!window.confirm(`Ștergi articolul „${item.name}”?`)) return;
    setBusy(true);
    try {
      await onDelete(item.id);
      setMessage("Articol șters.");
    } catch (error) {
      setMessage(`Ștergerea a eșuat: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <div><button className="back" onClick={onBack}>← Înapoi</button><h1>Catalog</h1><p>{items.length} articole · {items.filter((item) => item.active).length} active</p></div>
        <div className="top-actions">
          <input ref={fileInput} hidden type="file" accept=".xlsx,.xls,.csv" onChange={(event) => event.target.files?.[0] && importFile(event.target.files[0])} />
          <button className="secondary" onClick={downloadTemplate}>Descarcă model</button>
          <button className="secondary" disabled={busy} onClick={() => fileInput.current?.click()}>Importă Excel / CSV</button>
          <button className="primary" onClick={newItem}>＋ Articol nou</button>
        </div>
      </header>
      <section className="management-page">
        <div className="catalog-admin-note"><strong>Format import:</strong> Denumire, Cod, Categorie, Subcategorie, Tip, UM, Preț, Monedă, TVA, Specificații. Doar denumirea este obligatorie.</div>
        {message && <div className="management-message">{message}</div>}
        <div className="catalog-admin-filters">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Caută după denumire, cod sau categorie…" />
          <select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((entry) => <option key={entry}>{entry}</option>)}</select>
        </div>
        <div className="card catalog-admin-table">
          <div className="catalog-admin-head"><span>Articol</span><span>Categorie</span><span>UM</span><span>Preț</span><span>Stare</span><span></span></div>
          {filtered.map((item) => (
            <div className={`catalog-admin-row ${item.active ? "" : "inactive"}`} key={item.id}>
              <div><strong>{item.name}</strong><small>{item.code || "Fără cod"} · {item.kind}</small></div>
              <span>{item.category}</span><span>{item.unit}</span>
              <strong>{item.unitPrice.toLocaleString("ro-RO", { minimumFractionDigits: 2 })} {item.currency}</strong>
              <button disabled={busy} className={`catalog-state ${item.active ? "active" : ""}`} onClick={() => toggleActive(item)}>{item.active ? "Activ" : "Inactiv"}</button>
              <div className="row-actions"><button onClick={() => setEditing(item)} title="Editează">✎</button><button disabled={busy} onClick={() => deleteItem(item)} title="Șterge">×</button></div>
            </div>
          ))}
        </div>
      </section>
      {editing && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setEditing(null)}>
          <section className="catalog-edit-modal">
            <header><div><span className="eyebrow">CATALOG</span><h2>{items.some((item) => item.id === editing.id) ? "Editează articolul" : "Articol nou"}</h2></div><button className="modal-close" onClick={() => setEditing(null)}>×</button></header>
            <div className="catalog-edit-grid">
              <label className="wide">Denumire<input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></label>
              <label>Cod<input value={editing.code} onChange={(event) => setEditing({ ...editing, code: event.target.value })} /></label>
              <label>Categorie<input value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value })} /></label>
              <label>Subcategorie<input value={editing.subcategory} onChange={(event) => setEditing({ ...editing, subcategory: event.target.value })} /></label>
              <label>Tip<select value={editing.kind} onChange={(event) => setEditing({ ...editing, kind: event.target.value as ManagedCatalogItem["kind"] })}><option value="material">Material</option><option value="labor">Serviciu / manoperă</option><option value="expense">Cost auxiliar</option></select></label>
              <label>UM<input value={editing.unit} onChange={(event) => setEditing({ ...editing, unit: event.target.value })} /></label>
              <label>Preț unitar<input type="number" min="0" step="0.01" value={editing.unitPrice} onChange={(event) => setEditing({ ...editing, unitPrice: Number(event.target.value) })} /></label>
              <label>Monedă<select value={editing.currency} onChange={(event) => setEditing({ ...editing, currency: event.target.value })}><option>RON</option><option>EUR</option></select></label>
              <label>TVA<select value={editing.vatRate} onChange={(event) => setEditing({ ...editing, vatRate: Number(event.target.value) })}><option value="0">0%</option><option value="11">11%</option><option value="21">21%</option></select></label>
              <label className="wide">Specificații<textarea value={editing.specifications} onChange={(event) => setEditing({ ...editing, specifications: event.target.value })} /></label>
              <label className="catalog-active-check"><input type="checkbox" checked={editing.active} onChange={(event) => setEditing({ ...editing, active: event.target.checked })} />Articol activ</label>
            </div>
            <footer><button className="secondary" onClick={() => setEditing(null)}>Anulează</button><button className="primary" disabled={busy} onClick={saveEditing}>Salvează</button></footer>
          </section>
        </div>
      )}
    </>
  );
}
