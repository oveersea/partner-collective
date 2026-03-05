

## Diagnosis

I examined the uploaded PDF output and the HTML/CSS from the edge function. There are **two critical bugs**:

### Bug 1: CSS Global Reset Destroys Layout
Line 209 of `generate-cv/index.ts`:
```css
*, *::before, *::after { margin: 0 !important; padding: 0 !important; box-sizing: border-box !important; border: none !important; }
```
This `!important` reset **overrides** all subsequent styles:
- `.page { padding: 40px 48px; }` is killed by `padding: 0 !important` -- content has NO padding, flush against edges
- `.page { margin: 0 auto; }` is killed -- page not centered
- `.section h2 { border-bottom: 1px solid #e5e7eb !important; }` is killed by `border: none !important` (same specificity, reset wins on some browsers)
- `.cv-divider { border-top: 2px solid #D71920; }` killed -- red divider lines disappear

This explains why the PDF shows content cropped on the left and missing visual separators.

### Bug 2: Off-Screen Iframe (`left: -9999px`) Causes Clipping
`html2canvas` captures based on element coordinates. When the iframe is at `left: -9999px`, the rasterizer clips or misaligns content from the left edge. This is why the left portion of every text line is cut off in the PDF.

### Plan

**File 1: `supabase/functions/generate-cv/index.ts`**
- Remove the destructive global `*` reset. Replace with a targeted reset that does NOT use `!important` on padding/margin/border.
- Add `!important` to `.page` padding and the elements that need specific borders.
- Ensure `.page` has proper dimensions with explicit padding.

**File 2: `src/lib/cv-pdf-helper.ts`**
- Change iframe position from `left: -9999px` to `left: 0; top: 0` so html2canvas captures from proper coordinates.
- Keep `opacity: 1`, `pointer-events: none`, `z-index: -9999` to hide from user interaction while remaining capturable.
- Increase the iframe dimensions to accommodate the full `.page` width (210mm = ~794px + some margin).
- Add `overflow: hidden` to prevent any visual bleed.

These two fixes together will restore the full layout: proper padding, visible borders/dividers, centered content, no left-side clipping, and multi-page support.

