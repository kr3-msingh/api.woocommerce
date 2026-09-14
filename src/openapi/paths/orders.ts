import { paramRef, type Parameter, type PathMap } from '../types';
import { crudPaths } from './crud';

const q = (
  name: string,
  description: string,
  schema: Record<string, unknown>,
): Parameter => ({ name, in: 'query', description, schema: schema as never });

export const orderPaths: PathMap = {
  ...crudPaths({
    tag: 'Orders',
    schema: 'Order',
    basePath: '/orders',
    singular: 'order',
    plural: 'orders',
    operationIdSingular: 'Order',
    operationIdPlural: 'Orders',
    orderByValues: ['date', 'id', 'include', 'title', 'slug', 'modified'],
    listParameters: [
      paramRef('After'),
      paramRef('Before'),
      paramRef('ModifiedAfter'),
      paramRef('ModifiedBefore'),
      paramRef('DatesAreGmt'),
      paramRef('Parent'),
      paramRef('ParentExclude'),
      {
        name: 'status',
        in: 'query',
        description:
          'Limit result set to orders assigned a specific status. Repeatable; `any` returns everything including trash.',
        schema: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'any',
              'pending',
              'processing',
              'on-hold',
              'completed',
              'cancelled',
              'refunded',
              'failed',
              'trash',
              'checkout-draft',
            ],
          },
          default: ['any'],
        },
        style: 'form',
        explode: false,
      },
      q('customer', 'Limit result set to orders assigned a specific customer (user ID). Use `0` for guests.', {
        type: 'integer',
        example: 57,
      }),
      q('product', 'Limit result set to orders containing a specific product ID.', { type: 'integer' }),
      q('dp', 'Number of decimal points to use in each monetary value.', {
        type: 'integer',
        default: 2,
      }),
      q(
        'search',
        'Search orders. Matches billing details, item names and order IDs depending on store configuration.',
        { type: 'string' },
      ),
    ],
    listDescription:
      'The single most useful endpoint for operations work: reconciliation, fulfilment queues and support lookups all start here. ' +
      'Order totals are strings — parse them as decimals, never as floats, before doing arithmetic.',
    deleteDescription:
      'Trashed orders are still visible in wp-admin and still hold their order number. `force=true` is irreversible and removes the line items too.',
  }),

  ...crudPaths({
    tag: 'Order notes',
    schema: 'OrderNote',
    basePath: '/orders/{order_id}/notes',
    singular: 'order note',
    plural: 'order notes',
    operationIdSingular: 'OrderNote',
    operationIdPlural: 'OrderNotes',
    pathParameters: [paramRef('OrderIdPath')],
    batch: false,
    forceRequired: true,
    omitCollectionParameters: ['search', 'offset', 'order', 'orderby', 'include', 'exclude', 'page', 'per_page'],
    listParameters: [
      q('type', 'Limit result set to notes of a specific type.', {
        type: 'string',
        enum: ['any', 'customer', 'internal'],
        default: 'any',
      }),
    ],
    listDescription:
      'Notes cannot be updated once created — create a new one instead. Setting `customer_note: true` emails the note to the buyer.',
  }),

  ...crudPaths({
    tag: 'Order refunds',
    schema: 'OrderRefund',
    basePath: '/orders/{order_id}/refunds',
    singular: 'refund',
    plural: 'refunds',
    operationIdSingular: 'OrderRefund',
    operationIdPlural: 'OrderRefunds',
    pathParameters: [paramRef('OrderIdPath')],
    batch: false,
    forceRequired: true,
    listParameters: [
      paramRef('After'),
      paramRef('Before'),
      paramRef('DatesAreGmt'),
      paramRef('Parent'),
      paramRef('ParentExclude'),
      q('dp', 'Number of decimal points to use in each monetary value.', { type: 'integer', default: 2 }),
    ],
    listDescription:
      'Refunds are immutable: there is no `PUT`. Creating a refund with `api_refund: true` also asks the payment gateway to move the money, ' +
      'so treat `POST` here as a real financial action, not a bookkeeping entry.',
  }),
};

// Neither notes nor refunds expose an update operation in WooCommerce; drop the
// PUT the CRUD factory generates by default.
delete orderPaths['/orders/{order_id}/notes/{id}']?.put;
delete orderPaths['/orders/{order_id}/refunds/{id}']?.put;
