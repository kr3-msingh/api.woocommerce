import type { OpenAPIV3 } from 'openapi-types';

/**
 * WooCommerce authenticates REST calls with a consumer key/secret pair created
 * under WooCommerce > Settings > Advanced > REST API.
 *
 * - Over HTTPS: send them as HTTP Basic (`key` as username, `secret` as password).
 * - Over plain HTTP, or when a host strips the `Authorization` header: send them
 *   as `consumer_key` / `consumer_secret` query parameters (v1/v2 OAuth 1.0a is
 *   also supported by legacy namespaces but is out of scope here).
 */
export const securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {
  basicAuth: {
    type: 'http',
    scheme: 'basic',
    description:
      'HTTP Basic auth. Username = consumer key (`ck_...`), password = consumer secret (`cs_...`). Requires HTTPS.',
  },

  consumerKeyQuery: {
    type: 'apiKey',
    in: 'query',
    name: 'consumer_key',
    description:
      'Consumer key as a query parameter. Use together with `consumer_secret` when the `Authorization` header cannot be relied on.',
  },

  consumerSecretQuery: {
    type: 'apiKey',
    in: 'query',
    name: 'consumer_secret',
    description: 'Consumer secret as a query parameter. Pairs with `consumer_key`.',
  },
};

/** Document-level security: Basic, or the query-string key/secret pair. */
export const security: OpenAPIV3.SecurityRequirementObject[] = [
  { basicAuth: [] },
  { consumerKeyQuery: [], consumerSecretQuery: [] },
];
