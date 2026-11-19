// state.js — everything the editor knows, in one plain object.
//
// Photos are the user's own images (plus the bundled samples), held only
// in memory as HTMLImageElements — nothing is uploaded anywhere. Each
// layout keeps its own panel assignments and per-panel framing (pan and
// zoom), so switching layouts never loses work.

import { LAYOUTS } from './layouts.js';

export const SIZES = {
  square: { label: 'Square · 1080 × 1080', width: 1080, height: 1080 },
  portrait: { label: 'Portrait · 1080 × 1350', width: 1080, height: 1350 },
  wide: { label: 'Wide · 1920 × 1080', width: 1920, height: 1080 },
};

export const GRADES = {
  sunset: { label: 'Sunset' },
  neon: { label: 'Neon' },
  noir: { label: 'Noir' },
};

function freshFraming() {
  return { panX: 0, panY: 0, zoom: 1 };
}

function freshLayoutState(panelCount) {
  return {
    photoIds: Array(panelCount).fill(null),
    framing: Array.from({ length: panelCount }, freshFraming),
  };
}

export const state = {
  photos: [], // { id, name, img }
  nextPhotoId: 1,
  layoutId: 'poster',
  layouts: Object.fromEntries(
    Object.entries(LAYOUTS).map(([id, layout]) => [id, freshLayoutState(layout.panels.length)]),
  ),
  selectedPanel: 0,
  gradeId: 'sunset',
  sizeId: 'wide',
  caption: 'LEONIDA HEAT',
  subtitle: 'VICE BEACH · EST. 2026',
};

export function currentLayout() {
  return LAYOUTS[state.layoutId];
}

export function currentPanels() {
  return state.layouts[state.layoutId];
}

export function addPhoto(name, img) {
  const photo = { id: state.nextPhotoId++, name, img };
  state.photos.push(photo);
  // Be helpful: fill the first empty panel of the current layout, and if
  // every panel is empty, fill them all with this first photo.
  const panels = currentPanels();
  const emptyAt = panels.photoIds.indexOf(null);
  if (emptyAt >= 0) panels.photoIds[emptyAt] = photo.id;
  if (state.photos.length === 1) panels.photoIds = panels.photoIds.map(() => photo.id);
  return photo;
}

export function photoById(id) {
  return state.photos.find((p) => p.id === id) ?? null;
}

export function assignPhotoToSelected(photoId) {
  currentPanels().photoIds[state.selectedPanel] = photoId;
}

export function setLayout(id) {
  state.layoutId = id;
  state.selectedPanel = 0;
}
