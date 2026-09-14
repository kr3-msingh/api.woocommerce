import type { ErrorRequestHandler, RequestHandler } from 'express';
import { config } from '../config';

/** 404 in the same envelope shape WooCommerce itself uses. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    code: 'rest_no_route',
    message: `No route was found matching ${req.method} ${req.path}. Try /docs for the API explorer.`,
    data: { status: 404 },
  });
};

/** Terminal error handler. Keeps stack traces out of production responses. */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const status = typeof error?.status === 'number' ? error.status : 500;

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', error);
  }

  const isJsonParseError = error instanceof SyntaxError && 'body' in error;

  res.status(isJsonParseError ? 400 : status).json({
    code: isJsonParseError ? 'rest_invalid_json' : 'internal_server_error',
    message: isJsonParseError
      ? 'Request body could not be parsed as JSON.'
      : (error?.message ?? 'Unexpected error.'),
    data: {
      status: isJsonParseError ? 400 : status,
      ...(config.isProduction ? {} : { stack: error?.stack }),
    },
  });
};
