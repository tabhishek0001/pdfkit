# PDFKit — All-in-One PDF Toolkit

PDFKit is a browser-first workspace for common PDF tasks. The initial MVP does not require an account or application-server upload.

## Included tools
- **Merge PDF:** combine multiple files and reorder the input sequence.
- **Split & extract:** create a new PDF from page numbers and ranges (for example, `1, 3-5, 8`).
- **Organize PDF:** preview, reorder, rotate and remove pages.
- **Images to PDF:** create a PDF from JPG and PNG images.
- **PDF to images:** render pages to PNG files.
- **Compress PDF:** rasterize pages into JPEG-backed PDF pages with adjustable image quality.

## Run locally
This is a static site. Serve the repository root with any local static HTTP server, or publish it to a static hosting provider. Open `index.html` through the server.

The UI uses Bootstrap 5.3, Font Awesome, pdf-lib 1.17.1 and PDF.js 3.11.174 from public CDNs. An internet connection is required to load these dependencies.

## Privacy
Supported document operations run in the browser. The app does not upload selected documents to a PDFKit backend and does not store document contents in localStorage. CDN requests are made to load the front-end libraries and stylesheets. Do not use a shared or untrusted device for confidential documents.

## Important limitations
- Compression is a rasterization process, not lossless structural optimization. Text becomes non-selectable; links, forms, accessibility structure, vector quality and metadata may be lost. The output is not guaranteed to be smaller.
- PDF-to-image triggers a separate PNG download for each page. Browser download settings may ask for permission to download multiple files.
- PDF-to-Word, OCR, Office format conversion, digital signatures, password removal, cloud storage and account features are not included.
- Browser memory and device performance limit the size and number of pages that can be processed. The image conversion and compression tools enforce page-count limits.
- Password-protected or malformed PDFs may not be supported.

## Project files
- `index.html` — application shell and metadata
- `assets/css/app.css` — responsive styling
- `assets/js/app.js` — browser-side PDF operations
- `PRODUCT-SPEC.md` — product scope and limitations
- `tests/TEST-PLAN.md` — manual QA checklist

## Status
Version 1.0.0 — MVP implementation in QA. Review the manual test plan before public release.
