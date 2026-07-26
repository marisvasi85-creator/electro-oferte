"use client";

import { useMemo, useState } from "react";

type OfferItem = {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

const initialItems: OfferItem[] = [
  { id: 1, name: "Cablu N2XH 3x2,5", unit: "m", quantity: 150, unitPrice: 6.75, vatRate: 21 },
  { id: 2, name: "Tablou Hager Volta 36M", unit: "buc", quantity: 1, unitPrice: 381, vatRate: 21 },
  { id: 3, name: "Material mărunt", unit: "buc", quantity: 1, unitPrice: 500, vatRate: 21 },
];

const money = new Intl.NumberFormat("ro-RO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="nav-icon" aria-hidden="true">{children}</span>;
}

export default function Home() {
  const [items, setItems] = useState(initialItems);
  const [client, setClient] = useState("Modern Construct Service");
  const [title, setTitle] = useState("Instalație electrică locuință");
  const [labor, setLabor] = useState(4200);
  const [discount, setDiscount] = useState(0);
  const [previewMode, setPreviewMode] = useState<"detaliat" | "simplificat">("detaliat");

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discountAmount = subtotal * (discount / 100);
    const taxable = subtotal - discountAmount;
    const vat = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice * (item.vatRate / 100),
      0,
    ) * (1 - discount / 100);
    return { subtotal, discountAmount, vat, materials: taxable + vat, grand: taxable + vat + labor };
  }, [items, discount, labor]);

  function updateItem(id: number, field: keyof OfferItem, value: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, [field]: field === "name" || field === "unit" ? value : Number(value) }
          : item,
      ),
    );
  }

  function addItem() {
    const id = Math.max(0, ...items.map((item) => item.id)) + 1;
    setItems([...items, { id, name: "Articol nou", unit: "buc", quantity: 1, unitPrice: 0, vatRate: 21 }]);
  }

  function removeItem(id: number) {
    setItems(items.filter((item) => item.id !== id));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">E</div>
          <div>
            <strong>Electro Oferte</strong>
            <span>ElectricSmart</span>
          </div>
        </div>
        <nav aria-label="Navigare principală">
          <button><Icon>⌂</Icon>Panou principal</button>
          <button className="active"><Icon>▤</Icon>Oferte <span className="count">12</span></button>
          <button><Icon>♙</Icon>Clienți</button>
          <button><Icon>◇</Icon>Catalog</button>
          <button><Icon>⚙</Icon>Setări firmă</button>
        </nav>
        <div className="company-card">
          <span className="company-avatar">ES</span>
          <div><strong>ElectricSmart.Co</strong><small>CUI 47684690</small></div>
          <span>⌄</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <a href="#" className="back">← Înapoi la oferte</a>
            <h1>Ofertă nouă</h1>
            <p>Ciornă salvată automat · OF-2026-013</p>
          </div>
          <div className="top-actions">
            <button className="secondary" onClick={() => window.print()}>Previzualizare PDF</button>
            <button className="primary">Salvează oferta</button>
          </div>
        </header>

        <div className="content-grid">
          <div className="editor">
            <section className="card details-card">
              <div className="section-heading">
                <span className="step">1</span>
                <div><h2>Detalii ofertă</h2><p>Informațiile de bază ale lucrării</p></div>
              </div>
              <div className="form-grid">
                <label>Beneficiar
                  <input value={client} onChange={(event) => setClient(event.target.value)} />
                </label>
                <label>Data emiterii
                  <input type="date" defaultValue="2026-07-26" />
                </label>
                <label className="wide">Titlul lucrării
                  <input value={title} onChange={(event) => setTitle(event.target.value)} />
                </label>
                <label>Valabilitate
                  <select defaultValue="30"><option value="15">15 zile</option><option value="30">30 zile</option><option value="60">60 zile</option></select>
                </label>
                <label>Monedă
                  <select><option>RON</option><option>EUR</option></select>
                </label>
              </div>
            </section>

            <section className="card items-card">
              <div className="section-heading items-heading">
                <span className="step">2</span>
                <div><h2>Materiale și servicii</h2><p>Valorile sunt calculate automat</p></div>
                <button className="add-button" onClick={addItem}>＋ Adaugă poziție</button>
              </div>
              <div className="table-scroll">
                <table>
                  <thead><tr><th>#</th><th>Articol</th><th>UM</th><th>Cant.</th><th>Preț fără TVA</th><th>TVA</th><th>Total</th><th></th></tr></thead>
                  <tbody>
                    {items.map((item, index) => {
                      const lineSubtotal = item.quantity * item.unitPrice;
                      const lineTotal = lineSubtotal * (1 + item.vatRate / 100);
                      return (
                        <tr key={item.id}>
                          <td className="row-number">{index + 1}</td>
                          <td><input aria-label={`Denumire poziția ${index + 1}`} value={item.name} onChange={(event) => updateItem(item.id, "name", event.target.value)} /></td>
                          <td><select aria-label={`Unitate poziția ${index + 1}`} value={item.unit} onChange={(event) => updateItem(item.id, "unit", event.target.value)}><option value="buc">buc</option><option value="m">m</option><option value="set">set</option><option value="lucrare">lucrare</option></select></td>
                          <td><input aria-label={`Cantitate poziția ${index + 1}`} type="number" min="0" step="0.01" value={item.quantity} onChange={(event) => updateItem(item.id, "quantity", event.target.value)} /></td>
                          <td><div className="money-input"><input aria-label={`Preț poziția ${index + 1}`} type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => updateItem(item.id, "unitPrice", event.target.value)} /><span>lei</span></div></td>
                          <td><select aria-label={`TVA poziția ${index + 1}`} value={item.vatRate} onChange={(event) => updateItem(item.id, "vatRate", event.target.value)}><option value="21">21%</option><option value="11">11%</option><option value="0">0%</option></select></td>
                          <td className="line-total">{money.format(lineTotal)} lei</td>
                          <td><button className="remove" aria-label={`Șterge poziția ${index + 1}`} onClick={() => removeItem(item.id)}>×</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bottom-grid">
              <div className="card compact-card">
                <div className="section-heading"><span className="step">3</span><div><h2>Manoperă și ajustări</h2><p>Costuri finale ale lucrării</p></div></div>
                <div className="compact-fields">
                  <label>Manoperă <div className="money-input"><input type="number" min="0" value={labor} onChange={(event) => setLabor(Number(event.target.value))} /><span>lei</span></div></label>
                  <label>Discount materiale <div className="money-input"><input type="number" min="0" max="100" value={discount} onChange={(event) => setDiscount(Number(event.target.value))} /><span>%</span></div></label>
                </div>
              </div>
              <div className="card totals-card">
                <div><span>Materiale fără TVA</span><strong>{money.format(totals.subtotal)} lei</strong></div>
                {discount > 0 && <div className="discount"><span>Discount ({discount}%)</span><strong>-{money.format(totals.discountAmount)} lei</strong></div>}
                <div><span>TVA materiale</span><strong>{money.format(totals.vat)} lei</strong></div>
                <div><span>Manoperă</span><strong>{money.format(labor)} lei</strong></div>
                <div className="grand-total"><span>Total general</span><strong>{money.format(totals.grand)} lei</strong></div>
              </div>
            </section>

            <section className="card notes-card">
              <div className="section-heading"><span className="step">4</span><div><h2>Condiții și mențiuni</h2><p>Apar la finalul documentului</p></div></div>
              <textarea defaultValue={"Garanție: 24 luni\nValabilitate: 30 zile de la data întocmirii\nOferta nu include costurile de deplasare și cazare."} />
            </section>
          </div>

          <aside className="preview-card">
            <div className="preview-toolbar">
              <strong>Previzualizare</strong>
              <div className="segmented">
                <button className={previewMode === "detaliat" ? "selected" : ""} onClick={() => setPreviewMode("detaliat")}>Detaliat</button>
                <button className={previewMode === "simplificat" ? "selected" : ""} onClick={() => setPreviewMode("simplificat")}>Simplificat</button>
              </div>
            </div>
            <article className="paper">
              <div className="paper-header">
                <div><strong>ELECTRICSMART.CO S.R.L.</strong><span>CUI 47684690 · J02/287/2023</span><span>Socodor nr. 77, Arad</span><span>Tel. 0751 970 357</span></div>
                <div className="paper-logo">ES</div>
              </div>
              <div className="paper-title">
                <small>OF-2026-013 · 26.07.2026</small>
                <h3>{title}</h3>
                <p>Beneficiar: <strong>{client}</strong></p>
              </div>
              <table className="paper-table">
                <thead><tr><th>#</th><th>Descriere</th><th>UM</th><th>Cant.</th>{previewMode === "detaliat" && <><th>Preț</th><th>Total</th></>}</tr></thead>
                <tbody>{items.map((item, index) => (
                  <tr key={item.id}><td>{index + 1}</td><td>{item.name}</td><td>{item.unit}</td><td>{item.quantity}</td>{previewMode === "detaliat" && <><td>{money.format(item.unitPrice)}</td><td>{money.format(item.quantity * item.unitPrice * (1 + item.vatRate / 100))}</td></>}</tr>
                ))}</tbody>
              </table>
              <div className="paper-summary">
                <p><span>Materiale cu TVA</span><strong>{money.format(totals.materials)} lei</strong></p>
                <p><span>Manoperă</span><strong>{money.format(labor)} lei</strong></p>
                <p><span>TOTAL GENERAL</span><strong>{money.format(totals.grand)} lei</strong></p>
              </div>
              <div className="paper-notes"><strong>Condiții</strong><p>Garanție: 24 luni</p><p>Valabilitate: 30 zile de la data întocmirii</p></div>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}
