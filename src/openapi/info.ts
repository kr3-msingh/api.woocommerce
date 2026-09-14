import type { OpenAPIV3 } from 'openapi-types';

export const info: OpenAPIV3.InfoObject = {
  title: 'WooCommerce REST API',
  version: '3.0.0',
  description: `
A hand-written OpenAPI description of the **WooCommerce REST API v3**, served through Swagger UI
with a live \`Try it out\` proxy so you can hit a real store without fighting CORS.

---

### Authentication

WooCommerce issues a **consumer key** and **consumer secret** under
*WooCommerce → Settings → Advanced → REST API*. Two ways to present them:

| Transport | How | When |
| --- | --- | --- |
| HTTP Basic | key as username, secret as password | Any HTTPS store. Preferred. |
| Query string | \`?consumer_key=…&consumer_secret=…\` | Plain HTTP, or hosts that strip \`Authorization\` |

Keys carry a permission level — *read*, *write*, or *read/write*. A read key hitting \`POST /products\`
returns **403**, not 401; the request authenticated fine, it just wasn't allowed.

When this documentation is served with a store configured, the **\`Try it out\`** button routes through
this app's own gateway, which attaches the credentials server-side. Your browser never sees them.

### Conventions worth knowing before you write a client

- **Money is a string.** \`total: "2998.00"\`, not \`2998.00\`. Parse as decimal; float arithmetic on
  order totals will eventually cost someone a rupee.
- **\`PUT\` is a merge, not a replace.** Send only the fields you intend to change.
- **Pagination lives in headers.** \`X-WP-Total\` and \`X-WP-TotalPages\`, plus RFC 5988 \`Link\` headers.
  \`per_page\` is capped at 100.
- **\`context=view\` vs \`context=edit\`.** \`edit\` returns fields that require elevated capabilities and
  is what you want for any write-then-read round trip.
- **Deletes usually trash.** Pass \`?force=true\` for permanent removal. Some resources (terms, refunds,
  webhooks) have no trash and *require* \`force=true\`.
- **Batch endpoints are not transactional.** A \`/batch\` call applies each entry independently; inspect
  every element of the response for an \`error\` key.
- **Errors are uniform.** Every failure returns \`{ code, message, data: { status } }\`.

### The point of this demo: API surface vs MCP surface

This spec is deliberately complete — **133 operations** across products, orders, customers,
coupons, reports and store configuration. That completeness is exactly what makes it a good
counterpoint to an MCP server.

- **REST + OpenAPI** is a contract for *programmers*. It describes every field and every filter, and
  assumes a developer reads it, decides which of the 90 operations to call, chains them, and handles
  the errors.
- **MCP** is a contract for *models*. The companion WooCommerce MCP server wraps this same surface in
  roughly a dozen intent-shaped tools (\`find_orders\`, \`check_stock\`, \`refund_order\`), each with a
  narrow schema, a description written for a reader with no prior context, and results already shaped
  for reasoning rather than rendering.

Same store, same data, same underlying HTTP calls. What differs is who the interface is written for.
`.trim(),
  contact: {
    name: 'KR3 Infosys',
    url: 'https://kr3infosys.com',
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },
  termsOfService: 'https://woocommerce.com/terms-conditions/',
};

export const tags: OpenAPIV3.TagObject[] = [
  {
    name: 'Products',
    description:
      'The catalogue. Simple, grouped, external and variable products, with stock, pricing and taxonomy.',
    externalDocs: {
      description: 'WooCommerce product properties',
      url: 'https://woocommerce.github.io/woocommerce-rest-api-docs/#products',
    },
  },
  {
    name: 'Product variations',
    description: 'Purchasable combinations belonging to a variable product.',
  },
  { name: 'Product categories', description: 'Hierarchical catalogue taxonomy.' },
  { name: 'Product tags', description: 'Flat catalogue taxonomy.' },
  {
    name: 'Product attributes',
    description: 'Global attribute definitions and their terms, e.g. Size → S/M/L.',
  },
  { name: 'Product shipping classes', description: 'Groupings that shipping methods can price differently.' },
  { name: 'Product reviews', description: 'Customer reviews and their moderation status.' },
  {
    name: 'Orders',
    description:
      'Orders, their line items and totals. The busiest surface in most integrations.',
    externalDocs: {
      description: 'WooCommerce order properties',
      url: 'https://woocommerce.github.io/woocommerce-rest-api-docs/#orders',
    },
  },
  { name: 'Order notes', description: 'Internal and customer-facing notes attached to an order.' },
  { name: 'Order refunds', description: 'Refunds against an order. Creating one can move real money.' },
  { name: 'Customers', description: 'WordPress users with the customer role, plus their addresses.' },
  { name: 'Coupons', description: 'Discount codes and the rules constraining them.' },
  { name: 'Reports', description: 'Pre-aggregated sales, top sellers and per-status totals.' },
  { name: 'Tax rates', description: 'Tax rate rows and tax classes.' },
  { name: 'Shipping', description: 'Zones, the locations that route into them, and method instances.' },
  { name: 'Payment gateways', description: 'Installed gateways and their settings.' },
  { name: 'Settings', description: 'Store settings, grouped as they appear in wp-admin.' },
  {
    name: 'Webhooks',
    description:
      'Outbound HTTP callbacks. Use these instead of polling; verify `X-WC-Webhook-Signature` on every delivery.',
  },
  { name: 'System status', description: 'Diagnostics and maintenance tools.' },
  { name: 'Data', description: 'Read-only reference data: countries, states, currencies, continents.' },
];
