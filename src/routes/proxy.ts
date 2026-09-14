import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { config, wooApiBaseUrl, wooCredentialsPresent } from '../config';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Upstream headers worth surfacing to the caller. */
const PASSTHROUGH_HEADERS = [
  'content-type',
  'x-wp-total',
  'x-wp-totalpages',
  'link',
  'allow',
  'retry-after',
];

const fail = (res: Response, status: number, code: string, message: string): void => {
  res.status(status).json({ code, message, data: { status } });
};

/**
 * Gateway that fronts the configured WooCommerce store.
 *
 * It exists for one reason: WooCommerce sends no CORS headers, so Swagger UI's
 * "Try it out" cannot call a store directly from the browser. Requests land
 * here same-origin, credentials are attached server-side, and the upstream
 * response is relayed back verbatim.
 *
 * Because it holds live API keys, it is deliberately conservative: read-only
 * unless PROXY_ALLOW_WRITES is set, rate limited, and it refuses to start
 * forwarding at all when no store is configured.
 */
export const proxyRouter = (): Router => {
  const router = Router();

  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      code: 'proxy_rate_limited',
      message: 'Too many requests. Slow down and retry shortly.',
      data: { status: 429 },
    },
  });

  router.use(limiter);

  router.use((req, res, next) => {
    if (!wooCredentialsPresent()) {
      fail(
        res,
        503,
        'proxy_not_configured',
        'No WooCommerce store is configured on this gateway. Set WOO_STORE_URL, WOO_CONSUMER_KEY and WOO_CONSUMER_SECRET, then restart.',
      );
      return;
    }

    if (WRITE_METHODS.has(req.method) && !config.proxy.allowWrites) {
      fail(
        res,
        405,
        'proxy_read_only',
        'This gateway is running in read-only mode; POST, PUT, PATCH and DELETE are blocked. Set PROXY_ALLOW_WRITES=true to enable them.',
      );
      return;
    }

    next();
  });

  router.all(/.*/, async (req: Request, res: Response) => {
    const target = buildTargetUrl(req);
    if (!target) {
      fail(res, 400, 'proxy_invalid_path', 'The requested path is not a valid WooCommerce REST path.');
      return;
    }

    const headers: Record<string, string> = {
      accept: 'application/json',
      'user-agent': 'swagger-ui-woocommerce-gateway/1.0',
    };

    if (!config.woo.useQueryStringAuth) {
      const token = Buffer.from(
        `${config.woo.consumerKey}:${config.woo.consumerSecret}`,
        'utf8',
      ).toString('base64');
      headers.authorization = `Basic ${token}`;
    }

    const hasBody = !['GET', 'HEAD'].includes(req.method);
    let body: string | undefined;
    if (hasBody && req.body !== undefined && Object.keys(req.body as object).length > 0) {
      body = JSON.stringify(req.body);
      headers['content-type'] = 'application/json';
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.woo.timeoutMs);

    try {
      const upstream = await fetch(target, {
        method: req.method,
        headers,
        body,
        signal: controller.signal,
        redirect: 'follow',
      });

      for (const header of PASSTHROUGH_HEADERS) {
        const value = upstream.headers.get(header);
        if (value) res.setHeader(header, value);
      }

      const payload = Buffer.from(await upstream.arrayBuffer());
      res.status(upstream.status).send(payload);
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      fail(
        res,
        aborted ? 504 : 502,
        aborted ? 'proxy_upstream_timeout' : 'proxy_upstream_error',
        aborted
          ? `The WooCommerce store did not respond within ${config.woo.timeoutMs}ms.`
          : `Could not reach the WooCommerce store: ${(error as Error).message}`,
      );
    } finally {
      clearTimeout(timer);
    }
  });

  return router;
};

/**
 * Maps `/api/wc/products?per_page=5` onto
 * `https://store.example/wp-json/wc/v3/products?per_page=5`, adding query-string
 * credentials when the store needs them. Returns undefined for paths that try
 * to escape the WooCommerce namespace.
 */
const buildTargetUrl = (req: Request): string | undefined => {
  // req.url is relative to the mount point and always starts with "/".
  const [rawPath = '/', rawQuery = ''] = req.url.split('?');

  if (rawPath.includes('..') || rawPath.includes('//')) return undefined;

  let url: URL;
  try {
    url = new URL(`${wooApiBaseUrl()}${rawPath}`);
  } catch {
    return undefined;
  }

  // Refuse anything that has wandered outside the configured store or namespace.
  const expectedPrefix = new URL(wooApiBaseUrl()).pathname;
  if (!url.pathname.startsWith(expectedPrefix)) return undefined;

  const params = new URLSearchParams(rawQuery);
  // Never let a caller inject their own credentials through the gateway.
  params.delete('consumer_key');
  params.delete('consumer_secret');

  if (config.woo.useQueryStringAuth) {
    params.set('consumer_key', config.woo.consumerKey);
    params.set('consumer_secret', config.woo.consumerSecret);
  }

  url.search = params.toString();
  return url.toString();
};
