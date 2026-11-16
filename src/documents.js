export async function extractDocument(file) {
  if (!file || !/\.(pdf|docx)$/i.test(file.name)) throw new Error('Choose a PDF or DOCX file.');
  if (file.size > 5 * 1024 * 1024) throw new Error('File must be 5 MB or smaller.');
  const buffer = await file.arrayBuffer();
  let content;
  if (/\.docx$/i.test(file.name)) {
    const mammoth = await import('mammoth/mammoth.browser');
    content = (await (mammoth.default || mammoth).extractRawText({ arrayBuffer: buffer })).value;
  } else {
    const pdfjs = await import('pdfjs-dist');
    const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const document = await pdfjs.getDocument({ data: buffer, isEvalSupported: false }).promise;
    try {
      const pages = [];
      for (let i = 1; i <= document.numPages; i++) {
        const page = await document.getPage(i);
        pages.push((await page.getTextContent()).items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join(''));
      }
      content = pages.join('\n\n');
    } finally { await document.destroy(); }
  }
  if (!content.trim()) throw new Error('No selectable text found. Scanned PDFs need OCR first.');
  return content.slice(0, 16000);
}
