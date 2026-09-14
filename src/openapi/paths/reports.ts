import { jsonListResponse, jsonResponse, paramRef, ref, responseRef, type PathMap } from '../types';

const ERRORS = {
  '401': responseRef('Unauthorized'),
  '403': responseRef('Forbidden'),
  '429': responseRef('TooManyRequests'),
  '500': responseRef('ServerError'),
};

const PERIOD_PARAMS = [paramRef('ReportPeriod'), paramRef('ReportDateMin'), paramRef('ReportDateMax')];

const totalsEndpoint = (
  path: string,
  operationId: string,
  summary: string,
  description: string,
): PathMap => ({
  [path]: {
    get: {
      tags: ['Reports'],
      operationId,
      summary,
      description,
      responses: { '200': jsonListResponse('Counts per bucket.', 'ReportTotal'), ...ERRORS },
    },
  },
});

export const reportPaths: PathMap = {
  '/reports': {
    get: {
      tags: ['Reports'],
      operationId: 'listReports',
      summary: 'List available reports',
      description: 'Index of the report endpoints this store exposes.',
      responses: { '200': jsonListResponse('Available reports.', 'ReportIndexEntry'), ...ERRORS },
    },
  },

  '/reports/sales': {
    get: {
      tags: ['Reports'],
      operationId: 'getSalesReport',
      summary: 'Retrieve the sales report',
      description:
        'Aggregated revenue, order count, tax, shipping and discounts for a period, plus a per-day breakdown under `totals`. ' +
        'Supply either `period` or an explicit `date_min`/`date_max` pair — if both are present the explicit dates win. ' +
        'Note this endpoint returns an array containing a single report object.',
      parameters: PERIOD_PARAMS,
      responses: {
        '200': {
          description: 'A one-element array holding the sales report.',
          content: {
            'application/json': { schema: { type: 'array', items: ref('SalesReport') } },
          },
        },
        ...ERRORS,
      },
    },
  },

  '/reports/top_sellers': {
    get: {
      tags: ['Reports'],
      operationId: 'getTopSellersReport',
      summary: 'Retrieve the top sellers report',
      description: 'Best-selling products by units sold for the requested period.',
      parameters: [...PERIOD_PARAMS, paramRef('Page'), paramRef('PerPage')],
      responses: {
        '200': jsonListResponse('Top selling products.', 'TopSellerReport'),
        ...ERRORS,
      },
    },
  },

  '/reports/coupons/totals': {
    get: {
      tags: ['Reports'],
      operationId: 'getCouponTotalsReport',
      summary: 'Retrieve coupon totals',
      description: 'Coupon counts grouped by discount type.',
      responses: { '200': jsonListResponse('Coupon totals.', 'ReportTotal'), ...ERRORS },
    },
  },

  ...totalsEndpoint(
    '/reports/customers/totals',
    'getCustomerTotalsReport',
    'Retrieve customer totals',
    'Customer counts split into paying and non-paying.',
  ),
  ...totalsEndpoint(
    '/reports/orders/totals',
    'getOrderTotalsReport',
    'Retrieve order totals',
    'Order counts grouped by status — the quickest way to size a fulfilment backlog.',
  ),
  ...totalsEndpoint(
    '/reports/products/totals',
    'getProductTotalsReport',
    'Retrieve product totals',
    'Product counts grouped by product type.',
  ),
  ...totalsEndpoint(
    '/reports/reviews/totals',
    'getReviewTotalsReport',
    'Retrieve review totals',
    'Review counts grouped by moderation status.',
  ),

  '/reports/sales/summary': {
    get: {
      tags: ['Reports'],
      operationId: 'getSalesSummary',
      summary: 'Retrieve a sales summary',
      description:
        'Convenience alias some builds expose for the current period’s sales figures. Falls back to `/reports/sales` semantics.',
      parameters: PERIOD_PARAMS,
      responses: {
        '200': jsonResponse('Sales summary.', ref('SalesReport')),
        '404': responseRef('NotFound'),
        ...ERRORS,
      },
    },
  },
};
