import type { PathMap } from '../types';
import { productPaths } from './products';
import { orderPaths } from './orders';
import { customerPaths } from './customers';
import { storePaths } from './store';
import { reportPaths } from './reports';

/** Every documented operation, assembled in the order the tags appear in the UI. */
export const paths: PathMap = {
  ...productPaths,
  ...orderPaths,
  ...customerPaths,
  ...reportPaths,
  ...storePaths,
};
