/**
 * Copies `public/` into `dist/public/` after compilation.
 *
 * Hand-rolled rather than `fs.cpSync`, which is still flagged experimental on
 * Node 18 and prints an ExperimentalWarning on every build.
 */
import { mkdirSync, readdirSync, copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(projectRoot, 'public');
const to = join(projectRoot, 'dist', 'public');

if (!existsSync(from)) {
  console.error('No public/ directory to copy.');
  process.exit(1);
}

let files = 0;

const copyDir = (src, dest) => {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      copyFileSync(srcPath, destPath);
      files += 1;
    }
  }
};

copyDir(from, to);
console.log(`Copied ${files} asset${files === 1 ? '' : 's'} to dist/public.`);
