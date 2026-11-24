# PDFKit Manual QA Plan

Use non-sensitive sample documents. Test in current Chrome, Firefox and Edge where available.

## General
- [ ] Page loads at desktop, tablet and mobile widths.
- [ ] Tool cards switch tools and clear previous selections/results.
- [ ] File picker and drag-and-drop work.
- [ ] Unsupported files are rejected with a useful message.
- [ ] File names are rendered as text, not interpreted as HTML.
- [ ] Keyboard can focus and activate the drop area and tool cards.
- [ ] No uncaught console errors.

## Merge
- [ ] Merge two valid PDFs.
- [ ] Merge three PDFs and verify selected order.
- [ ] Reorder files before merging.
- [ ] Reject zero or one selected file.
- [ ] Verify page count and content in output.

## Split / extract
- [ ] Extract one page.
- [ ] Extract multiple pages (1, 3, 5).
- [ ] Extract a range (2-4).
- [ ] Extract mixed ranges (1, 3-5, 8).
- [ ] Reject empty, malformed, reversed and out-of-bounds ranges.

## Organize
- [ ] Load a multi-page PDF and verify thumbnails.
- [ ] Move pages earlier and later.
- [ ] Rotate a page and verify output orientation.
- [ ] Remove a page and verify output page count.
- [ ] Reject export when all pages are removed.

## Images to PDF
- [ ] Convert one JPEG and one PNG.
- [ ] Convert multiple images and verify order.
- [ ] Reject unsupported image types.
- [ ] Verify portrait and landscape image dimensions.

## PDF to images
- [ ] Convert a multi-page PDF and verify PNG downloads.
- [ ] Verify page filenames are distinct.
- [ ] Confirm page-count safety limit is enforced.

## Compress
- [ ] Run at low, medium and high quality.
- [ ] Verify generated PDF opens.
- [ ] Verify text is rasterized and limitation is clearly disclosed.
- [ ] Compare input/output size; do not assume output is always smaller.
- [ ] Confirm page-count safety limit is enforced.

## Privacy
- [ ] Confirm application code has no document upload request.
- [ ] Confirm no document content is stored in localStorage or sent to analytics.
