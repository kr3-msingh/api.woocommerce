import { ref, type SchemaMap } from '../../types';

export const storeSchemas: SchemaMap = {
  TaxRate: {
    type: 'object',
    description: 'A tax rate row. Matching is by country/state/postcode/city, most specific first.',
    properties: {
      id: { type: 'integer', readOnly: true },
      country: { type: 'string', example: 'IN' },
      state: { type: 'string', example: 'KA' },
      postcode: { type: 'string', deprecated: true, description: 'Deprecated in favour of `postcodes`.' },
      city: { type: 'string', deprecated: true, description: 'Deprecated in favour of `cities`.' },
      postcodes: { type: 'array', items: { type: 'string' } },
      cities: { type: 'array', items: { type: 'string' } },
      rate: { type: 'string', description: 'Rate percentage.', example: '18.0000' },
      name: { type: 'string', example: 'GST' },
      priority: { type: 'integer', default: 1 },
      compound: { type: 'boolean', default: false },
      shipping: { type: 'boolean', default: true, description: 'Whether the rate applies to shipping.' },
      order: { type: 'integer', description: 'Sort order.' },
      class: { type: 'string', default: 'standard' },
      _links: ref('Links'),
    },
  },

  TaxClass: {
    type: 'object',
    properties: {
      slug: { type: 'string', readOnly: true, example: 'reduced-rate' },
      name: { type: 'string', example: 'Reduced rate' },
      _links: ref('Links'),
    },
    required: ['name'],
  },

  ShippingZone: {
    type: 'object',
    properties: {
      id: { type: 'integer', readOnly: true, example: 3 },
      name: { type: 'string', example: 'South India' },
      order: { type: 'integer', default: 0 },
      _links: ref('Links'),
    },
    required: ['name'],
  },

  ShippingZoneLocation: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Location code: country, state, postcode or continent.', example: 'IN:KA' },
      type: {
        type: 'string',
        enum: ['postcode', 'state', 'country', 'continent'],
        default: 'country',
      },
    },
  },

  ShippingZoneMethod: {
    type: 'object',
    properties: {
      instance_id: { type: 'integer', readOnly: true },
      title: { type: 'string', readOnly: true, example: 'Flat rate' },
      order: { type: 'integer' },
      enabled: { type: 'boolean', default: true },
      method_id: { type: 'string', example: 'flat_rate' },
      method_title: { type: 'string', readOnly: true },
      method_description: { type: 'string', readOnly: true },
      settings: {
        type: 'object',
        description: 'Method-specific settings, keyed by setting ID.',
        additionalProperties: ref('SettingOption'),
      },
      _links: ref('Links'),
    },
  },

  ShippingMethod: {
    type: 'object',
    readOnly: true,
    description: 'A shipping method type registered on the store (not bound to a zone).',
    properties: {
      id: { type: 'string', example: 'flat_rate' },
      title: { type: 'string', example: 'Flat rate' },
      description: { type: 'string' },
      _links: ref('Links'),
    },
  },

  PaymentGateway: {
    type: 'object',
    properties: {
      id: { type: 'string', readOnly: true, example: 'razorpay' },
      title: { type: 'string', example: 'Credit Card (Razorpay)' },
      description: { type: 'string' },
      order: { oneOf: [{ type: 'integer' }, { type: 'string' }], description: 'Display order.' },
      enabled: { type: 'boolean' },
      method_title: { type: 'string', readOnly: true },
      method_description: { type: 'string', readOnly: true },
      method_supports: { type: 'array', readOnly: true, items: { type: 'string' }, example: ['products', 'refunds'] },
      settings: { type: 'object', additionalProperties: ref('SettingOption') },
      needs_setup: { type: 'boolean', readOnly: true },
      post_install_scripts: { type: 'array', readOnly: true, items: { type: 'string' } },
      settings_url: { type: 'string', format: 'uri', readOnly: true },
      connection_url: { type: 'string', format: 'uri', nullable: true, readOnly: true },
      setup_help_text: { type: 'string', nullable: true, readOnly: true },
      required_settings_keys: { type: 'array', readOnly: true, items: { type: 'string' } },
      _links: ref('Links'),
    },
  },

  SettingGroup: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'products' },
      label: { type: 'string', example: 'Products' },
      description: { type: 'string' },
      parent_id: { type: 'string', example: '' },
      sub_groups: { type: 'array', items: { type: 'string' } },
      _links: ref('Links'),
    },
  },

  SettingOption: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'woocommerce_currency' },
      label: { type: 'string', example: 'Currency' },
      description: { type: 'string' },
      value: {
        description: 'Current value. Type depends on the setting.',
        oneOf: [
          { type: 'string' },
          { type: 'number' },
          { type: 'boolean' },
          { type: 'array', items: {} },
          { type: 'object', additionalProperties: true },
        ],
        nullable: true,
      },
      default: {
        oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }, { type: 'array', items: {} }],
        nullable: true,
      },
      tip: { type: 'string' },
      placeholder: { type: 'string' },
      type: {
        type: 'string',
        description: 'Control type used to render the setting.',
        example: 'select',
      },
      options: { type: 'object', additionalProperties: { type: 'string' } },
      group_id: { type: 'string', readOnly: true },
      _links: ref('Links'),
    },
  },

  Webhook: {
    type: 'object',
    description:
      'An outbound webhook. WooCommerce POSTs a JSON payload to `delivery_url` when `topic` fires.',
    properties: {
      id: { type: 'integer', readOnly: true },
      name: { type: 'string', example: 'Order created -> fulfilment service' },
      status: { type: 'string', enum: ['active', 'paused', 'disabled'], default: 'active' },
      topic: {
        type: 'string',
        description: '`{resource}.{event}`, e.g. `order.created`, `product.updated`, `customer.deleted`.',
        example: 'order.created',
      },
      resource: { type: 'string', readOnly: true, example: 'order' },
      event: { type: 'string', readOnly: true, example: 'created' },
      hooks: { type: 'array', readOnly: true, items: { type: 'string' } },
      delivery_url: { type: 'string', format: 'uri', example: 'https://hooks.example.com/woo/orders' },
      secret: {
        type: 'string',
        writeOnly: true,
        description: 'Used to sign the payload (`X-WC-Webhook-Signature`). Defaults to the API consumer secret.',
      },
      date_created: { type: 'string', format: 'date-time', readOnly: true },
      date_created_gmt: { type: 'string', format: 'date-time', readOnly: true },
      date_modified: { type: 'string', format: 'date-time', readOnly: true },
      date_modified_gmt: { type: 'string', format: 'date-time', readOnly: true },
      _links: ref('Links'),
    },
    required: ['topic', 'delivery_url'],
  },

  SystemStatus: {
    type: 'object',
    readOnly: true,
    description: 'Diagnostics snapshot: environment, database, active plugins, theme and settings.',
    properties: {
      environment: { type: 'object', additionalProperties: true },
      database: { type: 'object', additionalProperties: true },
      active_plugins: { type: 'array', items: { type: 'object', additionalProperties: true } },
      inactive_plugins: { type: 'array', items: { type: 'object', additionalProperties: true } },
      dropins_mu_plugins: { type: 'object', additionalProperties: true },
      theme: { type: 'object', additionalProperties: true },
      settings: { type: 'object', additionalProperties: true },
      security: { type: 'object', additionalProperties: true },
      pages: { type: 'array', items: { type: 'object', additionalProperties: true } },
      post_type_counts: { type: 'array', items: { type: 'object', additionalProperties: true } },
      _links: ref('Links'),
    },
  },

  SystemStatusTool: {
    type: 'object',
    description: 'A maintenance tool. `PUT` on the item endpoint runs it.',
    properties: {
      id: { type: 'string', example: 'clear_transients' },
      name: { type: 'string', example: 'WooCommerce transients' },
      action: { type: 'string', example: 'Clear transients' },
      description: { type: 'string' },
      success: { type: 'boolean', readOnly: true },
      message: { type: 'string', readOnly: true },
      confirm: { type: 'boolean', writeOnly: true, description: 'Must be true to actually run the tool.' },
      _links: ref('Links'),
    },
  },

  DataCountry: {
    type: 'object',
    readOnly: true,
    properties: {
      code: { type: 'string', example: 'IN' },
      name: { type: 'string', example: 'India' },
      states: {
        type: 'array',
        items: {
          type: 'object',
          properties: { code: { type: 'string', example: 'KA' }, name: { type: 'string', example: 'Karnataka' } },
        },
      },
      _links: ref('Links'),
    },
  },

  DataCurrency: {
    type: 'object',
    readOnly: true,
    properties: {
      code: { type: 'string', example: 'INR' },
      name: { type: 'string', example: 'Indian rupee' },
      symbol: { type: 'string', example: '&#8377;' },
      _links: ref('Links'),
    },
  },

  DataContinent: {
    type: 'object',
    readOnly: true,
    properties: {
      code: { type: 'string', example: 'AS' },
      name: { type: 'string', example: 'Asia' },
      countries: { type: 'array', items: { type: 'object', additionalProperties: true } },
      _links: ref('Links'),
    },
  },
} as const;
