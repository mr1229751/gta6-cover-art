// editor.js — wires the controls to the state and the preview canvas.
//
// The flow is deliberately short: add photos (your own, or the bundled
// samples), click a panel, click a photo to drop it in, drag on the
// preview to frame it, type the caption, export. Every change repaints
// the preview through the same drawCover the export uses.

import { state, SIZES, GRADES, addPhoto, photoById, assignPhotoToSelected, currentPanels, setLayout } from './state.js';
import { LAYOUTS, pointInPanel } from './layouts.js';
import { drawCover } from './render.js';
import { exportPng } from './export.js';

const SAMPLES = [
  { name: 'Sample · Boulevard', src: 'samples/boulevard.jpg' },
  { name: 'Sample · Pier', src: 'samples/pier.jpg' },
  { name: 'Sample · Neon Street', src: 'samples/neon-street.jpg' },
  { name: 'Sample · Beach Highway', src: 'samples/beach-highway.jpg' },
];

let els = null;
let previewScale = 1;

export function refresh() {
  const canvas = els.canvas;
  const { width, height } = SIZES[state.sizeId];
  const longSide = 960;
  previewScale = longSide / Math.max(width, height);
  canvas.width = Math.round(width * previewScale);
  canvas.height = Math.round(height * previewScale);
  drawCover(canvas.getContext('2d'), state, canvas.width, canvas.height, {
    selectedPanel: state.selectedPanel,
  });
  renderTray();
  renderPanelChips();
  els.zoom.value = String(currentPanels().framing[state.selectedPanel].zoom);
}

function renderTray() {
  els.tray.innerHTML = '';
  if (state.photos.length === 0) {
    const hint = document.createElement('p');
    hint.className = 'tray-hint';
    hint.textContent = 'No photos yet — add your own or load the samples.';
    els.tray.appendChild(hint);
    return;
  }
  for (const photo of state.photos) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'tray-item';
    item.title = `${photo.name} — click to place in the selected panel`;
    const thumb = document.createElement('img');
    thumb.src = photo.img.src;
    thumb.alt = photo.name;
    item.appendChild(thumb);
    item.addEventListener('click', () => {
      assignPhotoToSelected(photo.id);
      refresh();
    });
    els.tray.appendChild(item);
  }
}

function renderPanelChips() {
  els.panels.innerHTML = '';
  const panels = currentPanels();
  LAYOUTS[state.layoutId].panels.forEach((_, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (i === state.selectedPanel ? ' active' : '');
    const photo = panels.photoIds[i] != null ? photoById(panels.photoIds[i]) : null;
    chip.textContent = `Panel ${i + 1}${photo ? '' : ' · empty'}`;
    chip.addEventListener('click', () => {
      state.selectedPanel = i;
      refresh();
    });
    els.panels.appendChild(chip);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function addFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
    const img = await loadImage(dataUrl);
    addPhoto(file.name, img);
  }
  refresh();
}

async function loadSamples() {
  for (const sample of SAMPLES) {
    if (state.photos.some((p) => p.name === sample.name)) continue;
    try {
      const img = await loadImage(sample.src);
      addPhoto(sample.name, img);
    } catch {
      // A missing sample is skipped quietly; the app still works.
    }
  }
  refresh();
}

function canvasPoint(evt) {
  const rect = els.canvas.getBoundingClientRect();
  return [
    (evt.clientX - rect.left) / rect.width,
    (evt.clientY - rect.top) / rect.height,
  ];
}

function bindCanvas() {
  let drag = null;
  els.canvas.addEventListener('pointerdown', (evt) => {
    const [nx, ny] = canvasPoint(evt);
    const layout = LAYOUTS[state.layoutId];
    const hit = layout.panels.findIndex((panel) => pointInPanel(panel, nx, ny));
    if (hit >= 0) state.selectedPanel = hit;
    drag = { x: evt.clientX, y: evt.clientY, moved: false };
    els.canvas.setPointerCapture(evt.pointerId);
    refresh();
  });
  els.canvas.addEventListener('pointermove', (evt) => {
    if (!drag) return;
    const dx = evt.clientX - drag.x;
    const dy = evt.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
    if (drag.moved) {
      const rect = els.canvas.getBoundingClientRect();
      const framing = currentPanels().framing[state.selectedPanel];
      framing.panX = clamp(framing.panX + dx / rect.width, -0.6, 0.6);
      framing.panY = clamp(framing.panY + dy / rect.height, -0.6, 0.6);
      drag.x = evt.clientX;
      drag.y = evt.clientY;
      refresh();
    }
  });
  els.canvas.addEventListener('pointerup', () => {
    drag = null;
  });
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

export function initEditor() {
  els = {
    canvas: document.getElementById('preview'),
    tray: document.getElementById('tray'),
    panels: document.getElementById('panels'),
    fileInput: document.getElementById('file-input'),
    addPhotos: document.getElementById('add-photos'),
    loadSamples: document.getElementById('load-samples'),
    caption: document.getElementById('caption'),
    subtitle: document.getElementById('subtitle'),
    layout: document.getElementById('layout'),
    grade: document.getElementById('grade'),
    size: document.getElementById('size'),
    zoom: document.getElementById('zoom'),
    fillAll: document.getElementById('fill-all'),
    exportBtn: document.getElementById('export'),
    present: document.getElementById('present'),
  };

  els.addPhotos.addEventListener('click', () => els.fileInput.click());
  els.fileInput.addEventListener('change', () => {
    addFiles([...els.fileInput.files]);
    els.fileInput.value = '';
  });
  els.loadSamples.addEventListener('click', loadSamples);
  els.caption.addEventListener('input', () => {
    state.caption = els.caption.value;
    refresh();
  });
  els.subtitle.addEventListener('input', () => {
    state.subtitle = els.subtitle.value;
    refresh();
  });
  els.layout.addEventListener('change', () => {
    setLayout(els.layout.value);
    refresh();
  });
  els.grade.addEventListener('change', () => {
    state.gradeId = els.grade.value;
    refresh();
  });
  els.size.addEventListener('change', () => {
    state.sizeId = els.size.value;
    refresh();
  });
  els.zoom.addEventListener('input', () => {
    currentPanels().framing[state.selectedPanel].zoom = Number(els.zoom.value);
    refresh();
  });
  els.fillAll.addEventListener('click', () => {
    const panels = currentPanels();
    const first = panels.photoIds[state.selectedPanel] ?? state.photos[0]?.id;
    if (first != null) {
      panels.photoIds = panels.photoIds.map(() => first);
      refresh();
    }
  });
  els.exportBtn.addEventListener('click', () => exportPng(state));
  els.present.addEventListener('click', () => {
    document.body.classList.toggle('presenting');
    refresh();
  });
  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape') {
      document.body.classList.remove('presenting');
      refresh();
    }
  });
  window.addEventListener('resize', refresh);
  bindCanvas();
  refresh();
}
