import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { openApiDocument } from '../openapi';

const CUSTOM_CSS = `
  .swagger-ui .topbar { display: none; }
  .swagger-ui .information-container { padding: 28px 0 8px; }
  .swagger-ui .info .title { font-size: 34px; letter-spacing: -0.02em; }
  .swagger-ui .info .title small.version-stamp { background: #3b4151; }
  .swagger-ui .info table { display: table; width: 100%; margin: 12px 0 18px; border-collapse: collapse; }
  .swagger-ui .info table th,
  .swagger-ui .info table td { border: 1px solid #e4e7ec; padding: 8px 12px; text-align: left; font-size: 13px; }
  .swagger-ui .info table th { background: #f7f8fa; font-weight: 600; }
  .swagger-ui .scheme-container { box-shadow: none; border-bottom: 1px solid #e4e7ec; background: #fbfcfd; }
  .swagger-ui .opblock-tag { font-size: 20px; border-bottom: 1px solid #edeff2; }
  .swagger-ui .opblock .opblock-summary-operation-id { font-size: 12px; color: #8a93a5; }
  .swagger-ui .btn.authorize { border-color: #7f54b3; color: #7f54b3; }
  .swagger-ui .btn.authorize svg { fill: #7f54b3; }
  .swagger-ui .back-to-home {
    display: inline-block; margin: 18px 0 0 20px; padding: 7px 14px; border-radius: 6px;
    background: #7f54b3; color: #fff; font: 600 13px/1 system-ui, sans-serif; text-decoration: none;
  }
`;

/** Injected after the UI boots: a link back to the comparison landing page. */
const CUSTOM_JS = `
  window.addEventListener('load', function () {
    var anchor = document.querySelector('.swagger-ui .information-container');
    if (!anchor || document.querySelector('.back-to-home')) return;
    var link = document.createElement('a');
    link.className = 'back-to-home';
    link.href = '/';
    link.textContent = '\\u2190 REST API vs MCP: what this demo is about';
    anchor.parentNode.insertBefore(link, anchor);
  });
`;

export const docsRouter = (): Router => {
  const router = Router();

  router.get('/openapi.json', (_req, res) => {
    res.type('application/json').send(JSON.stringify(openApiDocument(), null, 2));
  });

  router.get('/openapi.yaml', (_req, res) => {
    res.type('text/yaml').send(YAML.stringify(openApiDocument(), { lineWidth: 0 }));
  });

  // `customJsStr` is supported by swagger-ui-express 5 but missing from the
  // published types, hence the widened option type.
  const uiOptions: swaggerUi.SwaggerUiOptions & { customJsStr?: string } = {
    // Point the UI at the served spec rather than inlining it, so the two
    // never drift and the JSON stays cacheable. Relative on purpose: it keeps
    // working behind any domain, path prefix or reverse proxy.
    swaggerOptions: {
      url: '../openapi.json',
      docExpansion: 'none',
      deepLinking: true,
      displayOperationId: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 3,
      filter: true,
      persistAuthorization: true,
      tryItOutEnabled: true,
      displayRequestDuration: true,
      showCommonExtensions: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      syntaxHighlight: { activate: true, theme: 'nord' },
    },
    customCss: CUSTOM_CSS,
    customJsStr: CUSTOM_JS,
    customSiteTitle: 'WooCommerce REST API — OpenAPI Explorer',
    customfavIcon:
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Crect width="32" height="32" rx="7" fill="%237f54b3"/%3E%3Ctext x="16" y="22" font-size="17" font-family="sans-serif" fill="white" text-anchor="middle"%3EW%3C/text%3E%3C/svg%3E',
  };

  router.use('/docs', swaggerUi.serveFiles(undefined, uiOptions), swaggerUi.setup(undefined, uiOptions));

  return router;
};
