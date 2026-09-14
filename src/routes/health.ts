import { Router } from 'express';
import { config, wooApiBaseUrl, wooCredentialsPresent } from '../config';
import { operationCount } from '../openapi';

export const healthRouter = (): Router => {
  const router = Router();

  router.get('/healthz', (_req, res) => {
    res.json({
      status: 'ok',
      uptime_seconds: Math.round(process.uptime()),
      version: '3.0.0',
      node: process.version,
      environment: config.env,
      spec: {
        openapi: '3.0.3',
        operations: operationCount(),
        json: `${config.publicBaseUrl}/openapi.json`,
        yaml: `${config.publicBaseUrl}/openapi.yaml`,
      },
      gateway: {
        enabled: config.proxy.enabled,
        configured: wooCredentialsPresent(),
        writes_allowed: config.proxy.allowWrites,
        mount: config.proxy.mountPath,
        upstream: wooCredentialsPresent() ? wooApiBaseUrl() : null,
      },
    });
  });

  return router;
};
