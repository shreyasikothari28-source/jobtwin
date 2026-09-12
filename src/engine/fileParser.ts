// File parsing: PDF (pdf.js) and DOCX (mammoth.js) — all client-side

let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  const pdfjs = await import('pdfjs-dist');
  // Use the bundled worker
  const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.href;
  pdfjsLib = pdfjs;
  return pdfjs;
}

export async function parsePDF(file: File | Blob): Promise<string> {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const lines: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    lines.push(text);
  }

  return lines.join('\n');
}

export async function parseDOCX(file: File | Blob): Promise<string> {
  const mammoth = await import('mammoth/mammoth.browser');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export interface ParseResult {
  text: string;
  status: 'ok' | 'unparseable' | 'empty';
  error?: string;
}

export async function parseResumeFile(file: File): Promise<ParseResult> {
  const fileName = file.name.toLowerCase();

  try {
    let text = '';

    if (fileName.endsWith('.pdf')) {
      text = await parsePDF(file);
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      text = await parseDOCX(file);
    } else if (file.type === 'application/pdf') {
      text = await parsePDF(file);
    } else {
      return { text: '', status: 'unparseable', error: 'Unsupported file type' };
    }

    const cleaned = text.trim();
    if (cleaned.length < 10) {
      return { text: '', status: 'empty', error: 'No extractable text (possibly scanned/image-only)' };
    }

    return { text: cleaned, status: 'ok' };
  } catch (err) {
    return {
      text: '',
      status: 'unparseable',
      error: err instanceof Error ? err.message : 'Unknown parsing error',
    };
  }
}
