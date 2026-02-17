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
    this.logger.log('=== Keycloak Ecosystem Configuration Starting ===');
    try {
      await this.configureEcosystemAccess();
      this.logger.log('=== Keycloak Ecosystem Configuration Finished Successfully ===');
    } catch (error) {
      this.logger.error(`=== Keycloak Ecosystem Configuration FAILED ===`);
      this.logger.error(`Error: ${error.message || error}`);
    }
  }

  async configureEcosystemAccess(): Promise<void> {
    this.logger.log('Fetching management token...');
    const token = await this.clientRegistrationService.getPlatformManagementToken();
    this.logger.log('Management token obtained successfully');

    const realmName = process.env.KEYCLOAK_REALM;
    this.logger.log(`Target realm: ${realmName}`);

    this.logger.log('[Step 1/2] Checking realm-level protocol mapper...');
    await this.ensureRealmProtocolMapper(realmName, token);

    this.logger.log('[Step 2/2] Checking per-client protocol mappers...');
    await this.ensureAllClientsProtocolMapper(realmName, token);

    this.logger.log('Ecosystem access configuration completed');
  }

  private async ensureRealmProtocolMapper(realm: string, token: string): Promise<void> {
    this.logger.log('Looking up "profile" client scope...');
    const scopeId = await this.getDefaultClientScopeId(realm, token);
    if (!scopeId) {
      this.logger.warn('Default "profile" client scope not found, skipping realm-level mapper');
      return;
    }
    this.logger.log(`Found "profile" client scope: ${scopeId}`);

    const mappersUrl = await this.keycloakUrlService.GetClientScopeProtocolMappersURL(realm, scopeId);
    this.logger.log(`Fetching existing mappers from: ${mappersUrl}`);
    const existingMappers = await this.commonService.httpGet(mappersUrl, this.getAuthHeader(token));

    const mapperExists =
      Array.isArray(existingMappers) && existingMappers.some((m: { name: string }) => 'ecosystem_access' === m.name);

    if (mapperExists) {
      this.logger.log('Realm-level "ecosystem_access" mapper already exists - SKIPPED');
      return;
    }

    this.logger.log('Realm-level "ecosystem_access" mapper not found - CREATING...');
    const mapperPayload = this.buildProtocolMapperPayload('ecosystem_access');
    await this.commonService.httpPost(mappersUrl, mapperPayload, this.getAuthHeader(token));
    this.logger.log('Realm-level "ecosystem_access" mapper CREATED on "profile" client scope');
  }

  private async getDefaultClientScopeId(realm: string, token: string): Promise<string | null> {
    const scopesUrl = await this.keycloakUrlService.GetClientScopesURL(realm);
    const scopes = await this.commonService.httpGet(scopesUrl, this.getAuthHeader(token));

    if (!Array.isArray(scopes)) {
      this.logger.warn('Failed to fetch client scopes');
      return null;
    }

    this.logger.log(`Found ${scopes.length} client scopes in realm`);
    const profileScope = scopes.find((s: { name: string }) => 'profile' === s.name);
    return profileScope ? profileScope.id : null;
  }

  private async ensureAllClientsProtocolMapper(realm: string, token: string): Promise<void> {
    const clientsUrl = await this.keycloakUrlService.GetClientsURL(realm);
    this.logger.log(`Fetching all clients from: ${clientsUrl}`);
    const clients = await this.commonService.httpGet(clientsUrl, this.getAuthHeader(token));

    if (!Array.isArray(clients)) {
      this.logger.warn('No clients found in realm');
      return;
    }

    this.logger.log(`Found ${clients.length} total clients in realm`);

    const orgClients = clients.filter(
      (client: { serviceAccountsEnabled: boolean; clientId: string }) =>
        client.serviceAccountsEnabled && !client.clientId.startsWith('realm-')
    );

    this.logger.log(`Found ${orgClients.length} service-account-enabled clients to process`);

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const client of orgClients) {
      const result = await this.ensureClientProtocolMapper(realm, client.id, client.clientId, token);
      if ('created' === result) {
        created++;
      } else if ('skipped' === result) {
        skipped++;
      } else {
        failed++;
      }
    }

    this.logger.log(`Per-client mapper results: ${created} created, ${skipped} already existed, ${failed} failed`);
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

      const mapperExists =
        Array.isArray(existingMappers) &&
        existingMappers.some((m: { name: string }) => 'ecosystem_access_mapper' === m.name);

      if (mapperExists) {
        this.logger.log(`  [${clientId}] ecosystem_access_mapper already exists - SKIPPED`);
        return 'skipped';
      }

      const mapperPayload = this.buildProtocolMapperPayload('ecosystem_access_mapper');
      await this.commonService.httpPost(mappersUrl, mapperPayload, this.getAuthHeader(token));
      this.logger.log(`  [${clientId}] ecosystem_access_mapper CREATED`);
      return 'created';
    } catch (error) {
      this.logger.warn(`  [${clientId}] FAILED: ${error.message || error}`);
      return 'failed';
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
