/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CommonService } from '@credebl/common';
import { KeycloakUrlService } from '@credebl/keycloak-url';
import { ClientRegistrationService } from '@credebl/client-registration';

@Injectable()
export class KeycloakConfigService implements OnModuleInit {
  constructor(
    private readonly commonService: CommonService,
    private readonly keycloakUrlService: KeycloakUrlService,
    private readonly clientRegistrationService: ClientRegistrationService
  ) {}

  private readonly logger = new Logger('KeycloakConfigService');

  async onModuleInit(): Promise<void> {
    this.logger.log('========================================');
    this.logger.log('=== Keycloak Ecosystem Configuration ===');
    this.logger.log('========================================');
    try {
      await this.configureEcosystemAccess();
      this.logger.log('========================================');
      this.logger.log('=== Configuration Finished: SUCCESS  ===');
      this.logger.log('========================================');
    } catch (error) {
      this.logger.error('========================================');
      this.logger.error('=== Configuration Finished: FAILED  ===');
      this.logger.error(`=== Error: ${error.message || error}`);
      this.logger.error('========================================');
    }
  }

  async configureEcosystemAccess(): Promise<void> {
    this.logger.log('');
    this.logger.log('--- Fetching Management Token ---');
    const token = await this.clientRegistrationService.getPlatformManagementToken();
    this.logger.log('Management token: OBTAINED');

    const realmName = process.env.KEYCLOAK_REALM;
    const keycloakDomain = process.env.KEYCLOAK_DOMAIN;
    this.logger.log(`Keycloak Domain: ${keycloakDomain}`);
    this.logger.log(`Target Realm: ${realmName}`);

    this.logger.log('');
    this.logger.log('--- [Step 1/3] Realm-Level Protocol Mapper (profile scope) ---');
    await this.ensureRealmProtocolMapper(realmName, token);

    this.logger.log('');
    this.logger.log('--- [Step 2/3] Per-Client Protocol Mappers ---');
    await this.ensureAllClientsProtocolMapper(realmName, token);

    this.logger.log('');
    this.logger.log('--- [Step 3/3] Verification: Checking Users with ecosystem_access ---');
    await this.verifyUsersEcosystemAccess(realmName, token);
  }

  private async ensureRealmProtocolMapper(realm: string, token: string): Promise<void> {
    this.logger.log('Looking up "profile" client scope...');
    const scopeId = await this.getDefaultClientScopeId(realm, token);
    if (!scopeId) {
      this.logger.warn('PROBLEM: "profile" client scope NOT FOUND in realm');
      this.logger.warn('This means ecosystem_access will NOT appear in user login tokens');
      return;
    }
    this.logger.log(`Found "profile" client scope ID: ${scopeId}`);

    const mappersUrl = await this.keycloakUrlService.GetClientScopeProtocolMappersURL(realm, scopeId);
    this.logger.log(`Fetching mappers from: ${mappersUrl}`);
    const existingMappers = await this.commonService.httpGet(mappersUrl, this.getAuthHeader(token));

    this.logger.log(`Response type: ${typeof existingMappers}, isArray: ${Array.isArray(existingMappers)}`);
    if (Array.isArray(existingMappers)) {
      const mapperNames = existingMappers.map((m: { name: string }) => m.name);
      this.logger.log(`Existing mappers in "profile" scope: [${mapperNames.join(', ')}]`);
    } else {
      this.logger.warn(`Unexpected response for mappers: ${JSON.stringify(existingMappers)}`);
    }

    const mapperExists =
      Array.isArray(existingMappers) && existingMappers.some((m: { name: string }) => 'ecosystem_access' === m.name);

    if (mapperExists) {
      this.logger.log('Result: "ecosystem_access" mapper ALREADY EXISTS - SKIPPED');
      return;
    }

    this.logger.log('Result: "ecosystem_access" mapper NOT FOUND - CREATING...');
    const mapperPayload = this.buildProtocolMapperPayload('ecosystem_access');
    this.logger.log(`Payload: ${JSON.stringify(mapperPayload)}`);

    const createResponse = await this.commonService.httpPost(mappersUrl, mapperPayload, this.getAuthHeader(token));
    this.logger.log(`Create response: ${JSON.stringify(createResponse)}`);
    this.logger.log('Result: "ecosystem_access" mapper CREATED on "profile" client scope');
  }

  private async getDefaultClientScopeId(realm: string, token: string): Promise<string | null> {
    const scopesUrl = await this.keycloakUrlService.GetClientScopesURL(realm);
    this.logger.log(`Fetching client scopes from: ${scopesUrl}`);
    const scopes = await this.commonService.httpGet(scopesUrl, this.getAuthHeader(token));

    if (!Array.isArray(scopes)) {
      this.logger.warn(`Unexpected response for scopes: ${JSON.stringify(scopes)}`);
      return null;
    }

    const scopeNames = scopes.map((s: { name: string; id: string }) => `${s.name}(${s.id})`);
    this.logger.log(`Found ${scopes.length} client scopes: [${scopeNames.join(', ')}]`);

    const profileScope = scopes.find((s: { name: string }) => 'profile' === s.name);
    if (!profileScope) {
      this.logger.warn('No scope named "profile" found');
    }
    return profileScope ? profileScope.id : null;
  }

  private async ensureAllClientsProtocolMapper(realm: string, token: string): Promise<void> {
    const clientsUrl = await this.keycloakUrlService.GetClientsURL(realm);
    this.logger.log(`Fetching clients from: ${clientsUrl}`);
    const clients = await this.commonService.httpGet(clientsUrl, this.getAuthHeader(token));

    if (!Array.isArray(clients)) {
      this.logger.warn(`Unexpected response for clients: ${JSON.stringify(clients)}`);
      return;
    }

    this.logger.log(`Found ${clients.length} total clients in realm`);
    this.logger.log('All clients:');
    for (const c of clients) {
      this.logger.log(
        `  - clientId: "${c.clientId}", id: "${c.id}", serviceAccount: ${c.serviceAccountsEnabled}, bearerOnly: ${c.bearerOnly}, enabled: ${c.enabled}`
      );
    }

    const systemClients = ['admin-cli', 'account', 'account-console', 'broker', 'security-admin-console'];

    const targetClients = clients.filter(
      (client: { clientId: string; bearerOnly: boolean }) =>
        !client.clientId.startsWith('realm-') && !client.bearerOnly && !systemClients.includes(client.clientId)
    );

    const excludedClients = clients.filter(
      (client: { clientId: string; bearerOnly: boolean }) =>
        client.clientId.startsWith('realm-') || client.bearerOnly || systemClients.includes(client.clientId)
    );

    this.logger.log('');
    this.logger.log(`Target clients (${targetClients.length}):`);
    for (const c of targetClients) {
      this.logger.log(`  + "${c.clientId}" (id: ${c.id})`);
    }
    this.logger.log(`Excluded clients (${excludedClients.length}):`);
    for (const c of excludedClients) {
      this.logger.log(`  - "${c.clientId}" (reason: system/bearer-only/realm)`);
    }

    this.logger.log('');
    this.logger.log('Processing target clients...');

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const client of targetClients) {
      const result = await this.ensureClientProtocolMapper(realm, client.id, client.clientId, token);
      if ('created' === result) {
        created++;
      } else if ('skipped' === result) {
        skipped++;
      } else {
        failed++;
      }
    }

    this.logger.log('');
    this.logger.log(
      `Per-client mapper summary: ${created} CREATED, ${skipped} SKIPPED (already existed), ${failed} FAILED`
    );
  }

  private async ensureClientProtocolMapper(
    realm: string,
    clientIdpId: string,
    clientId: string,
    token: string
  ): Promise<'created' | 'skipped' | 'failed'> {
    try {
      const mappersUrl = await this.keycloakUrlService.GetClientProtocolMappersByIdURL(realm, clientIdpId);
      const existingMappers = await this.commonService.httpGet(mappersUrl, this.getAuthHeader(token));

      const mapperNames = Array.isArray(existingMappers) ? existingMappers.map((m: { name: string }) => m.name) : [];

      const mapperExists = mapperNames.includes('ecosystem_access_mapper');

      if (mapperExists) {
        this.logger.log(
          `  [${clientId}] Has ${mapperNames.length} mappers, "ecosystem_access_mapper" EXISTS - SKIPPED`
        );
        return 'skipped';
      }

      this.logger.log(`  [${clientId}] Has ${mapperNames.length} mappers: [${mapperNames.join(', ')}]`);
      this.logger.log(`  [${clientId}] "ecosystem_access_mapper" NOT FOUND - CREATING...`);

      const mapperPayload = this.buildProtocolMapperPayload('ecosystem_access_mapper');
      await this.commonService.httpPost(mappersUrl, mapperPayload, this.getAuthHeader(token));
      this.logger.log(`  [${clientId}] "ecosystem_access_mapper" CREATED`);
      return 'created';
    } catch (error) {
      this.logger.error(`  [${clientId}] FAILED: ${error.message || JSON.stringify(error)}`);
      return 'failed';
    }
  }

  private async verifyUsersEcosystemAccess(realm: string, token: string): Promise<void> {
    try {
      const usersUrl = `${process.env.KEYCLOAK_DOMAIN}admin/realms/${realm}/users?max=100`;
      this.logger.log(`Fetching users from: ${usersUrl}`);
      const users = await this.commonService.httpGet(usersUrl, this.getAuthHeader(token));

      if (!Array.isArray(users)) {
        this.logger.warn(`Unexpected response for users: ${typeof users}`);
        return;
      }

      this.logger.log(`Found ${users.length} users in realm`);

      let usersWithAttribute = 0;
      let usersWithoutAttribute = 0;
      let serviceAccountUsers = 0;

      for (const user of users) {
        const isServiceAccount = user.username?.startsWith('service-account-');
        const hasEcosystemAccess = user.attributes?.ecosystem_access && 0 < user.attributes.ecosystem_access.length;

        if (isServiceAccount) {
          serviceAccountUsers++;
          if (hasEcosystemAccess) {
            this.logger.log(
              `  [SERVICE-ACCOUNT] ${user.username} - HAS ecosystem_access: ${user.attributes.ecosystem_access[0].substring(0, 100)}...`
            );
          }
        } else {
          if (hasEcosystemAccess) {
            usersWithAttribute++;
            this.logger.log(
              `  [USER] ${user.username} (${user.id}) - HAS ecosystem_access: ${user.attributes.ecosystem_access[0].substring(0, 100)}...`
            );
          } else {
            usersWithoutAttribute++;
            this.logger.log(`  [USER] ${user.username} (${user.id}) - NO ecosystem_access attribute`);
          }
        }
      }

      this.logger.log('');
      this.logger.log(`User attribute summary:`);
      this.logger.log(`  Regular users WITH ecosystem_access: ${usersWithAttribute}`);
      this.logger.log(`  Regular users WITHOUT ecosystem_access: ${usersWithoutAttribute}`);
      this.logger.log(`  Service account users: ${serviceAccountUsers}`);

      if (0 === usersWithAttribute && 0 < usersWithoutAttribute) {
        this.logger.warn('WARNING: No regular users have ecosystem_access attribute!');
        this.logger.warn('This means ecosystem_access will NOT appear in user login tokens');
        this.logger.warn('The attribute is set when a user creates or joins an ecosystem');
      }
    } catch (error) {
      this.logger.error(`Failed to verify users: ${error.message || error}`);
    }
  }

  private buildProtocolMapperPayload(name: string) {
    return {
      name,
      protocol: 'openid-connect',
      protocolMapper: 'oidc-usermodel-attribute-mapper',
      config: {
        'user.attribute': 'ecosystem_access',
        'claim.name': 'ecosystem_access',
        'jsonType.label': 'JSON',
        'id.token.claim': 'true',
        'access.token.claim': 'true',
        'userinfo.token.claim': 'true'
      }
    };
  }

  private getAuthHeader(token: string) {
    return { headers: { authorization: `Bearer ${token}` } };
  }
}
