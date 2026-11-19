// main.js — boots the cover maker.
//
// Waits for the Anton display face (and every other declared font) before
// the first paint, so the caption never flashes in a fallback font, then
// hands over to the editor. If the font file cannot load, the editor
// still starts — the lettering just falls back to a heavy system sans.

import { initEditor } from './editor.js';

async function boot() {
  try {
    await Promise.race([
      document.fonts.load('100px Anton'),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
    await document.fonts.ready;
  } catch {
    // Fall through: a fallback face is better than a blank page.
  }
  initEditor();
}

boot();
