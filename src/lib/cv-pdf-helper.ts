/**
 * Shared CV PDF generation helper.
 * Used by both single (AdminUserDetail) and bulk (AdminUsers) download flows.
 *
 * Key design decisions:
 * - Iframe is rendered at opacity:0 initially, switched to opacity:1 right
 *   before html2canvas capture so text is rasterized at full intensity.
 * - Positioned at left:0;top:0 with z-index:-9999 and pointer-events:none
 *   so html2canvas captures correct coordinates without user seeing it.
 * - Fixed A4 pixel dimensions (794×1123 at 96 dpi) for deterministic layout.
 * - allowTaint is false; useCORS is true to avoid tainted-canvas issues.
 */

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

/** Ensure html2pdf.js is loaded (idempotent). */
export async function ensureHtml2Pdf(): Promise<void> {
  if ((window as any).html2pdf) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Gagal memuat html2pdf"));
    document.head.appendChild(script);
  });
}

export interface CvPdfOptions {
  html: string;
  fileName: string;
}

/**
 * Render CV HTML inside an isolated iframe and produce a PDF download.
 * Returns true on success, false on failure.
 */
export async function renderCvToPdf({
  html,
  fileName,
}: CvPdfOptions): Promise<boolean> {
  let iframe: HTMLIFrameElement | null = null;
  try {
    await ensureHtml2Pdf();

    // Create a fully-rendered but hidden iframe
    iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.left = "0";
    iframe.style.top = "0";
    iframe.style.width = `${A4_WIDTH_PX + 40}px`;
    iframe.style.height = `${A4_HEIGHT_PX * 3}px`;
    iframe.style.border = "0";
    iframe.style.opacity = "0"; // hidden during layout
    iframe.style.pointerEvents = "none";
    iframe.style.zIndex = "-9999";
    iframe.style.overflow = "hidden";
    document.body.appendChild(iframe);

    const iframeDoc =
      iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) throw new Error("Cannot access iframe document");

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Wait for initial layout
    await sleep(200);

    // Wait for fonts
    const iframeFonts = (iframeDoc as Document & { fonts?: FontFaceSet })
      .fonts;
    if (iframeFonts?.ready) {
      await iframeFonts.ready;
    }

    // Wait for images
    const imgs = Array.from(iframeDoc.querySelectorAll("img"));
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );

    // Extra settle time after assets
    await sleep(200);

    // Switch to visible for html2canvas capture (must be opacity:1 for text)
    iframe.style.opacity = "1";
    await sleep(50);

    const renderTarget = iframeDoc.querySelector(".page") as HTMLElement;
    if (!renderTarget)
      throw new Error("CV .page element not found in iframe");

    await (window as any)
      .html2pdf()
      .set({
        margin: 0, // .page already has internal padding
        filename: fileName,
        image: { type: "jpeg", quality: 0.92 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0,
          windowWidth: A4_WIDTH_PX,
          windowHeight: A4_HEIGHT_PX,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(renderTarget)
      .save();

    return true;
  } catch (err) {
    console.error("[cv-pdf-helper] renderCvToPdf error:", err);
    return false;
  } finally {
    if (iframe && document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
