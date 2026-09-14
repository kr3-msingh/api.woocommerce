import type { OpenAPIV3 } from 'openapi-types';
import { ref } from '../types';

const errorResponse = (
  description: string,
  example: Record<string, unknown>,
): OpenAPIV3.ResponseObject => ({
  description,
  content: { 'application/json': { schema: ref('Error'), example } },
});

/** Reusable error responses referenced from every operation. */
export const responses: Record<string, OpenAPIV3.ResponseObject> = {
  BadRequest: errorResponse('Invalid or missing parameters.', {
    code: 'rest_invalid_param',
    message: 'Invalid parameter(s): per_page',
    data: { status: 400, params: { per_page: 'per_page must be between 1 and 100 (inclusive)' } },
  }),

  Unauthorized: errorResponse(
    'Authentication failed. The consumer key/secret was missing, malformed or rejected.',
    {
      code: 'woocommerce_rest_authentication_error',
      message: 'Consumer key is invalid.',
      data: { status: 401 },
    },
  ),

  Forbidden: errorResponse(
    'Authenticated, but the key’s permissions do not cover this operation (e.g. a read-only key attempting a write).',
    {
      code: 'woocommerce_rest_cannot_create',
      message: 'Sorry, you are not allowed to create resources.',
      data: { status: 403 },
    },
  ),

  NotFound: errorResponse('No resource matches the supplied identifier.', {
    code: 'woocommerce_rest_invalid_id',
    message: 'Invalid ID.',
    data: { status: 404 },
  }),

  MethodNotAllowed: errorResponse(
    'The demo proxy is running read-only. Set `PROXY_ALLOW_WRITES=true` to permit writes.',
    {
      code: 'proxy_read_only',
      message: 'This gateway is running in read-only mode; POST, PUT, PATCH and DELETE are blocked.',
      data: { status: 405 },
    },
  ),

  TooManyRequests: errorResponse('Rate limit exceeded for this gateway.', {
    code: 'proxy_rate_limited',
    message: 'Too many requests. Slow down and retry shortly.',
    data: { status: 429 },
  }),

  ServerError: errorResponse('Unexpected upstream or gateway failure.', {
    code: 'proxy_upstream_error',
    message: 'The WooCommerce store did not respond in time.',
    data: { status: 502 },
  }),
};
