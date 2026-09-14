import type { OpenAPIV3 } from 'openapi-types';
import { config, wooApiBaseUrl, wooCredentialsPresent } from '../config';
import { info, tags } from './info';
import { paths } from './paths';
import { schemas } from './components/schemas';
import { parameters } from './components/parameters';
import { responses } from './components/responses';
import { security, securitySchemes } from './components/security';

/**
 * Builds the `servers` list.
 *
 * The first entry is this app's own gateway, which is what makes Swagger UI's
 * "Try it out" usable: the browser calls same-origin, and credentials are
 * attached server-side. Direct-to-store entries follow for copy/paste use in
 * curl, Postman or generated clients.
 */
const buildServers = (): OpenAPIV3.ServerObject[] => {
  const servers: OpenAPIV3.ServerObject[] = [];

  if (config.proxy.enabled) {
    servers.push({
      url: `${config.publicBaseUrl}${config.proxy.mountPath}`,
      description: wooCredentialsPresent()
        ? `Gateway on this host → ${config.woo.storeUrl} (credentials attached server-side${
            config.proxy.allowWrites ? '' : ', read-only'
          })`
        : 'Gateway on this host (no store configured — set WOO_STORE_URL and API keys in .env)',
    });
  }

  if (config.woo.storeUrl) {
    servers.push({
      url: wooApiBaseUrl(),
      description: 'The WooCommerce store directly (browser calls will be blocked by CORS)',
    });
  }

  servers.push({
    url: 'https://{store_domain}/wp-json/{api_version}',
    description: 'Any WooCommerce store',
    variables: {
      store_domain: {
        default: 'example.com',
        description: 'Domain of the WordPress site hosting WooCommerce.',
      },
      api_version: {
        default: 'wc/v3',
        enum: ['wc/v3', 'wc/v2', 'wc/v1'],
        description: 'REST namespace. `wc/v3` unless you are maintaining something old.',
      },
    },
  });

  return servers;
};

/** The assembled OpenAPI document. Rebuilt on demand so config changes are picked up in dev. */
export const buildOpenApiDocument = (): OpenAPIV3.Document => ({
  openapi: '3.0.3',
  info,
  externalDocs: {
    description: 'Official WooCommerce REST API documentation',
    url: 'https://woocommerce.github.io/woocommerce-rest-api-docs/',
  },
  servers: buildServers(),
  tags,
  security,
  paths: paths as OpenAPIV3.PathsObject,
  components: {
    schemas: schemas as Record<string, OpenAPIV3.SchemaObject>,
    parameters,
    responses,
    securitySchemes,
  },
});

/** Cached document for the hot path (`GET /openapi.json`). */
let cached: OpenAPIV3.Document | undefined;

export const openApiDocument = (): OpenAPIV3.Document => {
  if (!cached || !config.isProduction) cached = buildOpenApiDocument();
  return cached;
};

/** Rough operation count, used on the landing page and the health endpoint. */
export const operationCount = (): number => {
  const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
  return Object.values(paths).reduce(
    (total, item) => total + methods.filter((method) => item[method]).length,
    0,
  );
};
