"use client";

// Extract text from a PDF file client-side using pdfjs-dist
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Use the worker from CDN to avoid bundling issues
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  let text = "";
  const maxPages = Math.min(pdf.numPages, 30); // limit for performance
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: unknown) => (item as { str?: string }).str || "")
      .join(" ");
    text += pageText + "\n\n";
  }
  return text.trim();
}
