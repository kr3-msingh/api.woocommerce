import type { OpenAPIV3 } from 'openapi-types';

type ParameterMap = Record<string, OpenAPIV3.ParameterObject>;

const query = (
  name: string,
  description: string,
  schema: OpenAPIV3.SchemaObject,
  extra: Partial<OpenAPIV3.ParameterObject> = {},
): OpenAPIV3.ParameterObject => ({ name, in: 'query', description, schema, ...extra });

/**
 * Reusable parameters. The collection-level ones (`context`, `page`, `per_page`,
 * `search`, `order`, `orderby`, `include`, `exclude`, `offset`) are accepted by
 * essentially every WooCommerce list endpoint.
 */
export const parameters: ParameterMap = {
  Id: {
    name: 'id',
    in: 'path',
    required: true,
    description: 'Unique identifier for the resource.',
    schema: { type: 'integer' },
    example: 799,
  },

  StringId: {
    name: 'id',
    in: 'path',
    required: true,
    description: 'Unique string identifier for the resource.',
    schema: { type: 'string' },
  },

  ProductIdPath: {
    name: 'product_id',
    in: 'path',
    required: true,
    description: 'Unique identifier for the parent product.',
    schema: { type: 'integer' },
    example: 799,
  },

  OrderIdPath: {
    name: 'order_id',
    in: 'path',
    required: true,
    description: 'Unique identifier for the parent order.',
    schema: { type: 'integer' },
    example: 1042,
  },

  AttributeIdPath: {
    name: 'attribute_id',
    in: 'path',
    required: true,
    description: 'Unique identifier for the global attribute.',
    schema: { type: 'integer' },
    example: 3,
  },

  ZoneIdPath: {
    name: 'zone_id',
    in: 'path',
    required: true,
    description: 'Unique identifier for the shipping zone.',
    schema: { type: 'integer' },
    example: 3,
  },

  InstanceIdPath: {
    name: 'instance_id',
    in: 'path',
    required: true,
    description: 'Unique identifier for the shipping method instance within the zone.',
    schema: { type: 'integer' },
  },

  GroupIdPath: {
    name: 'group_id',
    in: 'path',
    required: true,
    description: 'Settings group identifier.',
    schema: { type: 'string' },
    example: 'general',
  },

  Context: query(
    'context',
    'Scope under which the request is made; determines which fields are returned. `view` omits fields that require elevated capabilities.',
    { type: 'string', enum: ['view', 'edit'], default: 'view' },
  ),

  Page: query('page', 'Current page of the collection.', {
    type: 'integer',
    minimum: 1,
    default: 1,
  }),

  PerPage: query('per_page', 'Maximum number of items returned per page.', {
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 10,
  }),

  Search: query('search', 'Limit results to those matching a string.', { type: 'string' }),

  Offset: query('offset', 'Offset the result set by a specific number of items.', {
    type: 'integer',
    minimum: 0,
  }),

  Order: query('order', 'Sort direction.', {
    type: 'string',
    enum: ['asc', 'desc'],
    default: 'desc',
  }),

  OrderBy: query('orderby', 'Field to sort the collection by.', {
    type: 'string',
    enum: ['date', 'id', 'include', 'title', 'slug', 'modified'],
    default: 'date',
  }),

  Include: {
    name: 'include',
    in: 'query',
    description: 'Limit the result set to specific IDs.',
    schema: { type: 'array', items: { type: 'integer' } },
    style: 'form',
    explode: false,
    example: [799, 812],
  },

  Exclude: {
    name: 'exclude',
    in: 'query',
    description: 'Ensure the result set excludes specific IDs.',
    schema: { type: 'array', items: { type: 'integer' } },
    style: 'form',
    explode: false,
  },

  After: query('after', 'Limit response to resources published after a given ISO 8601 date.', {
    type: 'string',
    format: 'date-time',
  }),

  Before: query('before', 'Limit response to resources published before a given ISO 8601 date.', {
    type: 'string',
    format: 'date-time',
  }),

  ModifiedAfter: query(
    'modified_after',
    'Limit response to resources modified after a given ISO 8601 date.',
    { type: 'string', format: 'date-time' },
  ),

  ModifiedBefore: query(
    'modified_before',
    'Limit response to resources modified before a given ISO 8601 date.',
    { type: 'string', format: 'date-time' },
  ),

  DatesAreGmt: query(
    'dates_are_gmt',
    'Interpret `after`/`before` (and their modified variants) as GMT rather than site time.',
    { type: 'boolean', default: false },
  ),

  Force: query(
    'force',
    'Permanently delete the resource instead of moving it to the trash. Required (and forced to `true`) for resources that do not support trashing.',
    { type: 'boolean', default: false },
  ),

  Reassign: query(
    'reassign',
    'User ID to reassign the deleted customer’s posts and orders to.',
    { type: 'integer' },
  ),

  Parent: {
    name: 'parent',
    in: 'query',
    description: 'Limit result set to resources with the specified parent IDs.',
    schema: { type: 'array', items: { type: 'integer' } },
    style: 'form',
    explode: false,
  },

  ParentExclude: {
    name: 'parent_exclude',
    in: 'query',
    description: 'Limit result set to all items except those with the specified parent IDs.',
    schema: { type: 'array', items: { type: 'integer' } },
    style: 'form',
    explode: false,
  },

  HideEmpty: query('hide_empty', 'Hide terms not assigned to any products.', {
    type: 'boolean',
    default: false,
  }),

  ReportPeriod: query('period', 'Preset report period.', {
    type: 'string',
    enum: ['week', 'month', 'last_month', 'year'],
    default: 'week',
  }),

  ReportDateMin: query('date_min', 'Return report data after this date (YYYY-MM-DD).', {
    type: 'string',
    format: 'date',
  }),

  ReportDateMax: query('date_max', 'Return report data before this date (YYYY-MM-DD).', {
    type: 'string',
    format: 'date',
  }),
};
