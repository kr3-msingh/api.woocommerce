import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

/**
 * Load `.env` from the project root rather than `process.cwd()`.
 *
 * Passenger-based hosts (cPanel, Plesk) do not guarantee that the working
 * directory is the application root, so the default dotenv lookup can silently
 * find nothing while a correctly-placed `.env` sits right there. Resolving from
 * this file's location removes that failure mode; cwd is kept as a fallback for
 * unusual layouts. Real environment variables always win — dotenv never
 * overwrites them — so panel-configured variables take precedence.
 */
const envCandidates = [
  path.resolve(__dirname, '..', '.env'), // project root, from src/ or dist/
  path.resolve(process.cwd(), '.env'),
];

for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
}

const bool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value.trim() === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
};

const int = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const port = int(process.env.PORT, 3000);

/**
 * Static assets live at `public/` in the repo and are copied to `dist/public/`
 * by the build, so resolve whichever exists for the way we were started.
 */
const resolvePublicDir = (): string => {
  const candidates = [path.join(__dirname, 'public'), path.resolve(__dirname, '..', 'public')];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0]!;
};

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  isProduction: (process.env.NODE_ENV ?? 'development') === 'production',
  port,

  /** Public origin of THIS app, e.g. https://docs.example.com */
  publicBaseUrl: stripTrailingSlash(process.env.PUBLIC_BASE_URL ?? `http://localhost:${port}`),

  /** Absolute path to the static assets folder (works from src/ and dist/). */
  publicDir: resolvePublicDir(),

  woo: {
    /** WordPress site root, no trailing slash. */
    storeUrl: stripTrailingSlash(process.env.WOO_STORE_URL ?? ''),
    consumerKey: process.env.WOO_CONSUMER_KEY ?? '',
    consumerSecret: process.env.WOO_CONSUMER_SECRET ?? '',
    /** `wc/v3`, `wc/v2` or `wc/v1`. */
    apiVersion: (process.env.WOO_API_VERSION ?? 'wc/v3').replace(/^\/+|\/+$/g, ''),
    useQueryStringAuth: bool(process.env.WOO_USE_QUERY_STRING_AUTH, false),
    timeoutMs: int(process.env.WOO_TIMEOUT_MS, 20_000),
  },

  proxy: {
    enabled: bool(process.env.PROXY_ENABLED, true),
    allowWrites: bool(process.env.PROXY_ALLOW_WRITES, false),
    /** Path this app mounts the proxy on. */
    mountPath: '/api/wc',
  },

  rateLimit: {
    windowMs: int(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    max: int(process.env.RATE_LIMIT_MAX, 60),
  },

  corsOrigin: process.env.CORS_ORIGIN ?? '*',
} as const;

/** True when the proxy has everything it needs to reach a real store. */
export const wooCredentialsPresent = (): boolean =>
  Boolean(config.woo.storeUrl && config.woo.consumerKey && config.woo.consumerSecret);

/** Base URL of the upstream WooCommerce REST API, e.g. https://shop.test/wp-json/wc/v3 */
export const wooApiBaseUrl = (): string => `${config.woo.storeUrl}/wp-json/${config.woo.apiVersion}`;
