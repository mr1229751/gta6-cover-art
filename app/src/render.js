// render.js — the cover drawing engine.
//
// One function, drawCover, paints a complete cover onto any 2D context at
// any size. The editor preview and the PNG export both call it, so what
// you see while editing is exactly what gets exported. The painting order
// is: panel photos (clipped to their angled polygons) → colour grade →
// legibility bands → caption lettering → subtitle → monogram → frame.

import { LAYOUTS, insetPanel } from './layouts.js';
import { photoById } from './state.js';

const INK = '#0d0817'; // gutter / frame ink, a near-black violet

function tracePath(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
}

function drawPanelPhoto(ctx, img, poly, framing, width, height) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const bx = Math.min(...xs);
  const by = Math.min(...ys);
  const bw = Math.max(...xs) - bx;
  const bh = Math.max(...ys) - by;

  ctx.save();
  tracePath(ctx, poly);
  ctx.clip();
  if (img) {
    // Cover-fit the photo into the panel's bounding box, then apply the
    // panel's own zoom and pan (pan is stored as a fraction of the box).
    const scale = Math.max(bw / img.naturalWidth, bh / img.naturalHeight) * framing.zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = bx + (bw - dw) / 2 + framing.panX * bw;
    const dy = by + (bh - dh) / 2 + framing.panY * bh;
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    // No photo yet: a dusk gradient keeps the poster composed.
    const g = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
    g.addColorStop(0, '#3b1d5e');
    g.addColorStop(0.55, '#8a2a6b');
    g.addColorStop(1, '#e2693a');
    ctx.fillStyle = g;
    ctx.fillRect(bx, by, bw, bh);
  }
  ctx.restore();
}

function paintPhotos(state, width, height) {
  const scene = document.createElement('canvas');
  scene.width = width;
  scene.height = height;
  const sctx = scene.getContext('2d');
  sctx.fillStyle = INK;
  sctx.fillRect(0, 0, width, height);

  const layout = LAYOUTS[state.layoutId];
  const panels = state.layouts[state.layoutId];
  const gutter = Math.max(3, width * 0.006);
  layout.panels.forEach((panel, i) => {
    const poly = insetPanel(panel, gutter, width, height);
    const photo = panels.photoIds[i] != null ? photoById(panels.photoIds[i]) : null;
    drawPanelPhoto(sctx, photo ? photo.img : null, poly, panels.framing[i], width, height);
  });
  return scene;
}

function applyGrade(ctx, gradeId, width, height) {
  const wash = (stops, mode, alpha) => {
    const g = ctx.createLinearGradient(0, 0, 0, height);
    for (const [at, color] of stops) g.addColorStop(at, color);
    ctx.save();
    ctx.globalCompositeOperation = mode;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  };
  if (gradeId === 'sunset') {
    wash([[0, '#ff9a3c'], [0.55, '#ff2e88'], [1, '#2a0a44']], 'soft-light', 0.9);
    wash([[0, '#ffd23f'], [1, '#ff5e3a']], 'overlay', 0.28);
  } else if (gradeId === 'neon') {
    wash([[0, '#00e5ff'], [0.5, '#7a5cff'], [1, '#ff00c8']], 'soft-light', 0.95);
    wash([[0, '#00fff2'], [1, '#ff2ea6']], 'overlay', 0.22);
  } else {
    // noir: a silver top light and crushed shadows over the grey scene.
    wash([[0, '#ffffff'], [0.4, '#8a8a8a'], [1, '#000000']], 'soft-light', 0.55);
    wash([[0, 'rgba(0,0,0,0)'], [1, '#000000']], 'source-over', 0.35);
  }
  // A gentle vignette finishes every grade.
  const v = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.42,
    width / 2, height / 2, Math.max(width, height) * 0.78,
  );
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(5,2,12,0.42)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, width, height);
}

function legibilityBands(ctx, width, height) {
  const top = ctx.createLinearGradient(0, 0, 0, height * 0.3);
  top.addColorStop(0, 'rgba(8,3,18,0.62)');
  top.addColorStop(1, 'rgba(8,3,18,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, width, height * 0.3);
  const bottom = ctx.createLinearGradient(0, height * 0.78, 0, height);
  bottom.addColorStop(0, 'rgba(8,3,18,0)');
  bottom.addColorStop(1, 'rgba(8,3,18,0.55)');
  ctx.fillStyle = bottom;
  ctx.fillRect(0, height * 0.78, width, height * 0.22);
}

function drawLettering(ctx, state, width, height) {
  const caption = (state.caption || '').toUpperCase();
  if (caption) {
    let size = height * 0.135;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const setFont = () => {
      ctx.font = `${size}px Anton, "Arial Narrow Bold", Impact, sans-serif`;
      try { ctx.letterSpacing = `${Math.max(0, size * 0.015)}px`; } catch { /* older engines */ }
    };
    setFont();
    while (ctx.measureText(caption).width > width * 0.92 && size > 12) {
      size *= 0.94;
      setFont();
    }
    const x = width / 2;
    const y = height * 0.038;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#170a28';
    ctx.lineWidth = size * 0.11;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = size * 0.1;
    ctx.shadowOffsetY = size * 0.05;
    ctx.strokeText(caption, x, y);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    const fill = ctx.createLinearGradient(0, y, 0, y + size);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(0.62, '#ffe9c4');
    fill.addColorStop(1, '#ffb35c');
    ctx.fillStyle = fill;
    ctx.fillText(caption, x, y);
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  }

  const subtitle = (state.subtitle || '').toUpperCase();
  if (subtitle) {
    const size = height * 0.03;
    ctx.font = `${size}px Anton, "Arial Narrow Bold", Impact, sans-serif`;
    try { ctx.letterSpacing = `${size * 0.34}px`; } catch { /* ignore */ }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.3;
    ctx.fillStyle = '#fdf6ec';
    ctx.fillText(subtitle, width / 2, height * 0.955);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  }
}

function drawMonogram(ctx, width, height) {
  // The maker's own roundel: LP for Leonida Posters. Original artwork,
  // drawn here — no badge or mark borrowed from any game.
  const r = height * 0.042;
  const cx = width - r - width * 0.022;
  const cy = height - r - height * 0.022;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(13,8,23,0.78)';
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.09);
  ctx.strokeStyle = '#ffd23f';
  ctx.stroke();
  ctx.font = `${r * 0.92}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd23f';
  ctx.fillText('LP', cx, cy + r * 0.05);
  ctx.restore();
}

export function drawCover(ctx, state, width, height, options = {}) {
  const scene = paintPhotos(state, width, height);
  if (state.gradeId === 'noir') {
    ctx.save();
    ctx.filter = 'grayscale(1) contrast(1.16) brightness(0.99)';
    ctx.drawImage(scene, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(scene, 0, 0);
  }
  applyGrade(ctx, state.gradeId, width, height);
  legibilityBands(ctx, width, height);
  drawLettering(ctx, state, width, height);
  drawMonogram(ctx, width, height);

  // The poster's thin frame.
  ctx.strokeStyle = 'rgba(253,246,236,0.9)';
  ctx.lineWidth = Math.max(2, width * 0.0026);
  const inset = ctx.lineWidth * 1.6;
  ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

  // In the editor only, outline the panel being framed.
  if (!options.forExport && options.selectedPanel != null) {
    const layout = LAYOUTS[state.layoutId];
    const poly = insetPanel(layout.panels[options.selectedPanel], Math.max(3, width * 0.006), width, height);
    ctx.save();
    tracePath(ctx, poly);
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = Math.max(2, width * 0.004);
    ctx.setLineDash([width * 0.012, width * 0.008]);
    ctx.stroke();
    ctx.restore();
  }
}
