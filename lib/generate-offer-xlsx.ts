import { strToU8, zipSync } from "fflate";

type ExcelOffer = {
  number: string;
  client: string;
  title: string;
  issueDate: string;
  validityDays: string;
  currency: string;
  items: Array<{
    kind: "material" | "labor" | "expense";
    name: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
  }>;
  labor: number;
  laborOptions: { vatRate: number; showLine: boolean };
  discount: number;
  notes: string;
  company: {
    name: string;
    taxId: string;
    registrationNumber: string;
    address: string;
    phone: string;
    email: string;
  };
};

function xml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textCell(ref: string, value: unknown, style = 0) {
  return `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
}

function numberCell(ref: string, value: number, style = 0) {
  return `<c r="${ref}" s="${style}"><v>${Number.isFinite(value) ? value : 0}</v></c>`;
}

function formulaCell(ref: string, formula: string, style = 0, cachedValue = 0) {
  return `<c r="${ref}" s="${style}"><f>${xml(formula)}</f><v>${Number.isFinite(cachedValue) ? cachedValue : 0}</v></c>`;
}

function safeName(value: string) {
  return (value || "client")
    .replace(/[^a-zA-Z0-9ăâîșțĂÂÎȘȚ -]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export async function createOfferXlsx(input: ExcelOffer) {
  const firstItemRow = 11;
  const lastItemRow = Math.max(firstItemRow, firstItemRow + input.items.length - 1);
  const summaryRow = lastItemRow + 3;
  const subtotal = input.items.filter((item) => item.kind !== "labor").reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const servicesSubtotal = input.items.filter((item) => item.kind === "labor").reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount = subtotal * input.discount / 100;
  const materialVat = input.items.filter((item) => item.kind !== "labor").reduce((sum, item) => sum + item.quantity * item.unitPrice * item.vatRate / 100, 0) * (1 - input.discount / 100);
  const serviceVat = input.items.filter((item) => item.kind === "labor").reduce((sum, item) => sum + item.quantity * item.unitPrice * item.vatRate / 100, 0);
  const itemVat = materialVat + serviceVat;
  const laborVat = input.labor * input.laborOptions.vatRate / 100;
  const grandTotal = subtotal - discountAmount + servicesSubtotal + itemVat + input.labor + laborVat;
  const rows: string[] = [
    `<row r="1" ht="28" customHeight="1">${textCell("A1", input.company.name.toUpperCase(), 1)}</row>`,
    `<row r="2">${textCell("A2", `CUI ${input.company.taxId}${input.company.registrationNumber ? ` | ${input.company.registrationNumber}` : ""}`, 2)}</row>`,
    `<row r="3">${textCell("A3", `${input.company.address} | ${input.company.phone}${input.company.email ? ` | ${input.company.email}` : ""}`, 2)}</row>`,
    `<row r="5" ht="26" customHeight="1">${textCell("A5", `OFERTĂ ${input.number}`, 3)}</row>`,
    `<row r="6">${textCell("A6", "Beneficiar", 4)}${textCell("B6", input.client, 5)}${textCell("F6", "Data", 4)}${textCell("G6", input.issueDate, 5)}</row>`,
    `<row r="7">${textCell("A7", "Lucrare", 4)}${textCell("B7", input.title, 5)}${textCell("F7", "Valabilitate", 4)}${textCell("G7", `${input.validityDays} zile`, 5)}</row>`,
    `<row r="8">${textCell("A8", "Monedă", 4)}${textCell("B8", input.currency, 5)}</row>`,
    `<row r="10" ht="28" customHeight="1">${[
      ["A10", "#"], ["B10", "Descriere"], ["C10", "Tip"], ["D10", "UM"],
      ["E10", "Cantitate"], ["F10", "Preț unitar fără TVA"], ["G10", "TVA (%)"],
      ["H10", "Preț unitar cu TVA"], ["I10", "Total cu TVA"],
    ].map(([ref, value]) => textCell(ref, value, 6)).join("")}</row>`,
  ];

  input.items.forEach((item, index) => {
    const row = firstItemRow + index;
    rows.push(`<row r="${row}" ht="24" customHeight="1">${
      numberCell(`A${row}`, index + 1, 7)
    }${textCell(`B${row}`, item.name, 8)
    }${textCell(`C${row}`, item.kind, 7)
    }${textCell(`D${row}`, item.unit, 7)
    }${numberCell(`E${row}`, item.quantity, 9)
    }${numberCell(`F${row}`, item.unitPrice, 10)
    }${numberCell(`G${row}`, item.vatRate, 9)
    }${formulaCell(`H${row}`, `F${row}*(1+G${row}/100)`, 10, item.unitPrice * (1 + item.vatRate / 100))
    }${formulaCell(`I${row}`, `E${row}*H${row}`, 11, item.quantity * item.unitPrice * (1 + item.vatRate / 100))}</row>`);
  });

  rows.push(
    `<row r="${summaryRow}">${textCell(`F${summaryRow}`, "Materiale/costuri fără TVA", 4)}${formulaCell(`I${summaryRow}`, `SUMPRODUCT((C${firstItemRow}:C${lastItemRow}<>"labor")*E${firstItemRow}:E${lastItemRow}*F${firstItemRow}:F${lastItemRow})`, 10, subtotal)}</row>`,
    `<row r="${summaryRow + 1}">${textCell(`F${summaryRow + 1}`, "Servicii din poziții", 4)}${formulaCell(`I${summaryRow + 1}`, `SUMPRODUCT((C${firstItemRow}:C${lastItemRow}="labor")*E${firstItemRow}:E${lastItemRow}*F${firstItemRow}:F${lastItemRow})`, 10, servicesSubtotal)}</row>`,
    `<row r="${summaryRow + 2}">${textCell(`F${summaryRow + 2}`, `Discount materiale (${input.discount}%)`, 4)}${formulaCell(`I${summaryRow + 2}`, `-I${summaryRow}*${input.discount}/100`, 10, -discountAmount)}</row>`,
    `<row r="${summaryRow + 3}">${textCell(`F${summaryRow + 3}`, "TVA poziții", 4)}${formulaCell(`I${summaryRow + 3}`, `(SUMPRODUCT((C${firstItemRow}:C${lastItemRow}<>"labor")*E${firstItemRow}:E${lastItemRow}*F${firstItemRow}:F${lastItemRow}*G${firstItemRow}:G${lastItemRow})/100)*(1-${input.discount}/100)+SUMPRODUCT((C${firstItemRow}:C${lastItemRow}="labor")*E${firstItemRow}:E${lastItemRow}*F${firstItemRow}:F${lastItemRow}*G${firstItemRow}:G${lastItemRow})/100`, 10, itemVat)}</row>`,
    `<row r="${summaryRow + 4}">${textCell(`F${summaryRow + 4}`, "Manoperă", 4)}${numberCell(`I${summaryRow + 4}`, input.labor, 10)}</row>`,
    `<row r="${summaryRow + 5}">${textCell(`F${summaryRow + 5}`, `TVA manoperă (${input.laborOptions.vatRate}%)`, 4)}${formulaCell(`I${summaryRow + 5}`, `I${summaryRow + 4}*${input.laborOptions.vatRate}/100`, 10, laborVat)}</row>`,
    `<row r="${summaryRow + 6}" ht="30" customHeight="1">${textCell(`F${summaryRow + 6}`, "TOTAL GENERAL", 12)}${formulaCell(`I${summaryRow + 6}`, `SUM(I${summaryRow}:I${summaryRow + 5})`, 13, grandTotal)}</row>`,
  );

  const notesRow = summaryRow + 9;
  if (input.notes.trim()) {
    rows.push(`<row r="${notesRow}" ht="50" customHeight="1">${textCell(`A${notesRow}`, `Condiții și mențiuni:\n${input.notes}`, 14)}</row>`);
  }

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView showGridLines="0" workbookViewId="0"><pane ySplit="10" topLeftCell="A11" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>
    <col min="1" max="1" width="6" customWidth="1"/><col min="2" max="2" width="42" customWidth="1"/>
    <col min="3" max="4" width="13" customWidth="1"/><col min="5" max="5" width="12" customWidth="1"/>
    <col min="6" max="6" width="21" customWidth="1"/><col min="7" max="7" width="11" customWidth="1"/>
    <col min="8" max="9" width="21" customWidth="1"/>
  </cols>
  <sheetData>${rows.join("")}</sheetData>
  <mergeCells count="5"><mergeCell ref="A1:I1"/><mergeCell ref="A2:I2"/><mergeCell ref="A3:I3"/><mergeCell ref="A5:I5"/><mergeCell ref="A${notesRow}:I${notesRow}"/></mergeCells>
  <autoFilter ref="A10:I${lastItemRow}"/>
  <dataValidations count="2">
    <dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="C${firstItemRow}:C${lastItemRow + 100}"><formula1>"material,labor,expense"</formula1></dataValidation>
    <dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="G${firstItemRow}:G${lastItemRow + 100}"><formula1>"0,11,21"</formula1></dataValidation>
  </dataValidations>
  <pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
  <pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;

  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><calcPr calcId="191029" fullCalcOnLoad="1" forceFullCalc="1"/><sheets><sheet name="Ofertă" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    "xl/worksheets/sheet1.xml": strToU8(sheetXml),
    "xl/styles.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts>
  <fonts count="5"><font><sz val="10"/><name val="Aptos"/></font><font><b/><sz val="16"/><color rgb="FF172238"/><name val="Aptos Display"/></font><font><sz val="9"/><color rgb="FF64708A"/><name val="Aptos"/></font><font><b/><sz val="15"/><color rgb="FF172238"/><name val="Aptos Display"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font></fonts>
  <fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF172238"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFCC15"/></patternFill></fill></fills>
  <borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFE2E8F0"/></bottom><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="15">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="4" fillId="2" borderId="0" xfId="0"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="2" borderId="0" xfId="0"/>
    <xf numFmtId="164" fontId="3" fillId="3" borderId="0" xfId="0"><alignment horizontal="right"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment wrapText="1" vertical="top"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`),
  };

  const bytes = zipSync(files, { level: 6 });
  const blob = new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  return { blob, filename: `${input.number}-${safeName(input.client)}.xlsx` };
}

export async function generateOfferXlsx(input: ExcelOffer) {
  const { blob, filename } = await createOfferXlsx(input);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
