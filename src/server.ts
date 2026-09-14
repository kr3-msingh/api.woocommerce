import path from 'node:path';
import type { Server } from 'node:http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { config, wooApiBaseUrl, wooCredentialsPresent } from './config';
import { docsRouter } from './routes/docs';
import { healthRouter } from './routes/health';
import { proxyRouter } from './routes/proxy';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { operationCount } from './openapi';

export const createApp = (): express.Express => {
  const app = express();

  // Correct client IPs behind cPanel/Passenger, Render, Railway, nginx, etc.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      // Swagger UI injects inline styles and evaluates its own bundle; the
      // default CSP blocks both, so it is relaxed just enough for the explorer.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", ...(config.woo.storeUrl ? [config.woo.storeUrl] : [])],
          objectSrc: ["'none'"],
          frameAncestors: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    cors({
      origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((o) => o.trim()),
      exposedHeaders: ['X-WP-Total', 'X-WP-TotalPages', 'Link'],
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  app.use(healthRouter());
  app.use(docsRouter());

  if (config.proxy.enabled) {
    app.use(config.proxy.mountPath, proxyRouter());
  }

  // Landing page and its assets.
  app.use(express.static(config.publicDir, { extensions: ['html'], maxAge: '1h' }));
  app.get('/', (_req, res) => {
    res.sendFile(path.join(config.publicDir, 'index.html'));
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

const banner = (): string => {
  const lines = [
    '',
    '  WooCommerce REST API — OpenAPI explorer',
    '  ' + '-'.repeat(44),
    `  Landing page   ${config.publicBaseUrl}/`,
    `  Swagger UI     ${config.publicBaseUrl}/docs`,
    `  Spec (JSON)    ${config.publicBaseUrl}/openapi.json`,
    `  Spec (YAML)    ${config.publicBaseUrl}/openapi.yaml`,
    `  Health         ${config.publicBaseUrl}/healthz`,
    `  Operations     ${operationCount()} documented`,
    '',
  ];

  if (!config.proxy.enabled) {
    lines.push('  Gateway        disabled (PROXY_ENABLED=false) — docs only');
  } else if (wooCredentialsPresent()) {
    lines.push(
      `  Gateway        ${config.publicBaseUrl}${config.proxy.mountPath} -> ${wooApiBaseUrl()}`,
      `  Writes         ${config.proxy.allowWrites ? 'ENABLED — this can modify a real store' : 'blocked (read-only)'}`,
    );
  } else {
    lines.push(
      '  Gateway        no store configured — "Try it out" will return 503.',
      '                 Copy .env.example to .env and fill in WOO_STORE_URL + API keys.',
    );
  }

  lines.push('');
  return lines.join('\n');
};

/**
 * Boots the HTTP server. Exported so Passenger-style hosts (which `require()`
 * a startup file rather than running `npm start`) can call it from app.js.
 */
export const start = (): Server => {
  const app = createApp();
  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(banner());
  });

  const shutdown = (signal: string): void => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received, closing server.`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return server;
};

// Listen when executed directly (`node dist/server.js`, `npm start`, tsx).
// When required as a module — tests, or app.js — the caller decides.
if (require.main === module) {
  start();
}
