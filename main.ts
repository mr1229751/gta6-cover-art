// Leonida Posters — handover program for the gta6-cover-art-01 entry.
//
// The cover maker itself is a static web app living in app/ (plain HTML,
// CSS and ES modules, no build step). This small Node program is only the
// courier: when the grader runs it, it carries app/ and screenshots/ into
// the output directory and asks the vendored make.fun library to write the
// dossier that describes them. Nothing here touches the network, and two
// runs over the same repository produce byte-identical output.
//
// Locally, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });

// The app is handed in whole: every file under app/ is part of the entry.
cpSync(join(repoDir, 'app'), join(outDir, 'app'), { recursive: true });

// Screenshots ride along when the folder is present.
const shotsDir = join(repoDir, 'screenshots');
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
}

// The dossier is the library's own summary of what was just copied; the
// grader rebuilds it with the same library and compares byte for byte.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
