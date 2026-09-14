/**
 * Writes the assembled specification to disk.
 *
 *   npm run spec:json   -> openapi.json
 *   npm run spec:yaml   -> openapi.yaml
 *
 * Useful for committing a snapshot, feeding openapi-generator, or uploading to
 * Postman / Stoplight / an API gateway.
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { buildOpenApiDocument, operationCount } from '../src/openapi';

const format = (process.argv[2] ?? 'json').toLowerCase();

if (!['json', 'yaml'].includes(format)) {
  console.error(`Unknown format "${format}". Use "json" or "yaml".`);
  process.exit(1);
}

const document = buildOpenApiDocument();
const outFile = path.resolve(process.cwd(), `openapi.${format}`);
const contents =
  format === 'json'
    ? `${JSON.stringify(document, null, 2)}\n`
    : YAML.stringify(document, { lineWidth: 0 });

fs.writeFileSync(outFile, contents, 'utf8');

console.log(
  `Wrote ${outFile} — ${operationCount()} operations, ` +
    `${Object.keys(document.paths).length} paths, ` +
    `${Object.keys(document.components?.schemas ?? {}).length} schemas.`,
);
