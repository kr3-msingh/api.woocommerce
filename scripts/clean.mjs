/**
 * Removes the build output.
 *
 * Replaces `rimraf`, which as of v6 requires Node 20+ and would otherwise be
 * the only thing in the tree that does — shared hosting still ships Node 18.
 * `fs.rmSync` has been stable since Node 14.14, so this needs no dependency.
 */
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(projectRoot, process.argv[2] ?? 'dist');

// Refuse to delete anything outside the project, whatever gets passed in.
if (!target.startsWith(projectRoot + '/')) {
  console.error(`Refusing to remove "${target}" — outside the project root.`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
