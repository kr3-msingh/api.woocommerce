import {
  jsonListResponse,
  paramRef,
  responseRef,
  type Parameter,
  type PathMap,
} from '../types';
import { crudPaths } from './crud';

const q = (
  name: string,
  description: string,
  schema: Record<string, unknown>,
): Parameter => ({ name, in: 'query', description, schema: schema as never });

export const customerPaths: PathMap = {
  ...crudPaths({
    tag: 'Customers',
    schema: 'Customer',
    basePath: '/customers',
    singular: 'customer',
    plural: 'customers',
    operationIdSingular: 'Customer',
    operationIdPlural: 'Customers',
    forceRequired: true,
    deleteParameters: [paramRef('Reassign')],
    orderByValues: ['id', 'include', 'name', 'registered_date'],
    listParameters: [
      q('email', 'Limit result set to the customer with a specific email address.', {
        type: 'string',
        format: 'email',
      }),
      q('role', 'Limit result set to users with a specific role.', {
        type: 'string',
        enum: [
          'all',
          'administrator',
          'editor',
          'author',
          'contributor',
          'subscriber',
          'customer',
          'shop_manager',
        ],
        default: 'customer',
      }),
    ],
    listDescription:
      'Customers are WordPress users. Guest checkouts never appear here — look for `customer_id: 0` orders instead.',
    deleteDescription:
      'Deletion is permanent and also deletes the underlying WordPress user. Pass `reassign` to move their content to another user first.',
  }),

  '/customers/{id}/downloads': {
    parameters: [paramRef('Id')],
    get: {
      tags: ['Customers'],
      operationId: 'listCustomerDownloads',
      summary: 'List a customer’s downloadable products',
      description:
        'Every downloadable file the customer currently has access to, with remaining download counts and expiry.',
      responses: {
        '200': jsonListResponse('Downloadable files available to this customer.', 'CustomerDownload'),
        '401': responseRef('Unauthorized'),
        '403': responseRef('Forbidden'),
        '404': responseRef('NotFound'),
        '500': responseRef('ServerError'),
      },
    },
  },

  ...crudPaths({
    tag: 'Coupons',
    schema: 'Coupon',
    basePath: '/coupons',
    singular: 'coupon',
    plural: 'coupons',
    operationIdSingular: 'Coupon',
    operationIdPlural: 'Coupons',
    listParameters: [
      paramRef('After'),
      paramRef('Before'),
      paramRef('ModifiedAfter'),
      paramRef('ModifiedBefore'),
      paramRef('DatesAreGmt'),
      q('code', 'Limit result set to the coupon with a specific code.', {
        type: 'string',
        example: 'welcome10',
      }),
    ],
    listDescription:
      'Coupon codes are case-insensitive and stored lowercase. `search` does not match codes reliably — use `code` for exact lookups.',
  }),
};
