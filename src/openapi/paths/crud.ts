import type { OpenAPIV3 } from 'openapi-types';
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

export interface CrudOptions {
  /** Tag the operations are grouped under in Swagger UI. */
  tag: string;
  /** Schema name in `#/components/schemas`, e.g. `Product`. */
  schema: string;
  /** Collection path relative to the API root, e.g. `/products`. */
  basePath: string;
  /** Singular human label used in summaries, e.g. `product`. */
  singular: string;
  /** Plural human label used in summaries, e.g. `products`. */
  plural: string;
  /** operationId prefix, e.g. `product` -> `listProducts`, `getProduct`. */
  operationIdSingular: string;
  /** operationId plural form, e.g. `Products`. */
  operationIdPlural: string;
  /** Path-level parameters shared by every operation (e.g. a parent ID). */
  pathParameters?: Parameter[];
  /** Extra query parameters accepted by the list operation. */
  listParameters?: Parameter[];
  /** Replace the default `orderby` enum for this resource. */
  orderByValues?: string[];
  /** Drop these default collection parameters (by name) from the list operation. */
  omitCollectionParameters?: string[];
  /** Parameter describing the resource identifier. Defaults to the integer `Id`. */
  idParameter?: Parameter;
  /** Placeholder used when building the item path. Defaults to `id`. */
  idName?: string;
  /** Emit the `/batch` endpoint. Default true. */
  batch?: boolean;
  /** Emit DELETE. Default true. */
  deletable?: boolean;
  /** Emit POST/PUT/DELETE at all. Default false (i.e. writable). */
  readOnly?: boolean;
  /** Whether `?force=true` is mandatory for DELETE. */
  forceRequired?: boolean;
  /** Extra prose appended to the collection GET description. */
  listDescription?: string;
  /** Extra prose appended to the DELETE description. */
  deleteDescription?: string;
  /** Extra query parameters accepted by the delete operation. */
  deleteParameters?: Parameter[];
}

const COLLECTION_PARAMS: Array<[name: string, parameter: Parameter]> = [
  ['context', paramRef('Context')],
  ['page', paramRef('Page')],
  ['per_page', paramRef('PerPage')],
  ['search', paramRef('Search')],
  ['offset', paramRef('Offset')],
  ['order', paramRef('Order')],
  ['orderby', paramRef('OrderBy')],
  ['include', paramRef('Include')],
  ['exclude', paramRef('Exclude')],
];

const collectionParameters = (
  omit: string[],
  orderByValues: string[] | undefined,
): Parameter[] =>
  COLLECTION_PARAMS.filter(([name]) => !omit.includes(name)).map(([name, parameter]) =>
    name === 'orderby' && orderByValues
      ? {
          name: 'orderby',
          in: 'query',
          description: 'Field to sort the collection by.',
          schema: { type: 'string', enum: orderByValues, default: orderByValues[0] },
        }
      : parameter,
  );

const ERRORS = {
  '400': responseRef('BadRequest'),
  '401': responseRef('Unauthorized'),
  '403': responseRef('Forbidden'),
  '429': responseRef('TooManyRequests'),
  '500': responseRef('ServerError'),
};

const ITEM_ERRORS = { ...ERRORS, '404': responseRef('NotFound') };

/** Writes can additionally be refused by a read-only gateway. */
const WRITE_ERRORS = { ...ERRORS, '405': responseRef('MethodNotAllowed') };
const ITEM_WRITE_ERRORS = { ...ITEM_ERRORS, '405': responseRef('MethodNotAllowed') };

/**
 * Builds the five-operation CRUD surface (plus `/batch`) that nearly every
 * WooCommerce resource exposes, so the per-resource files only declare what is
 * genuinely different.
 */
export const crudPaths = (options: CrudOptions): PathMap => {
  const {
    tag,
    schema,
    basePath,
    singular,
    plural,
    operationIdSingular,
    operationIdPlural,
    pathParameters = [],
    listParameters = [],
    orderByValues,
    omitCollectionParameters = [],
    idParameter = paramRef('Id'),
    idName = 'id',
    batch = true,
    deletable = true,
    readOnly = false,
    forceRequired = false,
    listDescription = '',
    deleteDescription = '',
    deleteParameters = [],
  } = options;

  const itemPath = `${basePath}/{${idName}}`;
  const paths: PathMap = {};

  const collection: OpenAPIV3.PathItemObject = {
    get: {
      tags: [tag],
      operationId: `list${operationIdPlural}`,
      summary: `List ${plural}`,
      description:
        `Retrieve a paginated collection of ${plural}. Pagination totals are returned in the ` +
        '`X-WP-Total` and `X-WP-TotalPages` response headers.' +
        (listDescription ? `\n\n${listDescription}` : ''),
      parameters: [
        ...collectionParameters(omitCollectionParameters, orderByValues),
        ...listParameters,
      ],
      responses: {
        '200': jsonListResponse(`A page of ${plural}.`, schema),
        ...ERRORS,
      },
    },
  };

  if (!readOnly) {
    collection.post = {
      tags: [tag],
      operationId: `create${operationIdSingular}`,
      summary: `Create a ${singular}`,
      description: `Create a new ${singular}. Fields marked read-only are ignored if supplied.`,
      requestBody: jsonBody(ref(schema), `The ${singular} to create.`),
      responses: {
        '201': jsonResponse(`The created ${singular}.`, ref(schema)),
        ...WRITE_ERRORS,
      },
    };
  }

  if (pathParameters.length > 0) collection.parameters = pathParameters;
  paths[basePath] = collection;

  const item: OpenAPIV3.PathItemObject = {
    parameters: [...pathParameters, idParameter],
    get: {
      tags: [tag],
      operationId: `get${operationIdSingular}`,
      summary: `Retrieve a ${singular}`,
      description: `Retrieve a single ${singular} by its identifier.`,
      parameters: [paramRef('Context')],
      responses: {
        '200': jsonResponse(`The requested ${singular}.`, ref(schema)),
        ...ITEM_ERRORS,
      },
    },
  };

  if (!readOnly) {
    item.put = {
      tags: [tag],
      operationId: `update${operationIdSingular}`,
      summary: `Update a ${singular}`,
      description:
        `Partially update a ${singular}. Only the fields present in the body are changed; ` +
        'WooCommerce treats `PUT` as a merge, not a replace.',
      requestBody: jsonBody(ref(schema), 'Fields to change.'),
      responses: {
        '200': jsonResponse(`The updated ${singular}.`, ref(schema)),
        ...ITEM_WRITE_ERRORS,
      },
    };

    if (deletable) {
      item.delete = {
        tags: [tag],
        operationId: `delete${operationIdSingular}`,
        summary: `Delete a ${singular}`,
        description:
          (forceRequired
            ? `This resource does not support the trash, so \`force=true\` is required and deletion is permanent.`
            : `Move the ${singular} to the trash, or delete it permanently with \`force=true\`.`) +
          (deleteDescription ? `\n\n${deleteDescription}` : ''),
        parameters: [
          ...deleteParameters,
          forceRequired
            ? {
                name: 'force',
                in: 'query',
                required: true,
                description: 'Must be `true`; this resource cannot be trashed.',
                schema: { type: 'boolean', enum: [true], default: true },
              }
            : paramRef('Force'),
        ],
        responses: {
          '200': jsonResponse(`The deleted ${singular}.`, ref(schema)),
          ...ITEM_WRITE_ERRORS,
        },
      };
    }
  }

  paths[itemPath] = item;

  if (!readOnly && batch) {
    const batchPath: OpenAPIV3.PathItemObject = {
      post: {
        tags: [tag],
        operationId: `batch${operationIdPlural}`,
        summary: `Batch create, update and delete ${plural}`,
        description:
          `Apply up to 100 create, update and delete operations to ${plural} in a single request. ` +
          'Each action is applied independently — a failure in one entry does not roll back the others; ' +
          'inspect every element of the response for an `error` key.',
        requestBody: jsonBody(ref('BatchRequest'), 'Actions to apply.'),
        responses: {
          '200': jsonResponse('Results for each requested action.', ref('BatchResponse')),
          ...WRITE_ERRORS,
        },
      },
    };
    if (pathParameters.length > 0) batchPath.parameters = pathParameters;
    paths[`${basePath}/batch`] = batchPath;
  }

  return paths;
};
