(() => {
  'use strict';

  const { PDFDocument, degrees } = PDFLib;
  const $ = (selector) => document.querySelector(selector);
  const state = { tool: 'merge', files: [], pages: [], pdfBytes: null, busy: false };
  const configs = {
    merge: { title: 'Merge PDF files', desc: 'Select two or more PDF files and combine them in the order shown.', accept: '.pdf,application/pdf', multiple: true, label: 'Merge PDFs', min: 2, hint: 'PDF files · Multiple files supported' },
    split: { title: 'Split & extract PDF pages', desc: 'Upload a PDF and enter the pages you want to extract. Example: 1, 3-5, 8.', accept: '.pdf,application/pdf', multiple: false, label: 'Extract pages', min: 1, hint: 'One PDF file' },
    organize: { title: 'Organize PDF pages', desc: 'Preview your pages, move them, rotate them or remove pages before exporting.', accept: '.pdf,application/pdf', multiple: false, label: 'Save organized PDF', min: 1, hint: 'One PDF file' },
    images: { title: 'Convert images to PDF', desc: 'Select JPG or PNG images. The order below determines the page order in your PDF.', accept: 'image/jpeg,image/png,.jpg,.jpeg,.png', multiple: true, label: 'Create PDF', min: 1, hint: 'JPG and PNG · Multiple images supported' },
    convert: { title: 'Convert PDF pages to images', desc: 'Render every page of your PDF as a PNG image and download the images individually.', accept: '.pdf,application/pdf', multiple: false, label: 'Convert to PNG', min: 1, hint: 'One PDF file' },
    compress: { title: 'Compress PDF', desc: 'Rasterize pages into a smaller image-based PDF. Text may no longer be selectable; choose quality carefully.', accept: '.pdf,application/pdf', multiple: false, label: 'Compress PDF', min: 1, hint: 'One PDF file' }
  };
  const formatBytes = (bytes) => bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(2) + ' MB';
  const safeName = (name) => name.replace(/\.pdf$/i, '').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') || 'document';
  const setStatus = (message, error = false) => { $('#status-message').textContent = message; $('#status-message').classList.toggle('text-danger', error); };
  const download = (bytes, name, type = 'application/pdf') => {
    const blob = new Blob([bytes], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  };
  const resultLink = (blob, name, label = 'Download file') => {
    const url = URL.createObjectURL(blob);
    const area = $('#result-area'); area.hidden = false; area.replaceChildren();
    const icon = document.createElement('i'); icon.className = 'fa-solid fa-circle-check me-2';
    const link = document.createElement('a'); link.className = 'result-download'; link.href = url; link.download = name; link.textContent = label;
    area.append(icon, link);
    const note = document.createElement('div'); note.className = 'small text-secondary mt-1'; note.textContent = name + ' · ' + formatBytes(blob.size);
    area.append(note);
  };
  const resetResult = () => { $('#result-area').hidden = true; $('#result-area').replaceChildren(); };
  const clearFiles = () => { state.files = []; state.pages = []; state.pdfBytes = null; $('#file-list').replaceChildren(); const organizer = $('#page-organizer'); if (organizer) organizer.remove(); resetResult(); };
  const renderFiles = () => {
    const list = $('#file-list'); list.replaceChildren();
    state.files.forEach((file, index) => {
      const row = document.createElement('div'); row.className = 'file-row';
      const symbol = document.createElement('i'); symbol.className = 'fa-solid ' + (file.type.startsWith('image/') ? 'fa-image' : 'fa-file-pdf') + ' file-symbol';
      const info = document.createElement('div'); info.className = 'file-info';
      const name = document.createElement('div'); name.className = 'file-name'; name.textContent = file.name;
      const meta = document.createElement('div'); meta.className = 'file-meta'; meta.textContent = formatBytes(file.size);
      info.append(name, meta);
      const actions = document.createElement('div'); actions.className = 'file-actions';
      if (state.tool === 'merge' || state.tool === 'images') {
        [[ 'fa-arrow-up', -1, 'Move up' ], [ 'fa-arrow-down', 1, 'Move down' ]].forEach(([icon, delta, label]) => {
          const button = document.createElement('button'); button.type = 'button'; button.title = label; button.setAttribute('aria-label', label);
          button.innerHTML = '<i class="fa-solid ' + icon + '"></i>'; button.disabled = index + delta < 0 || index + delta >= state.files.length;
          button.addEventListener('click', () => { const target = index + delta; [state.files[index], state.files[target]] = [state.files[target], state.files[index]]; renderFiles(); });
          actions.append(button);
        });
      }
      const remove = document.createElement('button'); remove.type = 'button'; remove.title = 'Remove file'; remove.setAttribute('aria-label', 'Remove ' + file.name); remove.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      remove.addEventListener('click', () => { state.files.splice(index, 1); renderFiles(); resetResult(); });
      actions.append(remove); row.append(symbol, info, actions); list.append(row);
    });
    if (state.tool === 'organize' && state.pages.length) renderPages();
  };
  const renderPages = () => {
    const container = document.createElement('div'); container.className = 'page-list mt-3';
    state.pages.forEach((page, index) => {
      const card = document.createElement('div'); card.className = 'page-card';
      if (page.preview) { const canvas = document.createElement('canvas'); canvas.width = page.preview.width; canvas.height = page.preview.height; canvas.getContext('2d').drawImage(page.preview, 0, 0); card.append(canvas); }
      const label = document.createElement('div'); label.className = 'page-label'; label.textContent = 'Page ' + (page.original + 1);
      const controls = document.createElement('div'); controls.className = 'page-controls';
      const actions = [
        ['fa-arrow-left', 'Move earlier', index === 0, () => { [state.pages[index - 1], state.pages[index]] = [state.pages[index], state.pages[index - 1]]; renderPages(); }],
        ['fa-arrow-right', 'Move later', index === state.pages.length - 1, () => { [state.pages[index + 1], state.pages[index]] = [state.pages[index], state.pages[index + 1]]; renderPages(); }],
        ['fa-rotate-right', 'Rotate 90 degrees', false, () => { page.rotation = (page.rotation + 90) % 360; renderPages(); }],
        ['fa-trash', 'Remove page', false, () => { state.pages.splice(index, 1); renderPages(); }]
      ];
      actions.forEach(([icon, title, disabled, action]) => { const button = document.createElement('button'); button.type = 'button'; button.title = title; button.setAttribute('aria-label', title); button.disabled = disabled; button.innerHTML = '<i class="fa-solid ' + icon + '"></i>'; button.addEventListener('click', action); controls.append(button); });
      card.append(label, controls); container.append(card);
    });
    const old = $('#page-organizer'); if (old) old.replaceWith(container); else $('#file-list').after(container);
    container.id = 'page-organizer';
  };
  const updateTool = (tool) => {
    state.tool = tool; clearFiles();
    const config = configs[tool];
    document.querySelectorAll('.tool-card').forEach((card) => card.classList.toggle('active', card.dataset.tool === tool));
    $('#tool-heading').textContent = config.title; $('#tool-description').textContent = config.desc;
    $('#drop-title').textContent = tool === 'images' ? 'Choose JPG or PNG images' : 'Choose ' + (config.multiple ? 'files' : 'a file');
    $('#drop-subtitle').textContent = 'or drag and drop ' + (config.multiple ? 'them' : 'it') + ' here';
    $('#accepted-types').textContent = config.hint; $('#file-input').accept = config.accept; $('#file-input').multiple = config.multiple;
    $('#run-label').textContent = config.label; $('#run-tool').disabled = false;
    const options = $('#tool-options'); options.replaceChildren();
    if (tool === 'split') {
      const label = document.createElement('label'); label.className = 'form-label fw-semibold'; label.htmlFor = 'page-ranges'; label.textContent = 'Pages to extract';
      const input = document.createElement('input'); input.className = 'form-control mb-3'; input.id = 'page-ranges'; input.placeholder = 'e.g. 1, 3-5, 8'; input.value = '';
      options.append(label, input);
    }
    if (tool === 'compress') {
      const label = document.createElement('label'); label.className = 'form-label fw-semibold'; label.htmlFor = 'quality-range'; label.textContent = 'Image quality: ';
      const value = document.createElement('strong'); value.id = 'quality-value'; value.textContent = '65%'; label.append(value);
      const range = document.createElement('input'); range.type = 'range'; range.className = 'form-range mb-3'; range.id = 'quality-range'; range.min = '25'; range.max = '90'; range.value = '65';
      range.addEventListener('input', () => { value.textContent = range.value + '%'; }); options.append(label, range);
    }
    setStatus('Ready when you are.');
  };
  const readPdf = async (file) => PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
  const parseRanges = (value, count) => {
    if (!value.trim()) throw new Error('Enter page numbers or ranges, for example 1, 3-5.');
    const pages = new Set();
    value.split(',').forEach((part) => {
      const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!match) throw new Error('Invalid page range: ' + part.trim());
      const start = Number(match[1]), end = Number(match[2] || match[1]);
      if (start < 1 || end < start || end > count) throw new Error('Page range must be between 1 and ' + count + '.');
      for (let page = start; page <= end; page++) pages.add(page - 1);
    });
    return [...pages].sort((a, b) => a - b);
  };
  const runMerge = async () => {
    if (state.files.length < 2) throw new Error('Select at least two PDF files to merge.');
    const output = await PDFDocument.create();
    for (const file of state.files) { const source = await readPdf(file); const copied = await output.copyPages(source, source.getPageIndices()); copied.forEach((page) => output.addPage(page)); }
    const bytes = await output.save(); download(bytes, 'merged-document.pdf'); resultLink(new Blob([bytes], { type: 'application/pdf' }), 'merged-document.pdf', 'Download merged PDF');
  };
  const runSplit = async () => {
    if (!state.files[0]) throw new Error('Choose a PDF file first.');
    const source = await readPdf(state.files[0]); const indexes = parseRanges($('#page-ranges').value, source.getPageCount());
    const output = await PDFDocument.create(); const pages = await output.copyPages(source, indexes); pages.forEach((page) => output.addPage(page));
    const bytes = await output.save(); const name = safeName(state.files[0].name) + '-pages.pdf'; download(bytes, name); resultLink(new Blob([bytes], { type: 'application/pdf' }), name, 'Download extracted PDF');
  };
  const loadOrganizer = async (file) => {
    const bytes = await file.arrayBuffer(); state.pdfBytes = bytes;
    const pdf = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
    state.pages = [];
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number); const viewport = page.getViewport({ scale: .32 });
      const canvas = document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      state.pages.push({ original: number - 1, rotation: 0, preview: canvas });
    }
    renderPages();
  };
  const runOrganize = async () => {
    if (!state.pdfBytes || !state.pages.length) throw new Error('Choose a PDF with at least one page.');
    const source = await PDFDocument.load(state.pdfBytes); const output = await PDFDocument.create();
    const copied = await output.copyPages(source, state.pages.map((page) => page.original));
    copied.forEach((page, index) => { const rotation = (page.getRotation().angle + state.pages[index].rotation) % 360; page.setRotation(degrees(rotation)); output.addPage(page); });
    const bytes = await output.save(); const name = safeName(state.files[0].name) + '-organized.pdf'; download(bytes, name); resultLink(new Blob([bytes], { type: 'application/pdf' }), name, 'Download organized PDF');
  };
  const runImages = async () => {
    if (!state.files.length) throw new Error('Choose at least one JPG or PNG image.');
    const output = await PDFDocument.create();
    for (const file of state.files) {
      const bytes = await file.arrayBuffer(); const image = file.type === 'image/png' ? await output.embedPng(bytes) : await output.embedJpg(bytes);
      const page = output.addPage([image.width, image.height]); page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }
    const bytes = await output.save(); download(bytes, 'images.pdf'); resultLink(new Blob([bytes], { type: 'application/pdf' }), 'images.pdf', 'Download PDF');
  };
  const runConvert = async () => {
    if (!state.files[0]) throw new Error('Choose a PDF file first.');
    const pdf = await pdfjsLib.getDocument({ data: await state.files[0].arrayBuffer() }).promise;
    if (pdf.numPages > 100) throw new Error('For performance, convert PDFs with 100 pages or fewer at a time.');
    for (let number = 1; number <= pdf.numPages; number++) {
      setStatus('Rendering page ' + number + ' of ' + pdf.numPages + '…');
      const page = await pdf.getPage(number); const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = safeName(state.files[0].name) + '-page-' + number + '.png'; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 30000); canvas.width = 0; canvas.height = 0;
    }
    setStatus(pdf.numPages + ' page image(s) generated. Check your downloads.');
  };
  const runCompress = async () => {
    if (!state.files[0]) throw new Error('Choose a PDF file first.');
    const quality = Number($('#quality-range').value) / 100;
    const pdf = await pdfjsLib.getDocument({ data: await state.files[0].arrayBuffer() }).promise;
    if (pdf.numPages > 60) throw new Error('For performance, compress PDFs with 60 pages or fewer at a time.');
    const output = await PDFDocument.create();
    for (let number = 1; number <= pdf.numPages; number++) {
      setStatus('Optimizing page ' + number + ' of ' + pdf.numPages + '…');
      const page = await pdf.getPage(number); const viewport = page.getViewport({ scale: 1.35 });
      const canvas = document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality)); const image = await output.embedJpg(await blob.arrayBuffer());
      const outPage = output.addPage([image.width, image.height]); outPage.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height }); canvas.width = 0; canvas.height = 0;
    }
    const bytes = await output.save(); const name = safeName(state.files[0].name) + '-compressed.pdf'; download(bytes, name); resultLink(new Blob([bytes], { type: 'application/pdf' }), name, 'Download compressed PDF');
    setStatus('Finished. Compare the new file size with your original.');
  };
  const runTool = async () => {
    if (state.busy) return;
    state.busy = true; $('#run-tool').disabled = true; resetResult(); setStatus('Processing locally…');
    try {
      const actions = { merge: runMerge, split: runSplit, organize: runOrganize, images: runImages, convert: runConvert, compress: runCompress };
      await actions[state.tool](); if (!['convert', 'compress'].includes(state.tool)) setStatus('Done. Your original file remains unchanged.');
    } catch (error) { setStatus(error.message || 'Something went wrong while processing the file.', true); }
    finally { state.busy = false; $('#run-tool').disabled = false; }
  };

  document.querySelectorAll('.tool-card').forEach((card) => card.addEventListener('click', () => { updateTool(card.dataset.tool); $('#workspace').scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  $('#drop-zone').addEventListener('click', () => $('#file-input').click());
  $('#drop-zone').addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); $('#file-input').click(); } });
  $('#file-input').addEventListener('change', async (event) => {
    const selected = [...event.target.files]; event.target.value = '';
    const isImage = state.tool === 'images';
    const valid = selected.filter((file) => isImage ? ['image/jpeg', 'image/png'].includes(file.type) || /\\.(jpe?g|png)$/i.test(file.name) : file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
    if (valid.length !== selected.length) setStatus('Some files were skipped. Use PDF files or JPG/PNG images as required.', true);
    if (!valid.length) return;
    state.files = state.files.concat(valid); if (!configs[state.tool].multiple) state.files = [valid[0]];
    resetResult(); renderFiles();
    if (state.tool === 'organize') { try { await loadOrganizer(state.files[0]); setStatus(state.pages.length + ' pages loaded.'); } catch (error) { setStatus('Could not read this PDF: ' + error.message, true); } }
    else setStatus(state.files.length + ' file(s) selected.');
  });
  ['dragenter', 'dragover'].forEach((name) => $('#drop-zone').addEventListener(name, (event) => { event.preventDefault(); $('#drop-zone').classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach((name) => $('#drop-zone').addEventListener(name, (event) => { event.preventDefault(); $('#drop-zone').classList.remove('dragover'); }));
  $('#drop-zone').addEventListener('drop', (event) => {
    const files = [...event.dataTransfer.files]; const input = $('#file-input');
    const valid = files.filter((file) => state.tool === 'images' ? ['image/jpeg', 'image/png'].includes(file.type) || /\\.(jpe?g|png)$/i.test(file.name) : file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
    if (!valid.length) { setStatus('No supported files found.', true); return; }
    state.files = state.tool === 'images' || state.tool === 'merge' ? state.files.concat(valid) : [valid[0]];
    renderFiles(); resetResult();
    if (state.tool === 'organize') loadOrganizer(state.files[0]).then(() => setStatus(state.pages.length + ' pages loaded.')).catch((error) => setStatus(error.message, true));
    else setStatus(state.files.length + ' file(s) selected.');
  });
  $('#run-tool').addEventListener('click', runTool);
  $('#year').textContent = new Date().getFullYear();
  if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  updateTool('merge');
})();