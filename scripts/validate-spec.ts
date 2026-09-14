/**
 * Structural checks on the assembled specification.
 *
 * Deliberately dependency-free: it catches the mistakes that actually happen
 * when a spec is hand-assembled — dangling $refs, duplicate operationIds,
 * operations missing responses, path parameters that are declared but never
 * used (or used but never declared).
 *
 *   npm run spec:validate
 */
import { buildOpenApiDocument } from '../src/openapi';

type Json = Record<string, unknown>;

const document = buildOpenApiDocument() as unknown as Json;
const errors: string[] = [];
const warnings: string[] = [];

/** Walk every node, collecting `$ref` targets with the path we found them at. */
const collectRefs = (node: unknown, trail: string[] = []): Array<[string, string]> => {
  if (Array.isArray(node)) {
    return node.flatMap((child, i) => collectRefs(child, [...trail, String(i)]));
  }
  if (node && typeof node === 'object') {
    const entries = Object.entries(node as Json);
    const here = entries
      .filter(([key, value]) => key === '$ref' && typeof value === 'string')
      .map(([, value]) => [value as string, trail.join('.')] as [string, string]);
    return [
      ...here,
      ...entries
        .filter(([key]) => key !== '$ref')
        .flatMap(([key, value]) => collectRefs(value, [...trail, key])),
    ];
  }
  return [];
};

const resolve = (pointer: string): unknown => {
  if (!pointer.startsWith('#/')) return undefined;
  return pointer
    .slice(2)
    .split('/')
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce<unknown>(
      (node, segment) =>
        node && typeof node === 'object' ? (node as Json)[segment] : undefined,
      document,
    );
};

// 1. every $ref resolves
for (const [pointer, where] of collectRefs(document)) {
  if (resolve(pointer) === undefined) {
    errors.push(`Dangling $ref "${pointer}" at ${where || '<root>'}`);
  }
}

// 2. operationIds are present and unique; operations declare responses
const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;
const seenOperationIds = new Map<string, string>();
const paths = document.paths as Record<string, Json>;

for (const [route, item] of Object.entries(paths)) {
  const declared = new Set<string>(
    [...route.matchAll(/\{([^}]+)\}/g)].map((match) => match[1] as string),
  );
  const used = new Set<string>();

  const scanParams = (params: unknown): void => {
    if (!Array.isArray(params)) return;
    for (const param of params) {
      const p = param as Json;
      if (typeof p.$ref === 'string') {
        const resolved = resolve(p.$ref) as Json | undefined;
        if (resolved?.in === 'path' && typeof resolved.name === 'string') used.add(resolved.name);
      } else if (p.in === 'path' && typeof p.name === 'string') {
        used.add(p.name);
      }
    }
  };

  scanParams(item.parameters);

  let operations = 0;
  for (const method of METHODS) {
    const operation = item[method] as Json | undefined;
    if (!operation) continue;
    operations += 1;
    scanParams(operation.parameters);

    const operationId = operation.operationId as string | undefined;
    if (!operationId) {
      errors.push(`Missing operationId: ${method.toUpperCase()} ${route}`);
    } else if (seenOperationIds.has(operationId)) {
      errors.push(
        `Duplicate operationId "${operationId}": ${method.toUpperCase()} ${route} and ${seenOperationIds.get(operationId)}`,
      );
    } else {
      seenOperationIds.set(operationId, `${method.toUpperCase()} ${route}`);
    }

    if (!operation.responses || Object.keys(operation.responses as Json).length === 0) {
      errors.push(`No responses declared: ${method.toUpperCase()} ${route}`);
    }
    if (!operation.summary) warnings.push(`No summary: ${method.toUpperCase()} ${route}`);
    if (!Array.isArray(operation.tags) || operation.tags.length === 0) {
      warnings.push(`No tags: ${method.toUpperCase()} ${route}`);
    }
  }

  if (operations === 0) errors.push(`Path has no operations: ${route}`);

  for (const name of declared) {
    if (!used.has(name)) errors.push(`Path parameter "{${name}}" is never declared on ${route}`);
  }
  for (const name of used) {
    if (!declared.has(name)) {
      errors.push(`Parameter "${name}" is declared as in:path but "${route}" has no {${name}}`);
    }
  }
}

// 3. every tag used by an operation is described at the document level
const describedTags = new Set(
  ((document.tags as Array<Json>) ?? []).map((tag) => tag.name as string),
);
for (const [route, item] of Object.entries(paths)) {
  for (const method of METHODS) {
    const operation = item[method] as Json | undefined;
    for (const tag of (operation?.tags as string[]) ?? []) {
      if (!describedTags.has(tag)) {
        warnings.push(`Tag "${tag}" (${method.toUpperCase()} ${route}) has no top-level description`);
      }
    }
  }
}

// 4. every declared component is actually referenced somewhere
const allRefs = new Set(collectRefs(document).map(([pointer]) => pointer));
for (const section of ['schemas', 'parameters', 'responses'] as const) {
  const components = ((document.components as Json)?.[section] ?? {}) as Json;
  for (const name of Object.keys(components)) {
    if (!allRefs.has(`#/components/${section}/${name}`)) {
      warnings.push(`Unused component: #/components/${section}/${name}`);
    }
  }
}

const label = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

console.log(
  `Checked ${label(Object.keys(paths).length, 'path')}, ` +
    `${label(seenOperationIds.size, 'operation')}, ` +
    `${label(allRefs.size, 'reference')}.`,
);

if (warnings.length > 0) {
  console.log(`\n${label(warnings.length, 'warning')}:`);
  for (const warning of warnings) console.log(`  · ${warning}`);
}

if (errors.length > 0) {
  console.error(`\n${label(errors.length, 'error')}:`);
  for (const error of errors) console.error(`  ✗ ${error}`);
  process.exit(1);
}

console.log('\nSpecification is structurally valid.');
