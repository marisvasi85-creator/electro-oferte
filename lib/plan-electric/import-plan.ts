export async function renderPdfToImage(file: File, scale = 2.5): Promise<{ blob: Blob; width: number; height: number }> {
  const pdfjs = await import("pdfjs-dist");
  // Worker from CDN matching installed major version; avoids Next bundler worker issues.
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Nu s-a putut crea contextul canvas pentru PDF.");
  await page.render({ canvasContext: context, viewport, canvas }).promise;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("Export PNG din PDF eșuat."))), "image/png");
  });
  return { blob, width: canvas.width, height: canvas.height };
}

export async function loadImageFile(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Imaginea nu a putut fi încărcată."));
      element.src = url;
    });
    return { blob: file, width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function importPlanFile(file: File) {
  const type = file.type.toLowerCase();
  if (type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return renderPdfToImage(file);
  }
  if (type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(file.name)) {
    return loadImageFile(file);
  }
  throw new Error("Format nesuportat. Folosește PDF, PNG sau JPG.");
}
