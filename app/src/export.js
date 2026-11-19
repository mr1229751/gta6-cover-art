// export.js — turns the current cover into a downloadable PNG.
//
// The export renders the very same drawCover the preview uses, on an
// off-screen canvas at the exact post size the user picked (1080×1080,
// 1080×1350 or 1920×1080), then saves it through a temporary anchor
// download. The photo never leaves the machine: the PNG is built locally
// from the in-memory image.

import { drawCover } from './render.js';
import { SIZES } from './state.js';

export function renderToCanvas(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas.getContext('2d'), state, width, height, { forExport: true });
  return canvas;
}

export function exportPng(state) {
  const { width, height } = SIZES[state.sizeId];
  const canvas = renderToCanvas(state, width, height);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = (state.caption || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
    a.href = url;
    a.download = `leonida-posters-${slug}-${width}x${height}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, 'image/png');
}
