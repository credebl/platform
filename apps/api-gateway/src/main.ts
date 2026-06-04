import * as dotenv from 'dotenv';

import { bootstrapApiGateway } from './boostrap';

dotenv.config();

// Unique global symbol — prevents double bootstrap in same process
const BOOTSTRAP_FLAG = '__credebl_api_gateway_started__';

async function mainEntry(): Promise<void> {
  // If already bootstrapped by something else, do nothing.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((globalThis as any)[BOOTSTRAP_FLAG]) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any)[BOOTSTRAP_FLAG] = true;

  try {
    // default options when running package directly
    await bootstrapApiGateway(process.env.API_GATEWAY_PORT, {
      overrides: [],
      controllerOverrides: [],
      importedModules: []
    });
  } catch (err) {
    // let orchestrator see the failure
    // eslint-disable-next-line no-console
    console.error('Failed to bootstrap API Gateway:', err);
    process.exit(1);
  }
}

/**
 * Auto-run only when this file is executed directly (CJS-style).
 *
 * This is the standard, reliable check for most Node workflows (ts-node, node after tsc).
 * If you also compile to native ESM and run as ESM, add an additional check for import.meta.main.
 */
if ('undefined' !== typeof require && require.main === module) {
  void mainEntry();
}

// NOTE: if consumers import this file, nothing is started automatically.
// They should call `bootstrapApiGateway()` from '@credebl/api-gateway/dist/bootstrap' or the package entrypoint.
