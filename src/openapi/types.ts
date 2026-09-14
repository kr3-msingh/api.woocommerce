import type { OpenAPIV3 } from 'openapi-types';

export type Schema = OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;
export type SchemaMap = Record<string, Schema>;
export type PathItem = OpenAPIV3.PathItemObject;
export type PathMap = Record<string, PathItem>;
export type Operation = OpenAPIV3.OperationObject;
export type Parameter = OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject;
export type Response = OpenAPIV3.ResponseObject | OpenAPIV3.ReferenceObject;
export type Document = OpenAPIV3.Document;

/** Shorthand for a `$ref` into `#/components/schemas`. */
export const ref = (name: string): OpenAPIV3.ReferenceObject => ({
  $ref: `#/components/schemas/${name}`,
});

/** Shorthand for a `$ref` into `#/components/parameters`. */
export const paramRef = (name: string): OpenAPIV3.ReferenceObject => ({
  $ref: `#/components/parameters/${name}`,
});

/** Shorthand for a `$ref` into `#/components/responses`. */
export const responseRef = (name: string): OpenAPIV3.ReferenceObject => ({
  $ref: `#/components/responses/${name}`,
});

/** `application/json` request body wrapper. */
export const jsonBody = (
  schema: Schema,
  description?: string,
  required = true,
): OpenAPIV3.RequestBodyObject => ({
  description,
  required,
  content: { 'application/json': { schema } },
});

/** `application/json` response wrapper. */
export const jsonResponse = (description: string, schema: Schema): OpenAPIV3.ResponseObject => ({
  description,
  content: { 'application/json': { schema } },
});

/** Array-of-schema response, the shape every WooCommerce list endpoint returns. */
export const jsonListResponse = (
  description: string,
  itemRef: string,
): OpenAPIV3.ResponseObject => ({
  description,
  headers: {
    'X-WP-Total': {
      description: 'Total number of resources matching the query, ignoring pagination.',
      schema: { type: 'integer', example: 137 },
    },
    'X-WP-TotalPages': {
      description: 'Total number of pages available for the current `per_page` value.',
      schema: { type: 'integer', example: 14 },
    },
    Link: {
      description: 'RFC 5988 pagination links (`rel="next"`, `rel="prev"`).',
      schema: { type: 'string' },
    },
  },
  content: { 'application/json': { schema: { type: 'array', items: ref(itemRef) } } },
});
