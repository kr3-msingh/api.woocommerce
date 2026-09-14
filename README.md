# WooCommerce REST API — OpenAPI Specification & Swagger UI

A complete, hand-written **OpenAPI 3.0.3** description of the WooCommerce REST API (`wc/v3`),
served through **Swagger UI** by a small **Node.js + TypeScript** app — with a built-in gateway so
*Try it out* reaches a real store instead of dying on CORS.

Built as the **API half** of an API-vs-MCP demo: the same store, described two ways, so the
difference between a developer-facing contract and a model-facing one is something you can click
through rather than argue about.

```
133 operations · 79 paths · 20 tags · 52 schemas
```

---

## Contents

- [Quick start](#quick-start)
- [What you get](#what-you-get)
- [Configuration](#configuration)
- [The gateway (and why it exists)](#the-gateway-and-why-it-exists)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [Extending the spec](#extending-the-spec)
- [Generating clients](#generating-clients)
- [REST API vs MCP server](#rest-api-vs-mcp-server)
- [Troubleshooting](#troubleshooting)

---

## Quick start

**Requires Node 18.17 or newer.** Verified on Node 18.20.8 — the version most shared hosts still
ship — as well as on current releases. Nothing in the dependency tree requires Node 20+, and the
build uses only Node built-ins (no `rimraf`, no native modules, no toolchain).

```bash
npm install
cp .env.example .env      # then fill in your store URL + API keys
npm run dev               # http://localhost:3000
```

Production:

```bash
npm install
npm run build
npm start
```

| Route | What it serves |
| --- | --- |
| `/` | Landing page — the API-vs-MCP comparison |
| `/docs` | Swagger UI explorer |
| `/openapi.json` | The specification, JSON |
| `/openapi.yaml` | The specification, YAML |
| `/healthz` | Liveness + spec/gateway status, as JSON |
| `/api/wc/*` | Gateway to the configured WooCommerce store |

### Getting WooCommerce API keys

In wp-admin: **WooCommerce → Settings → Advanced → REST API → Add key**.
Pick a user, set **Permissions** (use *Read* for a demo), and generate. The `ck_…` / `cs_…` pair is
shown exactly once.

---

## What you get

**Documented resources** — products, variations, categories, tags, attributes and terms, shipping
classes, reviews, orders, order notes, refunds, customers, customer downloads, coupons, reports, tax
rates and classes, shipping zones/locations/methods, payment gateways, settings, webhooks, system
status and tools, and the read-only reference data endpoints.

Each one carries the real filters (`after`, `status`, `sku`, `on_sale`, `stock_status`, `min_price`,
`orderby` with its per-resource enum…), the real pagination headers (`X-WP-Total`,
`X-WP-TotalPages`, `Link`), the real error envelope, and `/batch` where WooCommerce has one.

**A spec that is checked, not just written.** `npm run spec:validate` walks the assembled document
and fails on dangling `$ref`s, duplicate `operationId`s, operations without responses, and path
parameters that are declared but never used (or vice versa). Run it in CI.

**A spec assembled in TypeScript, not maintained as YAML.** Every resource is a typed module and the
repetitive CRUD surface comes from one factory (`src/openapi/paths/crud.ts`), so adding an endpoint
is a few lines rather than 200 lines of copied YAML that drifts.

---

## Configuration

Everything is environment variables; see `.env.example` for the annotated list.

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `3000` | |
| `NODE_ENV` | `development` | `production` enables spec caching, hides stack traces |
| `PUBLIC_BASE_URL` | `http://localhost:$PORT` | Used for the `servers` block and printed links |
| `WOO_STORE_URL` | — | Site root, **no** trailing slash, **no** `/wp-json` |
| `WOO_CONSUMER_KEY` | — | `ck_…` |
| `WOO_CONSUMER_SECRET` | — | `cs_…` |
| `WOO_API_VERSION` | `wc/v3` | `wc/v2` and `wc/v1` also accepted |
| `WOO_USE_QUERY_STRING_AUTH` | `false` | Set `true` for plain-HTTP stores or hosts that strip `Authorization` |
| `WOO_TIMEOUT_MS` | `20000` | Upstream request timeout |
| `PROXY_ENABLED` | `true` | `false` ships documentation only |
| `PROXY_ALLOW_WRITES` | `false` | **Keep `false` for public demos** |
| `RATE_LIMIT_WINDOW_MS` | `60000` | |
| `RATE_LIMIT_MAX` | `60` | Requests per window per IP, gateway only |
| `CORS_ORIGIN` | `*` | Comma-separated list, or `*` |

The app runs fine with no store configured — you get the full documentation, and *Try it out*
returns a `503` explaining what to set.

---

## The gateway (and why it exists)

WooCommerce sends no CORS headers. A browser cannot call it directly, so Swagger UI's *Try it out*
button is decorative on most WooCommerce OpenAPI setups.

This app mounts a gateway at `/api/wc` that the browser calls same-origin. It:

- attaches the consumer key/secret **server-side** — credentials never reach the browser;
- **strips** any `consumer_key` / `consumer_secret` a caller tries to pass through it;
- refuses `POST` / `PUT` / `PATCH` / `DELETE` with `405` unless `PROXY_ALLOW_WRITES=true`;
- rate-limits per IP;
- rejects paths that try to escape the `wc/v3` namespace;
- times out and returns a `504` rather than hanging;
- relays `X-WP-Total`, `X-WP-TotalPages` and `Link` so pagination still works in the UI.

The defaults are deliberately timid: **read-only, rate-limited**. You can point it at production and
demo safely. Flip `PROXY_ALLOW_WRITES=true` only when you mean it.

If you would rather ship documentation with no live calls at all, set `PROXY_ENABLED=false`.

---

## Deployment

### cPanel / Plesk / shared Node hosting (Passenger)

These panels run a startup file directly; they do not run `npm start`. `app.js` in the repo root
exists for exactly this.

1. Upload the repo (or `git clone` it) into your app directory.
2. **Setup Node.js App** → Node version **18+**, Application root = the folder, **Application
   startup file = `app.js`**.
3. Open the panel's terminal (or "Run NPM Install"):
   ```bash
   npm install
   npm run build
   ```
4. Add the environment variables from `.env.example` in the panel's **Environment variables**
   section. Uploading a `.env` to the application root also works — the app resolves it relative to
   its own location, not the working directory, because Passenger does not guarantee the two match.
   Real environment variables win over `.env` either way.
5. Restart the application, then check `https://your-app-url/healthz` — `gateway.configured` should
   be `true`.

`app.js` fails loudly if `dist/` is missing, so a forgotten build shows up as a clear message rather
than a blank 503.

### VPS with PM2

```bash
npm install && npm run build
pm2 start ecosystem.config.js
pm2 save && pm2 startup
```

Then reverse-proxy it with nginx:

```nginx
location / {
    proxy_pass         http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
}
```

The app sets `trust proxy`, so rate limiting sees real client IPs.

### Docker

```bash
docker build -t swagger-woo .
docker run -p 3000:3000 --env-file .env swagger-woo
```

Multi-stage, runs as the non-root `node` user, and carries a `HEALTHCHECK` against `/healthz`.

### Render / Railway / Fly / App Platform

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Set `PUBLIC_BASE_URL` to the assigned public URL, plus the `WOO_*` variables.

---

## Project structure

```
src/
├── server.ts                      Express app, security middleware, startup banner
├── config.ts                      Environment parsing, one typed config object
├── routes/
│   ├── docs.ts                    Swagger UI + /openapi.json + /openapi.yaml
│   ├── proxy.ts                   The WooCommerce gateway
│   └── health.ts                  /healthz
├── middleware/errorHandler.ts     404 + error envelopes, WooCommerce-shaped
└── openapi/
    ├── index.ts                   Document assembly, servers, caching
    ├── info.ts                    Title, description, tag descriptions
    ├── types.ts                   $ref / response / body helpers
    ├── components/
    │   ├── parameters.ts          Shared query + path parameters
    │   ├── responses.ts           Shared 4xx / 5xx responses
    │   ├── security.ts            Basic auth + query-string key auth
    │   └── schemas/               Product, order, customer, store, report schemas
    └── paths/
        ├── crud.ts                The list/create/read/update/delete/batch factory
        ├── products.ts  orders.ts  customers.ts  store.ts  reports.ts
        └── index.ts
public/index.html                  Landing page (API vs MCP)
scripts/
├── export-spec.ts                 npm run spec:json | spec:yaml
├── validate-spec.ts               npm run spec:validate
├── clean.mjs                      Removes dist/ (replaces rimraf)
└── copy-assets.mjs                Copies public/ into dist/
```

### Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Watch mode via `tsx` |
| `npm run clean` | Remove `dist/` |
| `npm run build` | Compile to `dist/` and copy `public/` |
| `npm start` | Run the build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run spec:json` | Write `openapi.json` |
| `npm run spec:yaml` | Write `openapi.yaml` |
| `npm run spec:validate` | Structural checks; non-zero exit on failure |

---

## Extending the spec

Most endpoints need nothing but a `crudPaths` call:

```ts
// src/openapi/paths/subscriptions.ts
export const subscriptionPaths: PathMap = crudPaths({
  tag: 'Subscriptions',
  schema: 'Subscription',
  basePath: '/subscriptions',
  singular: 'subscription',
  plural: 'subscriptions',
  operationIdSingular: 'Subscription',
  operationIdPlural: 'Subscriptions',
  listParameters: [
    { name: 'status', in: 'query', description: '…', schema: { type: 'string' } },
  ],
});
```

Then:

1. add the schema under `src/openapi/components/schemas/` and export it from that folder's `index.ts`;
2. spread the new paths into `src/openapi/paths/index.ts`;
3. describe the tag in `src/openapi/info.ts`;
4. `npm run spec:validate`.

Hand-write the path item instead when an endpoint is genuinely irregular — see
`src/openapi/paths/store.ts` for examples (settings, shipping zone locations, system status tools).

---

## Generating clients

The spec is plain OpenAPI 3.0.3, so the usual toolchain works:

```bash
npm run spec:json

# typed TypeScript client
npx openapi-typescript openapi.json -o src/generated/woo.d.ts

# or a full SDK in any supported language
npx @openapitools/openapi-generator-cli generate \
  -i openapi.json -g typescript-axios -o ./client
```

It also imports cleanly into Postman, Insomnia, Stoplight, Bruno, and most API gateways.

---

## REST API vs MCP server

This repo is half of a pair. The other half wraps the same store in an MCP server. The point of
showing them together:

| | REST + OpenAPI | MCP server |
| --- | --- | --- |
| Written for | A developer, ahead of time | A model, at runtime |
| Surface | Broad — 133 operations, every field | Narrow — ~12 intent-shaped tools |
| Discovery | Read the spec, generate a client | `tools/list` over the protocol, mid-conversation |
| Composition | The caller's job | The server's job |
| Credentials | Held by the client | Held by the server; the model never sees them |
| Errors | `403 woocommerce_rest_cannot_create` | "That key is read-only, so I can't create products" |
| Best at | Integrations, ETL, typed clients, contract tests | Assistants, ops copilots, natural-language workflows |

Take *"which orders from the last week are still unfulfilled, and what are they worth?"*

With REST you fetch `/orders?status=processing,on-hold&after=…&per_page=100`, page until
`X-WP-TotalPages` runs out, parse `total` as a decimal rather than a float, decide what
"unfulfilled" means, and distinguish `401` from `403` from `400`. Five decisions before you see an
answer, and each is a place to be wrong.

With MCP the model calls `find_orders({ status: "unfulfilled", since: "7d", include_totals: true })`
and gets back the count, the value and the age. The pagination, the decimal handling and the
definition of "unfulfilled" live in the server, written once by someone who knew the answer.

**MCP is not a replacement for a REST API — it is a curated interface layer above one.** This spec is
what you build the MCP server *on top of*. Skip the API and the MCP server has nothing to call; skip
the MCP server and every model that touches your store has to learn all 133 operations first.

---

## Troubleshooting

**"Try it out" returns 503 `proxy_not_configured`**
The app is running fine — it just has no store credentials. `.env` is gitignored, so it is never in a
clone or a deploy; you have to supply the values on the host.

Check what the app actually sees:

```bash
curl https://your-app-url/healthz
```

`"configured": false` means `WOO_STORE_URL`, `WOO_CONSUMER_KEY` or `WOO_CONSUMER_SECRET` is missing.
Set them either way — real environment variables take precedence over `.env`:

- **cPanel / Plesk:** *Setup Node.js App* → **Environment variables** → add each one → **Save** →
  **Restart**. Preferred: the values are not sitting in a file under the web root.
- **`.env` file:** upload it to the application root (next to `package.json`), then restart.

Note this is a JSON 503 from `/api/wc/*`. A full-page **503 Service Unavailable** from the host is a
different problem — see below.

**Host returns a 503 / 502 page for every route, including `/docs`**
The app never started; this is not a credentials problem — it boots and serves documentation fine
with no `.env` at all. Usual causes: `npm run build` was never run (`app.js` says so explicitly in
the Passenger log), the Node version was changed without reinstalling, or the startup file is not set
to `app.js`. Check the panel's stderr log first.

**405 `proxy_read_only`**
Working as intended. Set `PROXY_ALLOW_WRITES=true` if you really want the demo to mutate the store.

**401 `woocommerce_rest_authentication_error`**
Usually one of: keys copied with whitespace; the store is on plain HTTP (set
`WOO_USE_QUERY_STRING_AUTH=true`); or the host strips `Authorization` — some Apache setups need

```apache
RewriteCond %{HTTP:Authorization} ^(.*)
RewriteRule ^(.*) - [E=HTTP_AUTHORIZATION:%1]
```

**403 on writes with valid keys**
The key has *Read* permission. Regenerate it as *Read/Write*. The request authenticated fine — it
just wasn't allowed, which is why this is a 403 and not a 401.

**404 `rest_no_route` from the store**
Permalinks are set to "Plain". WooCommerce's REST API needs pretty permalinks —
*Settings → Permalinks → Post name*, then save.

**502 / 504 from the gateway**
The store is unreachable from the server, or slower than `WOO_TIMEOUT_MS`. Check with
`curl -u ck:cs https://your-store.com/wp-json/wc/v3/system_status` from the same host.

**`npm warn EBADENGINE ... required: { node: '20 || >=22' }` during install**
Should not happen on a current checkout — the tree is Node 18 clean. If you see it, you are on an
older commit that still had `rimraf` as a build dependency; pull and reinstall:

```bash
git pull && rm -rf node_modules package-lock.json && npm install && npm run build
```

**`sh: tsc: command not found` / `ERROR: Failed to build the application`**
`npm install` skipped devDependencies, so TypeScript was never installed. This happens when
`NODE_ENV=production` is set during install — which cPanel and Plesk do by default. The giveaway is
the package count: a correct install is ~103 packages, a dev-less one ~82.

The repo ships an `.npmrc` containing `include=dev`, which forces them in regardless of `NODE_ENV`.
If you hit this, you are on an older commit — pull and reinstall:

```bash
git pull && rm -rf node_modules && npm install && npm run build
```

This app is compiled from source on the host, so TypeScript genuinely has to be there at build time.
The Docker image is unaffected: its dependency stage copies only `package*.json`, so `.npmrc` is not
present when it runs `npm ci --omit=dev`, and the runtime image stays lean.

**`npm notice New major version of npm available`**
Cosmetic. Nothing here needs npm 12; npm 10 is fine.

**Swagger UI renders blank**
A reverse proxy is rewriting or blocking `/docs/swagger-ui-bundle.js`, or a stricter CSP than this
app's has been layered on top. Check the browser console and `curl -I /docs/swagger-ui-bundle.js`.

---

## License

MIT.

WooCommerce is a trademark of Automattic. This is an independent specification, not an official one;
the authoritative reference is the
[WooCommerce REST API documentation](https://woocommerce.github.io/woocommerce-rest-api-docs/).
