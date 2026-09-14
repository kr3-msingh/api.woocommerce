import { paramRef, type Parameter, type PathMap } from '../types';
import { crudPaths } from './crud';

const q = (
  name: string,
  description: string,
  schema: Record<string, unknown>,
): Parameter => ({ name, in: 'query', description, schema: schema as never });

const DATE_FILTERS: Parameter[] = [
  paramRef('After'),
  paramRef('Before'),
  paramRef('ModifiedAfter'),
  paramRef('ModifiedBefore'),
  paramRef('DatesAreGmt'),
];

const PRODUCT_FILTERS: Parameter[] = [
  ...DATE_FILTERS,
  paramRef('Parent'),
  paramRef('ParentExclude'),
  q('slug', 'Limit result set to products with a specific slug.', { type: 'string' }),
  q('status', 'Limit result set to products assigned a specific status.', {
    type: 'string',
    enum: ['any', 'draft', 'pending', 'private', 'publish'],
    default: 'any',
  }),
  q('type', 'Limit result set to products assigned a specific type.', {
    type: 'string',
    enum: ['simple', 'grouped', 'external', 'variable'],
  }),
  q('sku', 'Limit result set to products with a specific SKU. Comma-separate for several.', {
    type: 'string',
    example: 'POUR-CER-01',
  }),
  q('featured', 'Limit result set to featured products.', { type: 'boolean' }),
  q('category', 'Limit result set to products assigned a specific category ID.', {
    type: 'string',
    example: '19',
  }),
  q('tag', 'Limit result set to products assigned a specific tag ID.', { type: 'string' }),
  q('shipping_class', 'Limit result set to products assigned a specific shipping class ID.', {
    type: 'string',
  }),
  q('attribute', 'Limit result set to products with a specific attribute taxonomy.', {
    type: 'string',
    example: 'pa_size',
  }),
  q('attribute_term', 'Limit result set to products with a specific attribute term ID. Requires `attribute`.', {
    type: 'string',
  }),
  q('tax_class', 'Limit result set to products with a specific tax class.', { type: 'string' }),
  q('on_sale', 'Limit result set to products on sale.', { type: 'boolean' }),
  q('min_price', 'Limit result set to products based on a minimum price.', { type: 'string' }),
  q('max_price', 'Limit result set to products based on a maximum price.', { type: 'string' }),
  q('stock_status', 'Limit result set to products with a specific stock status.', {
    type: 'string',
    enum: ['instock', 'outofstock', 'onbackorder'],
  }),
];

export const productPaths: PathMap = {
  ...crudPaths({
    tag: 'Products',
    schema: 'Product',
    basePath: '/products',
    singular: 'product',
    plural: 'products',
    operationIdSingular: 'Product',
    operationIdPlural: 'Products',
    listParameters: PRODUCT_FILTERS,
    orderByValues: ['date', 'id', 'include', 'title', 'slug', 'modified', 'menu_order', 'price', 'popularity', 'rating'],
    listDescription:
      'Filters combine with AND. `search` matches the title, SKU-ish content and excerpt depending on store configuration — ' +
      'use `sku` for an exact SKU lookup.',
    deleteDescription:
      'Deleting a variable product also removes its variations. Trashed products keep their IDs and can be restored from wp-admin.',
  }),

  ...crudPaths({
    tag: 'Product variations',
    schema: 'ProductVariation',
    basePath: '/products/{product_id}/variations',
    singular: 'variation',
    plural: 'variations',
    operationIdSingular: 'ProductVariation',
    operationIdPlural: 'ProductVariations',
    pathParameters: [paramRef('ProductIdPath')],
    listParameters: [
      ...DATE_FILTERS,
      q('slug', 'Limit result set to variations with a specific slug.', { type: 'string' }),
      q('status', 'Limit result set to variations assigned a specific status.', {
        type: 'string',
        enum: ['any', 'draft', 'pending', 'private', 'publish'],
        default: 'any',
      }),
      q('sku', 'Limit result set to variations with a specific SKU.', { type: 'string' }),
      q('on_sale', 'Limit result set to variations on sale.', { type: 'boolean' }),
      q('min_price', 'Limit result set to variations based on a minimum price.', { type: 'string' }),
      q('max_price', 'Limit result set to variations based on a maximum price.', { type: 'string' }),
      q('stock_status', 'Limit result set to variations with a specific stock status.', {
        type: 'string',
        enum: ['instock', 'outofstock', 'onbackorder'],
      }),
    ],
    listDescription:
      'Variations only exist on products whose `type` is `variable`. The parent product’s `attributes` entries must have `variation: true` before a matching variation can be created.',
  }),

  ...crudPaths({
    tag: 'Product categories',
    schema: 'ProductCategory',
    basePath: '/products/categories',
    singular: 'product category',
    plural: 'product categories',
    operationIdSingular: 'ProductCategory',
    operationIdPlural: 'ProductCategories',
    forceRequired: true,
    orderByValues: ['name', 'id', 'include', 'slug', 'term_group', 'description', 'count'],
    listParameters: [
      paramRef('HideEmpty'),
      paramRef('Parent'),
      q('product', 'Limit result set to categories assigned to a specific product.', { type: 'integer' }),
      q('slug', 'Limit result set to categories with a specific slug.', { type: 'string' }),
    ],
  }),

  ...crudPaths({
    tag: 'Product tags',
    schema: 'ProductTag',
    basePath: '/products/tags',
    singular: 'product tag',
    plural: 'product tags',
    operationIdSingular: 'ProductTag',
    operationIdPlural: 'ProductTags',
    forceRequired: true,
    orderByValues: ['name', 'id', 'include', 'slug', 'term_group', 'description', 'count'],
    listParameters: [
      paramRef('HideEmpty'),
      q('product', 'Limit result set to tags assigned to a specific product.', { type: 'integer' }),
      q('slug', 'Limit result set to tags with a specific slug.', { type: 'string' }),
    ],
  }),

  ...crudPaths({
    tag: 'Product attributes',
    schema: 'ProductAttribute',
    basePath: '/products/attributes',
    singular: 'product attribute',
    plural: 'product attributes',
    operationIdSingular: 'ProductAttribute',
    operationIdPlural: 'ProductAttributes',
    forceRequired: true,
    omitCollectionParameters: ['search', 'offset', 'order', 'orderby', 'include', 'exclude', 'page', 'per_page'],
    listDescription:
      'Global attributes are store-wide taxonomies (`pa_*`). Per-product custom attributes are not returned here — they live on the product itself.',
  }),

  ...crudPaths({
    tag: 'Product attributes',
    schema: 'ProductAttributeTerm',
    basePath: '/products/attributes/{attribute_id}/terms',
    singular: 'attribute term',
    plural: 'attribute terms',
    operationIdSingular: 'ProductAttributeTerm',
    operationIdPlural: 'ProductAttributeTerms',
    pathParameters: [paramRef('AttributeIdPath')],
    forceRequired: true,
    orderByValues: ['name', 'id', 'include', 'slug', 'term_group', 'description', 'count', 'menu_order'],
    listParameters: [
      paramRef('HideEmpty'),
      q('product', 'Limit result set to terms assigned to a specific product.', { type: 'integer' }),
      q('slug', 'Limit result set to terms with a specific slug.', { type: 'string' }),
    ],
  }),

  ...crudPaths({
    tag: 'Product shipping classes',
    schema: 'ProductShippingClass',
    basePath: '/products/shipping_classes',
    singular: 'shipping class',
    plural: 'shipping classes',
    operationIdSingular: 'ProductShippingClass',
    operationIdPlural: 'ProductShippingClasses',
    forceRequired: true,
    orderByValues: ['name', 'id', 'include', 'slug', 'term_group', 'description', 'count'],
    listParameters: [
      paramRef('HideEmpty'),
      q('product', 'Limit result set to classes assigned to a specific product.', { type: 'integer' }),
      q('slug', 'Limit result set to classes with a specific slug.', { type: 'string' }),
    ],
  }),

  ...crudPaths({
    tag: 'Product reviews',
    schema: 'ProductReview',
    basePath: '/products/reviews',
    singular: 'product review',
    plural: 'product reviews',
    operationIdSingular: 'ProductReview',
    operationIdPlural: 'ProductReviews',
    forceRequired: true,
    listParameters: [
      ...DATE_FILTERS,
      {
        name: 'product',
        in: 'query',
        description: 'Limit result set to reviews assigned to specific product IDs.',
        schema: { type: 'array', items: { type: 'integer' } },
        style: 'form',
        explode: false,
      },
      q('status', 'Limit result set to reviews with a specific status.', {
        type: 'string',
        enum: ['all', 'hold', 'approved', 'spam', 'trash'],
        default: 'approved',
      }),
      q('reviewer_email', 'Limit result set to reviews from a specific email address.', {
        type: 'string',
        format: 'email',
      }),
    ],
  }),
};
