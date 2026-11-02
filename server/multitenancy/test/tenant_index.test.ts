/*
 *   Copyright OpenSearch Contributors
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import { MAX_INTEGER } from '../../../common';
import { migrateTenantIndices } from '../tenant_index';

describe('Tenant index template', () => {
  const mockOpenSearchClient = {
    indices: {
      putIndexTemplate: jest.fn().mockImplementation((template) => {
        return template;
      }),
    },
  };

  const priority = MAX_INTEGER;

  it('put index template', () => {
    const result = mockOpenSearchClient.indices.putIndexTemplate({
      name: 'test_index_template_a',
      body: {
        priority,
        index_patterns: 'test_index_patterns_a',
        template: {
          settings: {
            number_of_shards: 1,
          },
        },
      },
    });
    expect(result.body.priority).toEqual(priority);
  });
});

jest.mock('../../../../../src/core/server/saved_objects/migrations/core', () => {
  const migrated: string[] = [];
  const behavior = { migrate: async (_index: string) => ({ status: 'skipped' }) };
  return {
    // Exposed so the tests below can drive and inspect the stubbed migrator.
    __migrated: migrated,
    __behavior: behavior,
    IndexMigrator: jest.fn().mockImplementation((opts: any) => ({
      migrate: async () => {
        migrated.push(opts.index);
        return behavior.migrate(opts.index);
      },
    })),
    DocumentMigrator: jest.fn(),
    buildActiveMappings: jest.fn(() => ({})),
  };
});

jest.mock('../../../../../src/core/server/saved_objects/migrations/core/build_index_map', () => ({
  createIndexMap: ({ opensearchDashboardsIndexName }: any) => ({
    [opensearchDashboardsIndexName]: { typeMappings: {}, script: undefined },
  }),
}));

describe('migrateTenantIndices', () => {
  const tenants = ['.kibana_1234_alice', '.kibana_5678_bob', '.kibana_9012_carol'];
  const migrationsCore: any = jest.requireMock(
    '../../../../../src/core/server/saved_objects/migrations/core'
  );

  const circuitBreaker = Object.assign(
    new Error('[circuit_breaking_exception] [parent] Data too large'),
    { body: { error: { type: 'circuit_breaking_exception' } } }
  );

  let logger: any;
  let exitSpy: jest.SpyInstance;

  const failOn = (target: string) => {
    migrationsCore.__behavior.migrate = async (index: string) => {
      if (index === target) {
        throw circuitBreaker;
      }
      return { status: 'skipped' };
    };
  };

  const run = () =>
    migrateTenantIndices(
      '2.19.0',
      {},
      {
        getTenantInfoWithInternalUser: async () =>
          tenants.reduce((acc, name) => ({ ...acc, [name]: {} }), {}),
      },
      { getAllTypes: () => [] },
      {},
      logger
    );

  beforeEach(() => {
    logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() };
    migrationsCore.__migrated.length = 0;
    migrationsCore.__behavior.migrate = async () => ({ status: 'skipped' });
    // Throw rather than return: the real process.exit never hands control back, so a
    // no-op mock would let the loop keep running and hide a regression.
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit(${code}) was called`);
    }) as any);
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  it('migrates every tenant index when none fail', async () => {
    await run();

    expect(migrationsCore.__migrated).toEqual(tenants);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('does not end the process when a tenant index migration fails', async () => {
    failOn(tenants[1]);

    await run();

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('continues with the remaining tenants after one fails', async () => {
    failOn(tenants[0]);

    await run();

    expect(migrationsCore.__migrated).toEqual(tenants);
  });

  it('names the failing tenant index in the logged error', async () => {
    failOn(tenants[1]);

    await run();

    const logged = logger.error.mock.calls.map((call: any[]) => String(call[0])).join('\n');
    expect(logged).toContain(tenants[1]);
    expect(logged).toContain('circuit_breaking_exception');
  });
});
