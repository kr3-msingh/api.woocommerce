import type { SchemaMap } from '../../types';
import { sharedSchemas } from './shared';
import { productSchemas } from './product';
import { orderSchemas } from './order';
import { customerSchemas } from './customer';
import { storeSchemas } from './store';
import { reportSchemas } from './report';

/** Every named schema exposed under `#/components/schemas`. */
export const schemas: SchemaMap = {
  ...sharedSchemas,
  ...productSchemas,
  ...orderSchemas,
  ...customerSchemas,
  ...storeSchemas,
  ...reportSchemas,
};
