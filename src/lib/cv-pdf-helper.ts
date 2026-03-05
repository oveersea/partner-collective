/**
 * Shared CV PDF generation helper.
 * Opens CV HTML in a new browser tab for preview, with a print button
 * so the user can save as PDF via the browser's native print dialog.
 * This produces pixel-perfect results unlike html2canvas-based approaches.
 */

export interface CvPdfOptions {
  html: string;
  fileName: string;
}

/**
 * Open CV HTML in a new tab with print controls.
 * Returns true on success, false on failure.
 */
export function renderCvToPdf({ html, fileName }: CvPdfOptions): boolean {
  try {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      throw new Error("Pop-up diblokir. Izinkan pop-up untuk preview CV.");
    }

    // Inject a print toolbar and auto-print trigger into the HTML
    const printToolbar = `
      <div id="cv-toolbar" style="
        position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
        background: #1a1a1a; color: #fff; padding: 10px 24px;
        display: flex; align-items: center; justify-content: space-between;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <span style="font-weight: 600;">📄 Preview CV — ${fileName.replace('.pdf', '')}</span>
        <div style="display: flex; gap: 8px;">
          <button onclick="document.getElementById('cv-toolbar').style.display='none'; window.print(); setTimeout(function(){ document.getElementById('cv-toolbar').style.display='flex'; }, 500);" style="
            background: #D71920; color: #fff; border: none; padding: 8px 20px;
            border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;
          ">🖨️ Cetak / Simpan PDF</button>
          <button onclick="window.close();" style="
            background: #333; color: #fff; border: none; padding: 8px 16px;
            border-radius: 6px; cursor: pointer; font-size: 13px;
          ">✕ Tutup</button>
        </div>
      </div>
      <style>
        @media print {
          #cv-toolbar { display: none !important; }
          body { padding-top: 0 !important; }
        }
        body { padding-top: 52px !important; }
      </style>
    `;

    // Insert toolbar right after <body> tag
    const modifiedHtml = html.replace(
      /<body([^>]*)>/i,
      `<body$1>${printToolbar}`
    );

    printWindow.document.open();
    printWindow.document.write(modifiedHtml);
    printWindow.document.close();
    printWindow.document.title = fileName.replace('.pdf', '');

    return true;
  } catch (err) {
    console.error("[cv-pdf-helper] renderCvToPdf error:", err);
    return false;
  }
}

/** @deprecated No longer needed — kept for backward compatibility */
export async function ensureHtml2Pdf(): Promise<void> {
  // No-op: html2pdf.js is no longer used
}
