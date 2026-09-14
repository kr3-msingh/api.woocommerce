import { ref, type SchemaMap } from '../../types';

export const reportSchemas: SchemaMap = {
  ReportIndexEntry: {
    type: 'object',
    readOnly: true,
    properties: {
      slug: { type: 'string', example: 'sales' },
      description: { type: 'string', example: 'List of sales reports.' },
      _links: ref('Links'),
    },
  },

  SalesReport: {
    type: 'object',
    readOnly: true,
    description: 'Aggregated sales for the requested period.',
    properties: {
      total_sales: { type: 'string', example: '184320.00' },
      net_sales: { type: 'string', example: '162110.25' },
      average_sales: { type: 'string', example: '6144.00' },
      total_orders: { type: 'integer', example: 96 },
      total_items: { type: 'integer', example: 231 },
      total_tax: { type: 'string', example: '19730.75' },
      total_shipping: { type: 'string', example: '2479.00' },
      total_refunds: { type: 'integer', example: 3 },
      total_discount: { type: 'integer', example: 4120 },
      totals_grouped_by: { type: 'string', example: 'day' },
      totals: {
        type: 'object',
        description: 'Per-bucket breakdown keyed by date.',
        additionalProperties: {
          type: 'object',
          properties: {
            sales: { type: 'string' },
            orders: { type: 'integer' },
            items: { type: 'integer' },
            tax: { type: 'string' },
            shipping: { type: 'string' },
            discount: { type: 'string' },
            customers: { type: 'integer' },
          },
        },
      },
      _links: ref('Links'),
    },
  },

  TopSellerReport: {
    type: 'object',
    readOnly: true,
    properties: {
      name: { type: 'string', example: 'Ceramic Pour-Over Kit' },
      product_id: { type: 'integer', example: 799 },
      quantity: { type: 'integer', example: 62 },
      _links: ref('Links'),
    },
  },

  ReportTotal: {
    type: 'object',
    readOnly: true,
    description: 'Count of resources bucketed by status/type.',
    properties: {
      slug: { type: 'string', example: 'processing' },
      name: { type: 'string', example: 'Processing' },
      total: { oneOf: [{ type: 'integer' }, { type: 'string' }], example: 12 },
    },
  },
} as const;
