import type { SchemaMap } from '../../types';

/**
 * Cross-cutting schemas: errors, metadata bags, links, batch envelopes and the
 * primitive shapes WooCommerce reuses across every resource.
 */
export const sharedSchemas: SchemaMap = {
  Error: {
    type: 'object',
    description:
      'Standard WordPress REST API error envelope. Returned for every 4xx and 5xx response.',
    properties: {
      code: {
        type: 'string',
        description: 'Machine-readable error code.',
        example: 'woocommerce_rest_product_invalid_id',
      },
      message: {
        type: 'string',
        description: 'Human-readable error message.',
        example: 'Invalid ID.',
      },
      data: {
        type: 'object',
        nullable: true,
        properties: {
          status: { type: 'integer', example: 404 },
          params: {
            type: 'object',
            additionalProperties: { type: 'string' },
            description: 'Per-parameter validation messages, present on 400 responses.',
          },
          details: { type: 'object', additionalProperties: true },
        },
        additionalProperties: true,
      },
    },
    required: ['code', 'message'],
  },

  MetaData: {
    type: 'object',
    description:
      'Arbitrary key/value pair stored against a resource. This is where plugins (and your own integrations) hang custom fields.',
    properties: {
      id: { type: 'integer', readOnly: true, description: 'Meta ID.', example: 21455 },
      key: { type: 'string', description: 'Meta key.', example: '_custom_field' },
      value: {
        description: 'Meta value. Scalar, array or object depending on what wrote it.',
        oneOf: [
          { type: 'string' },
          { type: 'number' },
          { type: 'boolean' },
          { type: 'array', items: {} },
          { type: 'object', additionalProperties: true },
        ],
        nullable: true,
      },
    },
  },

  Links: {
    type: 'object',
    readOnly: true,
    description: 'HAL-style hypermedia links returned under the `_links` key.',
    additionalProperties: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          href: { type: 'string', format: 'uri' },
          embeddable: { type: 'boolean' },
        },
      },
    },
    example: {
      self: [{ href: 'https://example.com/wp-json/wc/v3/products/799' }],
      collection: [{ href: 'https://example.com/wp-json/wc/v3/products' }],
    },
  },

  Image: {
    type: 'object',
    description: 'A media-library image attached to a product or category.',
    properties: {
      id: { type: 'integer', description: 'Attachment ID.', example: 795 },
      date_created: { type: 'string', format: 'date-time', readOnly: true },
      date_created_gmt: { type: 'string', format: 'date-time', readOnly: true },
      date_modified: { type: 'string', format: 'date-time', readOnly: true },
      date_modified_gmt: { type: 'string', format: 'date-time', readOnly: true },
      src: {
        type: 'string',
        format: 'uri',
        description:
          'Image URL. On create/update you may pass a remote URL and WooCommerce will sideload it.',
        example: 'https://example.com/wp-content/uploads/2026/01/hoodie.jpg',
      },
      name: { type: 'string', example: 'hoodie' },
      alt: { type: 'string', example: 'Navy hoodie, front view' },
    },
  },

  Dimensions: {
    type: 'object',
    description: 'Physical dimensions in the store unit (WooCommerce > Settings > Products).',
    properties: {
      length: { type: 'string', example: '12' },
      width: { type: 'string', example: '8' },
      height: { type: 'string', example: '2' },
    },
  },

  Address: {
    type: 'object',
    description: 'Billing or shipping address block.',
    properties: {
      first_name: { type: 'string', example: 'Asha' },
      last_name: { type: 'string', example: 'Iyer' },
      company: { type: 'string', example: '' },
      address_1: { type: 'string', example: '221B Residency Road' },
      address_2: { type: 'string', example: 'Ashok Nagar' },
      city: { type: 'string', example: 'Bengaluru' },
      state: {
        type: 'string',
        description: 'ISO code for the state/province where supported, otherwise free text.',
        example: 'KA',
      },
      postcode: { type: 'string', example: '560025' },
      country: { type: 'string', description: 'ISO 3166-1 alpha-2 country code.', example: 'IN' },
      email: {
        type: 'string',
        format: 'email',
        description: 'Billing addresses only.',
        example: 'asha@example.com',
      },
      phone: { type: 'string', description: 'Billing addresses only.', example: '+91 98800 12345' },
    },
  },

  BatchRequest: {
    type: 'object',
    description:
      'Batch envelope accepted by every `/batch` endpoint. Up to 100 objects per action per request by default.',
    properties: {
      create: { type: 'array', items: { type: 'object', additionalProperties: true } },
      update: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: true,
          properties: { id: { type: 'integer' } },
          required: ['id'],
        },
      },
      delete: {
        type: 'array',
        items: { type: 'integer' },
        description: 'IDs to delete. Force-deletes where the resource supports it.',
      },
    },
  },

  BatchResponse: {
    type: 'object',
    description: 'Per-action results, in the same order the request supplied them.',
    properties: {
      create: { type: 'array', items: { type: 'object', additionalProperties: true } },
      update: { type: 'array', items: { type: 'object', additionalProperties: true } },
      delete: { type: 'array', items: { type: 'object', additionalProperties: true } },
    },
  },


} as const;
