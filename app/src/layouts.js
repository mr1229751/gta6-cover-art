// layouts.js — the poster panel layouts.
//
// Each layout is a set of panels. A panel is a polygon given in normalised
// cover coordinates (0..1 on both axes), so the same layout works at the
// preview size and at every export size. The render engine clips each
// photo to its panel's polygon, shrunk a little toward the panel centroid
// so dark gutters show between panels, the way a printed game poster is
// divided into angled frames.

export const LAYOUTS = {
  poster: {
    label: 'Poster',
    panels: [
      // Tall hero panel down the left side.
      [[0.0, 0.0], [0.56, 0.0], [0.5, 0.78], [0.0, 0.78]],
      // Two stacked panels on the right.
      [[0.56, 0.0], [1.0, 0.0], [1.0, 0.42], [0.53, 0.38]],
      [[0.53, 0.38], [1.0, 0.42], [1.0, 0.78], [0.5, 0.78]],
      // One wide strip along the bottom.
      [[0.0, 0.78], [1.0, 0.78], [1.0, 1.0], [0.0, 1.0]],
    ],
  },
  quad: {
    label: 'Quad',
    panels: [
      [[0.0, 0.0], [0.52, 0.0], [0.48, 0.5], [0.0, 0.52]],
      [[0.52, 0.0], [1.0, 0.0], [1.0, 0.52], [0.48, 0.5]],
      [[0.0, 0.52], [0.48, 0.5], [0.52, 1.0], [0.0, 1.0]],
      [[0.48, 0.5], [1.0, 0.52], [1.0, 1.0], [0.52, 1.0]],
    ],
  },
  strips: {
    label: 'Strips',
    panels: [
      [[0.0, 0.0], [0.36, 0.0], [0.3, 1.0], [0.0, 1.0]],
      [[0.36, 0.0], [0.68, 0.0], [0.62, 1.0], [0.3, 1.0]],
      [[0.68, 0.0], [1.0, 0.0], [1.0, 1.0], [0.62, 1.0]],
    ],
  },
};

export function panelCentroid(panel) {
  let x = 0;
  let y = 0;
  for (const [px, py] of panel) {
    x += px;
    y += py;
  }
  return [x / panel.length, y / panel.length];
}

// Shrink a normalised polygon toward its centroid by `amount` (in pixels,
// converted per axis) so neighbouring panels leave a gutter between them.
export function insetPanel(panel, px, width, height) {
  const [cx, cy] = panelCentroid(panel);
  return panel.map(([x, y]) => {
    const dx = x * width - cx * width;
    const dy = y * height - cy * height;
    const len = Math.hypot(dx, dy) || 1;
    return [x * width - (dx / len) * px, y * height - (dy / len) * px];
  });
}

export function pointInPanel(panel, nx, ny) {
  // Ray-casting point-in-polygon test in normalised coordinates.
  let inside = false;
  for (let i = 0, j = panel.length - 1; i < panel.length; j = i++) {
    const [xi, yi] = panel[i];
    const [xj, yj] = panel[j];
    const crosses = yi > ny !== yj > ny && nx < ((xj - xi) * (ny - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}
