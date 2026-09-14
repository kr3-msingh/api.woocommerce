import {
  jsonBody,
  jsonListResponse,
  jsonResponse,
  paramRef,
  ref,
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

const READ_ERRORS = {
  '401': responseRef('Unauthorized'),
  '403': responseRef('Forbidden'),
  '429': responseRef('TooManyRequests'),
  '500': responseRef('ServerError'),
};

const WRITE_ERRORS = { '400': responseRef('BadRequest'), ...READ_ERRORS };

export const storePaths: PathMap = {
  // ---------------------------------------------------------------- taxes ---
  ...crudPaths({
    tag: 'Tax rates',
    schema: 'TaxRate',
    basePath: '/taxes',
    singular: 'tax rate',
    plural: 'tax rates',
    operationIdSingular: 'TaxRate',
    operationIdPlural: 'TaxRates',
    forceRequired: true,
    orderByValues: ['order', 'id', 'include'],
    omitCollectionParameters: ['search', 'offset'],
    listParameters: [
      q('class', 'Limit result set to tax rates in a specific tax class.', {
        type: 'string',
        default: 'standard',
      }),
    ],
    listDescription:
      'Rates are matched most-specific-first: postcode, then city, then state, then country. `priority` groups rates that stack.',
  }),

  '/taxes/classes': {
    get: {
      tags: ['Tax rates'],
      operationId: 'listTaxClasses',
      summary: 'List tax classes',
      description: 'The tax classes configured on the store, e.g. standard, reduced rate, zero rate.',
      responses: { '200': jsonListResponse('All tax classes.', 'TaxClass'), ...READ_ERRORS },
    },
    post: {
      tags: ['Tax rates'],
      operationId: 'createTaxClass',
      summary: 'Create a tax class',
      description: 'Create a tax class. The slug is derived from the name.',
      requestBody: jsonBody(ref('TaxClass'), 'The tax class to create.'),
      responses: { '201': jsonResponse('The created tax class.', ref('TaxClass')), ...WRITE_ERRORS },
    },
  },

  '/taxes/classes/{slug}': {
    parameters: [
      {
        name: 'slug',
        in: 'path',
        required: true,
        description: 'Tax class slug.',
        schema: { type: 'string' },
        example: 'reduced-rate',
      },
    ],
    delete: {
      tags: ['Tax rates'],
      operationId: 'deleteTaxClass',
      summary: 'Delete a tax class',
      description: 'Permanently delete a tax class. Products still referencing it fall back to standard.',
      parameters: [
        {
          name: 'force',
          in: 'query',
          required: true,
          description: 'Must be `true`; tax classes cannot be trashed.',
          schema: { type: 'boolean', enum: [true], default: true },
        },
      ],
      responses: {
        '200': jsonResponse('The deleted tax class.', ref('TaxClass')),
        '404': responseRef('NotFound'),
        ...WRITE_ERRORS,
      },
    },
  },

  // ------------------------------------------------------------- shipping ---
  ...crudPaths({
    tag: 'Shipping',
    schema: 'ShippingZone',
    basePath: '/shipping/zones',
    singular: 'shipping zone',
    plural: 'shipping zones',
    operationIdSingular: 'ShippingZone',
    operationIdPlural: 'ShippingZones',
    batch: false,
    forceRequired: true,
    omitCollectionParameters: ['search', 'offset', 'order', 'orderby', 'include', 'exclude', 'page', 'per_page'],
    listDescription:
      'Zone `0` is the built-in "Locations not covered by your other zones" fallback and cannot be deleted.',
  }),

  '/shipping/zones/{zone_id}/locations': {
    parameters: [paramRef('ZoneIdPath')],
    get: {
      tags: ['Shipping'],
      operationId: 'listShippingZoneLocations',
      summary: 'List locations in a shipping zone',
      description: 'The countries, states, postcodes or continents that route orders into this zone.',
      responses: {
        '200': jsonListResponse('Locations attached to the zone.', 'ShippingZoneLocation'),
        '404': responseRef('NotFound'),
        ...READ_ERRORS,
      },
    },
    put: {
      tags: ['Shipping'],
      operationId: 'replaceShippingZoneLocations',
      summary: 'Replace the locations in a shipping zone',
      description:
        'Replaces the entire location set for the zone. Send the full desired list — omitted locations are removed.',
      requestBody: jsonBody(
        { type: 'array', items: ref('ShippingZoneLocation') },
        'The complete set of locations for this zone.',
      ),
      responses: {
        '200': jsonListResponse('The zone’s locations after the update.', 'ShippingZoneLocation'),
        '404': responseRef('NotFound'),
        ...WRITE_ERRORS,
      },
    },
  },

  ...crudPaths({
    tag: 'Shipping',
    schema: 'ShippingZoneMethod',
    basePath: '/shipping/zones/{zone_id}/methods',
    singular: 'shipping method instance',
    plural: 'shipping method instances',
    operationIdSingular: 'ShippingZoneMethod',
    operationIdPlural: 'ShippingZoneMethods',
    pathParameters: [paramRef('ZoneIdPath')],
    idParameter: paramRef('InstanceIdPath'),
    idName: 'instance_id',
    batch: false,
    forceRequired: true,
    omitCollectionParameters: ['search', 'offset', 'order', 'orderby', 'include', 'exclude', 'page', 'per_page'],
    listDescription:
      'Each entry is one configured instance of a method (e.g. two different flat rates in the same zone), identified by `instance_id`.',
  }),

  '/shipping_methods': {
    get: {
      tags: ['Shipping'],
      operationId: 'listShippingMethods',
      summary: 'List available shipping method types',
      description:
        'The shipping method types registered on the store (flat rate, free shipping, local pickup, plus any from plugins). ' +
        'Use the `id` here when attaching a method to a zone.',
      parameters: [paramRef('Context')],
      responses: {
        '200': jsonListResponse('Registered shipping method types.', 'ShippingMethod'),
        ...READ_ERRORS,
      },
    },
  },

  '/shipping_methods/{id}': {
    parameters: [paramRef('StringId')],
    get: {
      tags: ['Shipping'],
      operationId: 'getShippingMethod',
      summary: 'Retrieve a shipping method type',
      parameters: [paramRef('Context')],
      responses: {
        '200': jsonResponse('The requested shipping method type.', ref('ShippingMethod')),
        '404': responseRef('NotFound'),
        ...READ_ERRORS,
      },
    },
  },

  // ------------------------------------------------------ payment gateways ---
  '/payment_gateways': {
    get: {
      tags: ['Payment gateways'],
      operationId: 'listPaymentGateways',
      summary: 'List payment gateways',
      description:
        'All installed gateways, enabled or not, including their settings. Secrets are redacted unless `context=edit` and the key has write permission.',
      parameters: [paramRef('Context')],
      responses: {
        '200': jsonListResponse('Installed payment gateways.', 'PaymentGateway'),
        ...READ_ERRORS,
      },
    },
  },

  '/payment_gateways/{id}': {
    parameters: [paramRef('StringId')],
    get: {
      tags: ['Payment gateways'],
      operationId: 'getPaymentGateway',
      summary: 'Retrieve a payment gateway',
      parameters: [paramRef('Context')],
      responses: {
        '200': jsonResponse('The requested gateway.', ref('PaymentGateway')),
        '404': responseRef('NotFound'),
        ...READ_ERRORS,
      },
    },
    put: {
      tags: ['Payment gateways'],
      operationId: 'updatePaymentGateway',
      summary: 'Update a payment gateway',
      description:
        'Enable/disable a gateway, retitle it, reorder it, or change its settings. Only supply the settings keys you intend to change.',
      requestBody: jsonBody(ref('PaymentGateway'), 'Fields to change.'),
      responses: {
        '200': jsonResponse('The updated gateway.', ref('PaymentGateway')),
        '404': responseRef('NotFound'),
        ...WRITE_ERRORS,
      },
    },
  },

  // ------------------------------------------------------------- settings ---
  '/settings': {
    get: {
      tags: ['Settings'],
      operationId: 'listSettingGroups',
      summary: 'List setting groups',
      description: 'The top-level settings groups, mirroring the tabs in WooCommerce > Settings.',
      responses: { '200': jsonListResponse('Setting groups.', 'SettingGroup'), ...READ_ERRORS },
    },
  },

  '/settings/{group_id}': {
    parameters: [paramRef('GroupIdPath')],
    get: {
      tags: ['Settings'],
      operationId: 'listSettingOptions',
      summary: 'List options in a setting group',
      responses: {
        '200': jsonListResponse('Options in the group.', 'SettingOption'),
        '404': responseRef('NotFound'),
        ...READ_ERRORS,
      },
    },
  },

  '/settings/{group_id}/{id}': {
    parameters: [paramRef('GroupIdPath'), paramRef('StringId')],
    get: {
      tags: ['Settings'],
      operationId: 'getSettingOption',
      summary: 'Retrieve a setting option',
      responses: {
        '200': jsonResponse('The requested option.', ref('SettingOption')),
        '404': responseRef('NotFound'),
        ...READ_ERRORS,
      },
    },
    put: {
      tags: ['Settings'],
      operationId: 'updateSettingOption',
      summary: 'Update a setting option',
      description: 'Send `{ "value": ... }`. The accepted value type depends on the option’s `type`.',
      requestBody: jsonBody(ref('SettingOption'), 'The new value.'),
      responses: {
        '200': jsonResponse('The updated option.', ref('SettingOption')),
        '404': responseRef('NotFound'),
        ...WRITE_ERRORS,
      },
    },
  },

  '/settings/{group_id}/batch': {
    parameters: [paramRef('GroupIdPath')],
    post: {
      tags: ['Settings'],
      operationId: 'batchSettingOptions',
      summary: 'Batch update setting options',
      description: 'Update several options in one group at once. Only the `update` action is supported.',
      requestBody: jsonBody(
        {
          type: 'object',
          properties: { update: { type: 'array', items: ref('SettingOption') } },
        },
        'Options to update.',
      ),
      responses: {
        '200': jsonResponse('Results for each update.', ref('BatchResponse')),
        ...WRITE_ERRORS,
      },
    },
  },

  // ------------------------------------------------------------- webhooks ---
  ...crudPaths({
    tag: 'Webhooks',
    schema: 'Webhook',
    basePath: '/webhooks',
    singular: 'webhook',
    plural: 'webhooks',
    operationIdSingular: 'Webhook',
    operationIdPlural: 'Webhooks',
    forceRequired: true,
    listParameters: [
      paramRef('After'),
      paramRef('Before'),
      q('status', 'Limit result set to webhooks with a specific status.', {
        type: 'string',
        enum: ['all', 'active', 'paused', 'disabled'],
        default: 'all',
      }),
    ],
    listDescription:
      'Webhooks are how you get push instead of poll. WooCommerce signs each delivery with `X-WC-Webhook-Signature` ' +
      '(base64 HMAC-SHA256 of the raw body using the webhook secret) — always verify it before trusting a payload.',
  }),

  // -------------------------------------------------------- system status ---
  '/system_status': {
    get: {
      tags: ['System status'],
      operationId: 'getSystemStatus',
      summary: 'Retrieve the system status report',
      description:
        'Full diagnostics: PHP/WP versions, database sizes, active plugins, theme info and WooCommerce settings. ' +
        'The single best endpoint for "why is this store behaving oddly".',
      responses: {
        '200': jsonResponse('The system status report.', ref('SystemStatus')),
        ...READ_ERRORS,
      },
    },
  },

  '/system_status/tools': {
    get: {
      tags: ['System status'],
      operationId: 'listSystemStatusTools',
      summary: 'List maintenance tools',
      description: 'Tools available under WooCommerce > Status > Tools.',
      responses: { '200': jsonListResponse('Available tools.', 'SystemStatusTool'), ...READ_ERRORS },
    },
  },

  '/system_status/tools/{id}': {
    parameters: [paramRef('StringId')],
    get: {
      tags: ['System status'],
      operationId: 'getSystemStatusTool',
      summary: 'Retrieve a maintenance tool',
      responses: {
        '200': jsonResponse('The requested tool.', ref('SystemStatusTool')),
        '404': responseRef('NotFound'),
        ...READ_ERRORS,
      },
    },
    put: {
      tags: ['System status'],
      operationId: 'runSystemStatusTool',
      summary: 'Run a maintenance tool',
      description:
        'Executes the tool. Send `{ "confirm": true }`. Some tools (regenerate lookup tables, clear sessions) ' +
        'are destructive or long-running — do not call these casually against production.',
      requestBody: jsonBody(
        { type: 'object', properties: { confirm: { type: 'boolean', enum: [true] } }, required: ['confirm'] },
        'Confirmation flag.',
      ),
      responses: {
        '200': jsonResponse('The tool result, including `success` and `message`.', ref('SystemStatusTool')),
        '404': responseRef('NotFound'),
        ...WRITE_ERRORS,
      },
    },
  },

  // ------------------------------------------------------------ meta data ---
  '/data': {
    get: {
      tags: ['Data'],
      operationId: 'listDataIndex',
      summary: 'List data endpoints',
      description: 'Index of the read-only reference data available (countries, currencies, continents).',
      responses: {
        '200': {
          description: 'Available data endpoints.',
          content: {
            'application/json': {
              schema: { type: 'array', items: { type: 'object', additionalProperties: true } },
            },
          },
        },
        ...READ_ERRORS,
      },
    },
  },

  '/data/countries': {
    get: {
      tags: ['Data'],
      operationId: 'listCountries',
      summary: 'List countries and their states',
      description: 'ISO country codes with the state/province lists WooCommerce validates addresses against.',
      responses: { '200': jsonListResponse('All countries.', 'DataCountry'), ...READ_ERRORS },
    },
  },

  '/data/countries/{location}': {
    parameters: [
      {
        name: 'location',
        in: 'path',
        required: true,
        description: 'ISO 3166-1 alpha-2 country code.',
        schema: { type: 'string' },
        example: 'IN',
      },
    ],
    get: {
      tags: ['Data'],
      operationId: 'getCountry',
      summary: 'Retrieve a country',
      responses: {
        '200': jsonResponse('The requested country.', ref('DataCountry')),
        '404': responseRef('NotFound'),
        ...READ_ERRORS,
      },
    },
  },

  '/data/currencies': {
    get: {
      tags: ['Data'],
      operationId: 'listCurrencies',
      summary: 'List currencies',
      responses: { '200': jsonListResponse('All currencies.', 'DataCurrency'), ...READ_ERRORS },
    },
  },

  '/data/currencies/current': {
    get: {
      tags: ['Data'],
      operationId: 'getCurrentCurrency',
      summary: 'Retrieve the store currency',
      description: 'The currency the store is currently configured to charge in.',
      responses: {
        '200': jsonResponse('The store currency.', ref('DataCurrency')),
        ...READ_ERRORS,
      },
    },
  },

  '/data/currencies/{currency}': {
    parameters: [
      {
        name: 'currency',
        in: 'path',
        required: true,
        description: 'ISO 4217 currency code.',
        schema: { type: 'string' },
        example: 'INR',
      },
    ],
    get: {
      tags: ['Data'],
      operationId: 'getCurrency',
      summary: 'Retrieve a currency',
      responses: {
        '200': jsonResponse('The requested currency.', ref('DataCurrency')),
        '404': responseRef('NotFound'),
        ...READ_ERRORS,
      },
    },
  },

  '/data/continents': {
    get: {
      tags: ['Data'],
      operationId: 'listContinents',
      summary: 'List continents',
      description: 'Continents with their countries — useful when building shipping zones programmatically.',
      responses: { '200': jsonListResponse('All continents.', 'DataContinent'), ...READ_ERRORS },
    },
  },

  '/data/continents/{location}': {
    parameters: [
      {
        name: 'location',
        in: 'path',
        required: true,
        description: 'Two-letter continent code, e.g. `AS`, `EU`, `NA`.',
        schema: { type: 'string' },
        example: 'AS',
      },
    ],
    get: {
      tags: ['Data'],
      operationId: 'getContinent',
      summary: 'Retrieve a continent',
      responses: {
        '200': jsonResponse('The requested continent.', ref('DataContinent')),
        '404': responseRef('NotFound'),
        ...READ_ERRORS,
      },
    },
  },
};
