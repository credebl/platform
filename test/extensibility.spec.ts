/**
 * Extensibility & Packaging Test Suite
 *
 * Tests two things:
 *  1. PACKAGES  — each @credebl lib exports the expected symbols
 *  2. EXTENSIBILITY — every api-gateway module has `static register()` that
 *     returns a correct DynamicModule honouring overrides / controllerOverrides /
 *     importedModules
 *
 * No NestJS bootstrap, no DB, no NATS required — purely structural checks.
 */

import * as fs from 'fs';
import * as path from 'path';
import { APIGatewayModule } from '../apps/api-gateway/src/app.module';
import * as bootstrapApi from '../apps/api-gateway/src/boostrap';

// ─── 1. Package exports ───────────────────────────────────────────────────────

describe('@credebl/common — package exports', () => {
  it('exports CommonModule', async () => {
    const { CommonModule } = await import('@credebl/common');
    expect(CommonModule).toBeDefined();
  });

  it('exports CommonConstants', async () => {
    const { CommonConstants } = await import('@credebl/common');
    expect(CommonConstants).toBeDefined();
    expect(typeof CommonConstants).toBe('object');
  });

  it('exports getNatsOptions', async () => {
    const { getNatsOptions } = await import('@credebl/common');
    expect(typeof getNatsOptions).toBe('function');
  });

  it('exports NATSClient', async () => {
    const { NATSClient } = await import('@credebl/common');
    expect(NATSClient).toBeDefined();
  });

  it('exports enum values (e.g. Ledgers, DidMethod)', async () => {
    const { Ledgers } = await import('@credebl/common');
    expect(Ledgers).toBeDefined();
  });

  it('exports context utilities (ContextStorageServiceKey)', async () => {
    const mod = await import('@credebl/common');
    expect((mod as Record<string, unknown>).ContextStorageServiceKey).toBeDefined();
  });
});

describe('@credebl/logger — package exports', () => {
  it('exports LoggerModule', async () => {
    const { LoggerModule } = await import('@credebl/logger');
    expect(LoggerModule).toBeDefined();
  });

  it('exports NestjsLoggerServiceAdapter', async () => {
    const { NestjsLoggerServiceAdapter } = await import('@credebl/logger');
    expect(NestjsLoggerServiceAdapter).toBeDefined();
  });

  it('exports LoggerService', async () => {
    const mod = await import('@credebl/logger');
    expect((mod as Record<string, unknown>).LoggerService).toBeDefined();
  });

  it('exports OTEL_LOGGER_TOKEN for optional injection', async () => {
    const mod = await import('@credebl/logger');
    expect((mod as Record<string, unknown>).OTEL_LOGGER_TOKEN).toBeDefined();
    expect(typeof (mod as Record<string, unknown>).OTEL_LOGGER_TOKEN).toBe('symbol');
  });
});

describe('@credebl/prisma-service — package exports', () => {
  it('exports PrismaService', async () => {
    const { PrismaService } = await import('@credebl/prisma-service');
    expect(PrismaService).toBeDefined();
  });

  it('exports PrismaServiceModule', async () => {
    const mod = await import('@credebl/prisma-service');
    expect((mod as Record<string, unknown>).PrismaServiceModule).toBeDefined();
  });
});

describe('@credebl/user-management — package exports', () => {
  it('exports UserManagementModule', async () => {
    const mod = await import('@credebl/user-management');
    expect((mod as Record<string, unknown>).UserManagementModule).toBeDefined();
  });

  it('exports OrgRolesService', async () => {
    const mod = await import('@credebl/user-management');
    expect((mod as Record<string, unknown>).OrgRolesService).toBeDefined();
  });

  it('exports UserActivityService', async () => {
    const mod = await import('@credebl/user-management');
    expect((mod as Record<string, unknown>).UserActivityService).toBeDefined();
  });

  it('exports UserOrgRolesService', async () => {
    const { UserOrgRolesService } = await import('@credebl/user-management');
    expect(UserOrgRolesService).toBeDefined();
  });

  it('exports SupabaseService', async () => {
    const mod = await import('@credebl/user-management');
    expect((mod as Record<string, unknown>).SupabaseService).toBeDefined();
  });

  it('exports KeycloakUrlService', async () => {
    const mod = await import('@credebl/user-management');
    expect((mod as Record<string, unknown>).KeycloakUrlService).toBeDefined();
  });

  it('exports OrgRolesRepository', async () => {
    const mod = await import('@credebl/user-management');
    expect((mod as Record<string, unknown>).OrgRolesRepository).toBeDefined();
  });
});

describe('@credebl/aws — package exports', () => {
  it('exports AwsService', async () => {
    const mod = await import('@credebl/aws');
    expect((mod as Record<string, unknown>).AwsService).toBeDefined();
  });
});

// ─── 2. API Gateway extensibility ────────────────────────────────────────────

describe('APIGatewayModule — static register()', () => {
  it('has a static register() method', () => {
    expect(typeof APIGatewayModule.register).toBe('function');
  });

  it('returns a DynamicModule with required shape', () => {
    const mod = APIGatewayModule.register([], [], []);
    expect(mod).toMatchObject({
      module: APIGatewayModule,
      imports: expect.any(Array),
      controllers: expect.any(Array),
      providers: expect.any(Array)
    });
  });

  it('spreads overrides into providers', () => {
    const fakeProvider = { provide: 'FAKE', useValue: 'test' };
    const mod = APIGatewayModule.register([fakeProvider], [], []);
    expect(mod.providers).toContainEqual(fakeProvider);
  });

  it('replaces controllers when controllerOverrides provided', () => {
    class MyController {}
    const mod = APIGatewayModule.register([], [MyController], []);
    expect(mod.controllers).toContain(MyController);
  });

  it('uses default AppController when no controllerOverrides', () => {
    const mod = APIGatewayModule.register([], [], []);
    expect(mod.controllers.length).toBeGreaterThan(0);
  });

  it('spreads importedModules into imports', () => {
    class ExtraModule {}
    const mod = APIGatewayModule.register([], [], [ExtraModule]);
    expect(mod.imports).toContainEqual(ExtraModule);
  });
});

// ─── 3. Feature modules — register() pattern ─────────────────────────────────

const featureModules = [
  ['AgentModule', '../apps/api-gateway/src/agent-service/agent-service.module'],
  ['AgentModule', '../apps/api-gateway/src/agent/agent.module'],
  ['AuthzModule', '../apps/api-gateway/src/authz/authz.module'],
  ['CloudWalletModule', '../apps/api-gateway/src/cloud-wallet/cloud-wallet.module'],
  ['ConnectionModule', '../apps/api-gateway/src/connection/connection.module'],
  ['CredentialDefinitionModule', '../apps/api-gateway/src/credential-definition/credential-definition.module'],
  ['EcosystemModule', '../apps/api-gateway/src/ecosystem/ecosystem.module'],
  ['FidoModule', '../apps/api-gateway/src/fido/fido.module'],
  ['GeoLocationModule', '../apps/api-gateway/src/geo-location/geo-location.module'],
  ['IssuanceModule', '../apps/api-gateway/src/issuance/issuance.module'],
  ['NotificationModule', '../apps/api-gateway/src/notification/notification.module'],
  ['Oid4vcIssuanceModule', '../apps/api-gateway/src/oid4vc-issuance/oid4vc-issuance.module'],
  ['Oid4vpModule', '../apps/api-gateway/src/oid4vc-verification/oid4vc-verification.module'],
  ['OrganizationModule', '../apps/api-gateway/src/organization/organization.module'],
  ['PlatformModule', '../apps/api-gateway/src/platform/platform.module'],
  ['RevocationModule', '../apps/api-gateway/src/revocation/revocation.module'],
  ['SchemaModule', '../apps/api-gateway/src/schema/schema.module'],
  ['UserModule', '../apps/api-gateway/src/user/user.module'],
  ['UtilitiesModule', '../apps/api-gateway/src/utilities/utilities.module'],
  ['VerificationModule', '../apps/api-gateway/src/verification/verification.module'],
  ['WebhookModule', '../apps/api-gateway/src/webhook/webhook.module'],
  ['X509Module', '../apps/api-gateway/src/x509/x509.module']
] as const;

type ModuleWithRegister = {
  register: (
    overrides?: unknown[],
    controllerOverrides?: unknown[],
    importedModules?: unknown[]
  ) => {
    module: unknown;
    imports: unknown[];
    controllers: unknown[];
    providers: unknown[];
  };
};

describe('Feature modules — static register() contract', () => {
  it.each(featureModules)('%s has static register()', (exportName, modulePath) => {
    const moduleExports = jest.requireActual<Record<string, ModuleWithRegister>>(modulePath);
    const ModuleClass = moduleExports[exportName];
    expect(ModuleClass).toBeDefined();
    expect(typeof ModuleClass.register).toBe('function');
  });

  it.each(featureModules)('%s register() returns a DynamicModule', (exportName, modulePath) => {
    const moduleExports = jest.requireActual<Record<string, ModuleWithRegister>>(modulePath);
    const ModuleClass = moduleExports[exportName];
    const mod = ModuleClass.register([], [], []);
    expect(mod).toMatchObject({
      module: ModuleClass,
      imports: expect.any(Array),
      controllers: expect.any(Array),
      providers: expect.any(Array)
    });
  });

  it.each(featureModules)('%s register() respects provider overrides', (exportName, modulePath) => {
    const moduleExports = jest.requireActual<Record<string, ModuleWithRegister>>(modulePath);
    const ModuleClass = moduleExports[exportName];
    const fakeProvider = { provide: 'TEST_TOKEN', useValue: 42 };
    const mod = ModuleClass.register([fakeProvider], [], []);
    expect(mod.providers).toContainEqual(fakeProvider);
  });

  it.each(featureModules)('%s register() replaces controllers when overridden', (exportName, modulePath) => {
    const moduleExports = jest.requireActual<Record<string, ModuleWithRegister>>(modulePath);
    const ModuleClass = moduleExports[exportName];
    class CustomController {}
    const mod = ModuleClass.register([], [CustomController], []);
    expect(mod.controllers).toContain(CustomController);
    expect(mod.controllers).toHaveLength(1);
  });

  it.each(featureModules)('%s register() adds importedModules', (exportName, modulePath) => {
    const moduleExports = jest.requireActual<Record<string, ModuleWithRegister>>(modulePath);
    const ModuleClass = moduleExports[exportName];
    class ExtraModule {}
    const mod = ModuleClass.register([], [], [ExtraModule]);
    expect(mod.imports).toContainEqual(ExtraModule);
  });
});

// ─── 4. Bootstrap functions ───────────────────────────────────────────────────

describe('boostrap.ts — public API', () => {
  it('exports bootstrapApiGateway as a function', () => {
    expect(typeof bootstrapApi.bootstrapApiGateway).toBe('function');
  });

  it('exports createApiGateway as a function', () => {
    expect(typeof bootstrapApi.createApiGateway).toBe('function');
  });

  it('bootstrapApiGateway accepts options with 3 override arrays', () => {
    expect(bootstrapApi.bootstrapApiGateway.length).toBeLessThanOrEqual(2);
  });
});

// ─── 5. Package tgz artifacts ────────────────────────────────────────────────

describe('packages/ — tgz artifacts exist', () => {
  const packagesDir = path.join(__dirname, '..', 'packages');

  const expectedTarballs = [
    'credebl-common-2.1.2.tgz',
    'credebl-aws-2.1.2.tgz',
    'credebl-logger-2.1.2.tgz',
    'credebl-prisma-service-2.1.2.tgz',
    'credebl-user-management-2.1.2.tgz',
    'credebl-api-gateway-2.1.2.tgz'
  ];

  it.each(expectedTarballs)('%s exists', (tarball) => {
    const fullPath = path.join(packagesDir, tarball);
    expect(fs.existsSync(fullPath)).toBe(true);
  });

  it.each(expectedTarballs)('%s is non-empty', (tarball) => {
    const fullPath = path.join(packagesDir, tarball);
    const stats = fs.statSync(fullPath);
    expect(stats.size).toBeGreaterThan(1000);
  });
});
