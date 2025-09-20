import componentLoader from './component-loader.js';
import Material from '../db/models/Material.js';

// AdminJS types are not required for the compiled runtime; use any to avoid
// TypeScript build issues in the deployment pipeline.
const options: any = {
  componentLoader,
  rootPath: '/admin',
  resources: [Material],
  databases: [],
};

export default options;
