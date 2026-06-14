// TODO: Need to address the eslint issues
/* eslint-disable camelcase */
/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import * as qs from 'qs';

import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { ClientCredentialTokenPayloadDto } from './dtos/client-credential-token-payload.dto';
import { ClientTokenDto } from './dtos/client-token.dto';
import {
  CommonConstants,
  CommonService,
  EcosystemServiceRole,
  IFormattedResponse,
  ResponseMessages
} from '@credebl/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { IClientRoles } from './interfaces/client.interface';
import { JwtService } from '@nestjs/jwt';
import { KeycloakUrlService } from './keycloak-url.service';
import { KeycloakUserRegistrationDto } from './dtos/keycloak-register.dto';
import { accessTokenPayloadDto } from './dtos/accessTokenPayloadDto';
import { userTokenPayloadDto } from './dtos/userTokenPayloadDto';

@Injectable()
export class ClientRegistrationService {
  constructor(
    private readonly commonService: CommonService,
    private readonly keycloakUrlService: KeycloakUrlService
  ) {}

  private readonly logger = new Logger('ClientRegistrationService');

  async registerKeycloakUser(userDetails: KeycloakUserRegistrationDto, realm: string, token: string) {
    try {
      const url = await this.keycloakUrlService.createUserURL(realm);
      await this.commonService.httpPost(url, userDetails, this.getAuthHeader(token));

      const getUserResponse = await this.commonService.httpGet(
        await this.keycloakUrlService.getUserByUsernameURL(realm, userDetails.email),
        this.getAuthHeader(token)
      );
      if (getUserResponse[0].username === userDetails.email || getUserResponse[1].username === userDetails.email) {
        return { keycloakUserId: getUserResponse[0].id };
      } else {
        throw new NotFoundException(ResponseMessages.user.error.invalidKeycloakId);
      }
    } catch (error) {
      this.logger.error(`error in keycloakUserRegistration in client-registration: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async resetPasswordOfUser(user: CreateUserDto, realm: string, token: string): Promise<IFormattedResponse> {
    const getUserResponse = await this.commonService.httpGet(
      await this.keycloakUrlService.getUserByUsernameURL(realm, user.email),
      this.getAuthHeader(token)
    );
    const userid = getUserResponse[0].id;

    const passwordResponse = await this.resetPasswordOfKeycloakUser(realm, user.password, userid, token);

    return passwordResponse;
  }

  async createUser(user: CreateUserDto, realm: string, token: string): Promise<{ keycloakUserId: string }> {
    const payload = {
      createdTimestamp: Date.parse(Date.now.toString()),
      username: user.email,
      enabled: true,
      totp: false,
      emailVerified: true,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      disableableCredentialTypes: [],
      requiredActions: [],
      notBefore: 0,
      access: {
        manageGroupMembership: true,
        view: true,
        mapRoles: true,
        impersonate: true,
        manage: true
      },
      realmRoles: ['mb-user'],
      attributes: {
        ...(user.isHolder ? { userRole: `${CommonConstants.USER_HOLDER_ROLE}` } : {})
      }
    };

    await this.commonService.httpPost(
      await this.keycloakUrlService.createUserURL(realm),
      payload,
      this.getAuthHeader(token)
    );

    const getUserResponse = await this.commonService.httpGet(
      await this.keycloakUrlService.getUserByUsernameURL(realm, user.email),
      this.getAuthHeader(token)
    );
    const userid = getUserResponse[0].id;

    await this.resetPasswordOfKeycloakUser(realm, user.password, userid, token);

    return {
      keycloakUserId: getUserResponse[0].id
    };
  }

  async resetPasswordOfKeycloakUser(realm: string, resetPasswordValue: string, userid: string, token: string) {
    const passwordPayload = {
      type: 'password',
      value: resetPasswordValue,
      temporary: false
    };
    const setPasswordResponse = await this.commonService.httpPut(
      await this.keycloakUrlService.ResetPasswordURL(realm, userid),
      passwordPayload,
      this.getAuthHeader(token)
    );
    return setPasswordResponse;
  }

  getAuthHeader(token: string) {
    return { headers: { authorization: `Bearer ${token}` } };
  }

  async getUserInfo(token: string) {
    try {
      const jwtService = new JwtService({});
      const decoded = jwtService.decode(token, { complete: true });
      if (!decoded) {
        throw new UnauthorizedException('Invalid token');
      }

      const payload = decoded['payload'];

      const userInfoResponse = await this.commonService.httpGet(
        `${process.env.KEYCLOAK_DOMAIN}admin/realms/${process.env.KEYCLOAK_REALM}/users/${payload['sub']}`,
        this.getAuthHeader(token)
      );
      return userInfoResponse.data;
    } catch (error) {
      this.logger.error(`[getUserInfo]: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getManagementToken(clientId: string, clientSecret: string) {
    try {
      if (!clientId && !clientSecret) {
        this.logger.error(`getManagementToken ::: Client ID and client secret are missing`);
        throw new BadRequestException(`Client ID and client secret are missing`);
      }

      const decryptClientId = await this.commonService.decryptPassword(clientId);
      const decryptClientSecret = await this.commonService.decryptPassword(clientSecret);

      const payload = new ClientCredentialTokenPayloadDto(decryptClientId, decryptClientSecret);
      const mgmtTokenResponse = await this.getToken(payload);
      return mgmtTokenResponse.access_token;
    } catch (error) {
      this.logger.error(`Error in getManagementToken: ${JSON.stringify(error)}`);

      throw error;
    }
  }

  async getPlatformManagementToken(): Promise<string> {
    try {
      const clientId = process.env.KEYCLOAK_MANAGEMENT_CLIENT_ID;
      const clientSecret = process.env.KEYCLOAK_MANAGEMENT_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        this.logger.error(
          `getPlatformManagementToken ::: KEYCLOAK_MANAGEMENT_CLIENT_ID or KEYCLOAK_MANAGEMENT_CLIENT_SECRET is missing`
        );
        throw new BadRequestException(`Keycloak management credentials are missing in environment`);
      }

      const payload = new ClientCredentialTokenPayloadDto(clientId, clientSecret);

      const mgmtTokenResponse = await this.getToken(payload);
      return mgmtTokenResponse.access_token;
    } catch (error) {
      this.logger.error(`Error in getPlatformManagementToken: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getManagementTokenForMobile() {
    const payload = new ClientCredentialTokenPayloadDto(
      process.env.KEYCLOAK_MANAGEMENT_ADEYA_CLIENT_ID,
      process.env.KEYCLOAK_MANAGEMENT_ADEYA_CLIENT_SECRET
    );
    payload.scope = 'email profile';

    this.logger.log(`management Payload: ${JSON.stringify(payload)}`);
    const mgmtTokenResponse = await this.getToken(payload);
    this.logger.debug(`ClientRegistrationService management token ${JSON.stringify(mgmtTokenResponse)}`);
    return mgmtTokenResponse;
  }

  async getClientIdAndSecret(
    clientId: string,
    token: string
  ): Promise<{ clientId: string; clientSecret: string }> | undefined {
    if (!clientId) {
      return;
    }
    try {
      const realmName = process.env.KEYCLOAK_REALM;
      const getClientResponse = await this.commonService.httpGet(
        await this.keycloakUrlService.GetClientURL(realmName, clientId),
        this.getAuthHeader(token)
      );
      const { id } = getClientResponse[0];
      const client_id = getClientResponse[0].clientId;

      const response = await this.commonService.httpGet(
        `${process.env.KEYCLOAK_DOMAIN}${CommonConstants.URL_KEYCLOAK_CLIENT_SECRET.replace('{id}', id)}`,
        this.getAuthHeader(token)
      );

      return {
        clientId: client_id,
        clientSecret: response.value
      };
    } catch (error) {
      if (404 === error?.response?.statusCode) {
      } else {
        this.logger.error(`Caught exception while retrieving clientSecret from Auth0: ${JSON.stringify(error)}`);
        throw new Error('Unable to retrieve clientSecret from server');
      }
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async deleteClient(idpId: string, token: string): Promise<any> {
    const realmName = process.env.KEYCLOAK_REALM;

    const getClientDeleteResponse = await this.commonService.httpDelete(
      await this.keycloakUrlService.GetClientIdpURL(realmName, idpId),
      this.getAuthHeader(token)
    );

    this.logger.log(`Delete realm client ${JSON.stringify(getClientDeleteResponse)}`);

    return getClientDeleteResponse;
  }

  async createUserClientRole(idpId: string, token: string, userId: string, payload: object[]): Promise<string> {
    const realmName = process.env.KEYCLOAK_REALM;

    const createClientRolesResponse = await this.commonService.httpPost(
      await this.keycloakUrlService.GetClientUserRoleURL(realmName, userId, idpId),
      payload,
      this.getAuthHeader(token)
    );

    this.logger.debug(`createUserClientRolesResponse ${JSON.stringify(createClientRolesResponse)}`);

    return 'User client role is assigned';
  }

  async deleteUserClientRoles(idpId: string, token: string, userId: string): Promise<boolean> {
    const realmName = process.env.KEYCLOAK_REALM;

    const createClientRolesResponse = await this.commonService
      .httpDelete(
        await this.keycloakUrlService.GetClientUserRoleURL(realmName, userId, idpId),
        this.getAuthHeader(token)
      )
      .then((data) => data?.data)
      .catch((error) => error);

    this.logger.debug(`deleteUserClientRoles ${JSON.stringify(createClientRolesResponse)}`);

    return true;
  }

  async createUserHolderRole(token: string, userId: string, payload: object[]): Promise<string> {
    const realmName = process.env.KEYCLOAK_REALM;

    const createClientRolesResponse = await this.commonService.httpPost(
      await this.keycloakUrlService.GetClientUserRoleURL(realmName, userId),
      payload,
      this.getAuthHeader(token)
    );

    this.logger.debug(`createUserHolderRole ${JSON.stringify(createClientRolesResponse)}`);

    return 'User holder role is assigned';
  }

  async getAllClientRoles(idpId: string, token: string): Promise<IClientRoles[]> {
    const realmName = process.env.KEYCLOAK_REALM;

    const clientRolesResponse = await this.commonService.httpGet(
      await this.keycloakUrlService.GetClientRoleURL(realmName, idpId),
      this.getAuthHeader(token)
    );

    this.logger.debug(`getAllClientRoles ${JSON.stringify(clientRolesResponse)}`);

    return clientRolesResponse;
  }

  async getClientSpecificRoles(idpId: string, token: string, roleName: string): Promise<IClientRoles> {
    const realmName = process.env.KEYCLOAK_REALM;

    const clientRolesResponse = await this.commonService.httpGet(
      await this.keycloakUrlService.GetClientRoleURL(realmName, idpId, roleName),
      this.getAuthHeader(token)
    );

    this.logger.debug(`getClientSpecificRoles ${JSON.stringify(clientRolesResponse)}`);

    return clientRolesResponse;
  }

  async getAllRealmRoles(token: string): Promise<IClientRoles[]> {
    const realmName = process.env.KEYCLOAK_REALM;

    const realmRolesResponse = await this.commonService.httpGet(
      await this.keycloakUrlService.GetRealmRoleURL(realmName),
      this.getAuthHeader(token)
    );

    this.logger.debug(`getAllRealmRoles ${JSON.stringify(realmRolesResponse)}`);

    return realmRolesResponse;
  }

  async createClientRole(idpId: string, token: string, name: string, description: string): Promise<string> {
    const payload = {
      clientRole: true,
      name,
      description
    };

    const realmName = process.env.KEYCLOAK_REALM;

    const createClientRolesResponse = await this.commonService.httpPost(
      await this.keycloakUrlService.GetClientRoleURL(realmName, idpId),
      payload,
      this.getAuthHeader(token)
    );

    this.logger.debug(`createClientRolesResponse ${JSON.stringify(createClientRolesResponse)}`);

    return 'Client role is created';
  }

  async generateClientSecret(idpId: string, token: string): Promise<string> {
    const realmName = process.env.KEYCLOAK_REALM;

    const createClientSercretResponse = await this.commonService.httpPost(
      await this.keycloakUrlService.GetClientSecretURL(realmName, idpId),
      {},
      this.getAuthHeader(token)
    );

    this.logger.debug(
      `ClientRegistrationService create realm client secret ${JSON.stringify(createClientSercretResponse)}`
    );

    const getClientSercretResponse = await this.commonService.httpGet(
      await this.keycloakUrlService.GetClientSecretURL(realmName, idpId),
      this.getAuthHeader(token)
    );
    this.logger.debug(`ClientRegistrationService get client secret ${JSON.stringify(getClientSercretResponse)}`);
    this.logger.log(`${getClientSercretResponse.value}`);
    const clientSecret = getClientSercretResponse.value;

    return clientSecret;
  }

  async createClient(orgName: string, orgId: string, token: string) {
    const realmName = process.env.KEYCLOAK_REALM;
    const clientPayload = {
      clientId: `${orgId}`,
      name: `${orgName}`,
      adminUrl: process.env.KEYCLOAK_ADMIN_URL,
      alwaysDisplayInConsole: false,
      access: {
        view: true,
        configure: true,
        manage: true
      },
      attributes: {
        orgId: `${orgId}`
      },
      authenticationFlowBindingOverrides: {},
      authorizationServicesEnabled: false,
      bearerOnly: false,
      directAccessGrantsEnabled: true,
      enabled: true,
      protocol: 'openid-connect',
      description: 'rest-api',

      rootUrl: '${authBaseUrl}',
      baseUrl: `/realms/${realmName}/account/`,
      surrogateAuthRequired: false,
      clientAuthenticatorType: 'client-secret',
      defaultRoles: ['manage-account', 'view-profile'],
      redirectUris: [`/realms/${realmName}/account/*`],
      webOrigins: [],
      notBefore: 0,
      consentRequired: false,
      standardFlowEnabled: true,
      implicitFlowEnabled: false,
      serviceAccountsEnabled: true,
      publicClient: false,
      frontchannelLogout: false,
      fullScopeAllowed: false,
      nodeReRegistrationTimeout: 0
    };

    const createClientResponse = await this.commonService.httpPost(
      await this.keycloakUrlService.createClientURL(realmName),
      clientPayload,
      this.getAuthHeader(token)
    );
    this.logger.debug(`ClientRegistrationService create realm client ${JSON.stringify(createClientResponse)}`);

    const getClientResponse = await this.commonService.httpGet(
      await this.keycloakUrlService.GetClientURL(realmName, `${orgId}`),
      this.getAuthHeader(token)
    );
    this.logger.debug(`ClientRegistrationService get realm admin client ${JSON.stringify(createClientResponse)}`);
    const { id } = getClientResponse[0];
    const client_id = getClientResponse[0].clientId;

    const getClientSercretResponse = await this.commonService.httpGet(
      await this.keycloakUrlService.GetClientSecretURL(realmName, id),
      this.getAuthHeader(token)
    );
    this.logger.debug(
      `ClientRegistrationService get realm admin client secret ${JSON.stringify(getClientSercretResponse)}`
    );
    this.logger.log(`${getClientSercretResponse.value}`);
    const client_secret = getClientSercretResponse.value;

    return {
      idpId: id,
      clientId: client_id,
      clientSecret: client_secret
    };
  }

  async registerApplication(name: string, organizationId: number, token: string) {
    const payload = {
      is_token_endpoint_ip_header_trusted: false,
      name,
      is_first_party: true,
      oidc_conformant: true,
      sso_disabled: false,
      cross_origin_auth: false,
      refresh_token: {
        rotation_type: 'non-rotating',
        expiration_type: 'non-expiring'
      },
      jwt_configuration: {
        alg: 'RS256',
        lifetime_in_seconds: 36000,
        secret_encoded: false
      },
      app_type: 'non_interactive',
      grant_types: ['client_credentials'],
      custom_login_page_on: true,
      client_metadata: {
        organizationId: organizationId.toString()
      }
    };
    const registerAppResponse = await this.commonService.httpPost(
      `${process.env.KEYCLOAK_DOMAIN}${CommonConstants.URL_KEYCLOAK_MANAGEMENT_APPLICATIONS}`,
      payload,
      this.getAuthHeader(token)
    );
    this.logger.debug(`ClientRegistrationService register app ${JSON.stringify(registerAppResponse)}`);

    return {
      clientId: registerAppResponse.data.client_id,
      clientSecret: registerAppResponse.data.client_secret
    };
  }

  async authorizeApi(clientId: string, scope: string[], token: string) {
    const existingGrantsResponse = await this.commonService.httpGet(
      `${process.env.KEYCLOAK_DOMAIN}${CommonConstants.URL_KEYCLOAK_MANAGEMENT_GRANTS}`,
      this.getAuthHeader(token)
    );

    let grantResponse = { data: undefined };
    grantResponse.data = existingGrantsResponse.data.find((grant) => grant.client_id === clientId);
    this.logger.debug(`ClientRegistrationService existing grant ${JSON.stringify(grantResponse)}`);

    if (!grantResponse.data) {
      const payload = {
        client_id: clientId,
        audience: process.env.AUTH0_AUDIENCE,
        scope
      };
      grantResponse = await this.commonService.httpPost(
        `${process.env.KEYCLOAK_DOMAIN}${CommonConstants.URL_KEYCLOAK_MANAGEMENT_GRANTS}`,
        payload,
        this.getAuthHeader(token)
      );
      this.logger.debug(`ClientRegistrationService authorize api ${JSON.stringify(grantResponse)}`);
    }
    return grantResponse.data.id;
  }

  async getToken(payload: ClientCredentialTokenPayloadDto) {
    if ('client_credentials' !== payload.grant_type || !payload.client_id || !payload.client_secret) {
      throw new Error('Invalid inputs while getting token.');
    }
    const strURL = await this.keycloakUrlService.GetSATURL(process.env.KEYCLOAK_REALM);
    this.logger.log(`getToken URL: ${strURL}`);
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    const tokenResponse = await this.commonService.httpPost(
      await this.keycloakUrlService.GetSATURL(process.env.KEYCLOAK_REALM),
      qs.stringify(payload),
      config
    );

    return tokenResponse;
  }

  async getUserToken(email: string, password: string, clientId: string, clientSecret: string) {
    const payload = new userTokenPayloadDto();
    if (!clientId && !clientSecret) {
      this.logger.error(`getUserToken ::: Client ID and client secret are missing`);
      throw new BadRequestException(`Client ID and client secret are missing`);
    }

    const decryptClientId = await this.commonService.decryptPassword(clientId);
    const decryptClientSecret = await this.commonService.decryptPassword(clientSecret);

    payload.client_id = decryptClientId;
    payload.client_secret = decryptClientSecret;
    payload.username = email;
    payload.password = password;

    if (
      'password' !== payload.grant_type ||
      !payload.client_id ||
      !payload.client_secret ||
      !payload.username ||
      !payload.password
    ) {
      throw new Error('Invalid inputs while getting token.');
    }

    const strURL = await this.keycloakUrlService.GetSATURL(process.env.KEYCLOAK_REALM);
    this.logger.log(`getToken URL: ${strURL}`);
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    const tokenResponse = await this.commonService.httpPost(
      await this.keycloakUrlService.GetSATURL(process.env.KEYCLOAK_REALM),
      qs.stringify(payload),
      config
    );

    return tokenResponse;
  }

  async getAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
    try {
      const payload = new accessTokenPayloadDto();
      if (!clientId && !clientSecret) {
        this.logger.error(`getAccessToken ::: Client ID and client secret are missing`);
        throw new BadRequestException(`Client ID and client secret are missing`);
      }

      const decryptClientId = await this.commonService.decryptPassword(clientId);
      const decryptClientSecret = await this.commonService.decryptPassword(clientSecret);

      payload.client_id = decryptClientId;
      payload.client_secret = decryptClientSecret;

      payload.grant_type = 'refresh_token';
      payload.refresh_token = refreshToken;

      if (
        'refresh_token' !== payload.grant_type ||
        !payload.client_id ||
        !payload.client_secret ||
        !payload.refresh_token
      ) {
        throw new Error('Invalid inputs while getting token.');
      }

      const config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      const tokenResponse = await this.commonService.httpPost(
        await this.keycloakUrlService.GetSATURL(process.env.KEYCLOAK_REALM),
        qs.stringify(payload),
        config
      );

      return tokenResponse;
    } catch (error) {
      this.logger.error(`Error in getAccessToken ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getAccessTokenHolder(refreshToken: string) {
    const payload = new accessTokenPayloadDto();
    payload.grant_type = 'refresh_token';
    payload.client_id = process.env.KEYCLOAK_MANAGEMENT_ADEYA_CLIENT_ID;
    payload.refresh_token = refreshToken;
    payload.client_secret = process.env.KEYCLOAK_MANAGEMENT_ADEYA_CLIENT_SECRET;

    this.logger.log(`access Token for holderPayload: ${JSON.stringify(payload)}`);

    if (
      'refresh_token' !== payload.grant_type ||
      !payload.client_id ||
      !payload.client_secret ||
      !payload.refresh_token
    ) {
      throw new Error('Bad Request');
    }

    const strURL = await this.keycloakUrlService.GetSATURL('credebl-platform');
    this.logger.log(`getToken URL: ${strURL}`);
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    const tokenResponse = await this.commonService.httpPost(
      await this.keycloakUrlService.GetSATURL('credebl-platform'),
      qs.stringify(payload),
      config
    );

    this.logger.debug(`ClientRegistrationService token ${JSON.stringify(tokenResponse)}`);
    return tokenResponse;
  }

  async getClientRedirectUrl(clientId: string, token: string) {
    const realmName = process.env.KEYCLOAK_REALM;

    const decryptClientId = await this.commonService.decryptPassword(clientId);
    const redirectUrls = await this.commonService.httpGet(
      await this.keycloakUrlService.GetClientURL(realmName, decryptClientId),
      this.getAuthHeader(token)
    );

    this.logger.debug(`redirectUrls ${JSON.stringify(redirectUrls)}`);

    return redirectUrls;
  }

  async getUserInfoByUserId(userId: string, token: string) {
    const realmName = process.env.KEYCLOAK_REALM;

    const userInfo = await this.commonService.httpGet(
      await this.keycloakUrlService.GetUserInfoURL(realmName, userId),
      this.getAuthHeader(token)
    );

    this.logger.debug(`userInfo ${JSON.stringify(userInfo)}`);

    return userInfo;
  }

  async generateTokenUsingAdminCredentials(clientDetails: ClientTokenDto) {
    const realmName = process.env.KEYCLOAK_REALM;
    const payload = {
      client_id: clientDetails.clientId,
      client_secret: clientDetails.clientSecret,
      grant_type: clientDetails.grantType ?? 'client_credentials'
    };
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    const generatedTokenDetails = await this.commonService.httpPost(
      await this.keycloakUrlService.GetSATURL(realmName),
      qs.stringify(payload),
      config
    );
    return generatedTokenDetails;
  }

  async fetchClientDetails(clientId: string, token: string) {
    const realmName = process.env.KEYCLOAK_REALM;

    const clientDetails = await this.commonService.httpGet(
      await this.keycloakUrlService.GetClientURL(realmName, clientId),
      this.getAuthHeader(token)
    );
    return clientDetails;
  }

  async updateUserEcosystemAccess(
    keycloakUserId: string,
    orgId: string,
    ecosystemId: string,
    role: EcosystemServiceRole,
    token: string
  ): Promise<void> {
    try {
      const realmName = process.env.KEYCLOAK_REALM;
      const userUrl = await this.keycloakUrlService.GetUserInfoURL(realmName, keycloakUserId);
      const currentUser = await this.commonService.httpGet(userUrl, this.getAuthHeader(token));

      if (!currentUser) {
        throw new NotFoundException(`User not found in Keycloak: ${keycloakUserId}`);
      }

      const attributes = currentUser.attributes || {};

      let ecosystemAccess: Record<string, { ecosystem_role: { lead: string[]; member: string[] } }> = {};
      if (attributes.ecosystem_access && attributes.ecosystem_access[0]) {
        try {
          ecosystemAccess = JSON.parse(attributes.ecosystem_access[0]);
        } catch (error) {
          ecosystemAccess = {};
        }
      }

      if (!ecosystemAccess[orgId]) {
        ecosystemAccess[orgId] = { ecosystem_role: { lead: [], member: [] } };
      }

      if (!ecosystemAccess[orgId].ecosystem_role) {
        ecosystemAccess[orgId].ecosystem_role = { lead: [], member: [] };
      }
      if (!ecosystemAccess[orgId].ecosystem_role.lead) {
        ecosystemAccess[orgId].ecosystem_role.lead = [];
      }
      if (!ecosystemAccess[orgId].ecosystem_role.member) {
        ecosystemAccess[orgId].ecosystem_role.member = [];
      }

      const existingEcosystems = ecosystemAccess[orgId].ecosystem_role[role];

      if (!existingEcosystems.includes(ecosystemId)) {
        existingEcosystems.push(ecosystemId);
      }

      ecosystemAccess[orgId].ecosystem_role[role] = existingEcosystems;
      attributes.ecosystem_access = [JSON.stringify(ecosystemAccess)];

      const updatePayload = { ...currentUser, attributes };
      await this.commonService.httpPut(userUrl, updatePayload, this.getAuthHeader(token));
    } catch (error) {
      this.logger.error(`[updateUserEcosystemAccess] Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async updateUserEcosystemLeads(
    keycloakUserId: string,
    orgId: string,
    ecosystemId: string,
    token: string
  ): Promise<void> {
    return this.updateUserEcosystemAccess(keycloakUserId, orgId, ecosystemId, EcosystemServiceRole.LEAD, token);
  }

  async updateUserEcosystemMember(
    keycloakUserId: string,
    orgId: string,
    ecosystemId: string,
    token: string
  ): Promise<void> {
    return this.updateUserEcosystemAccess(keycloakUserId, orgId, ecosystemId, EcosystemServiceRole.MEMBER, token);
  }

  async updateClientServiceAccountEcosystemAccess(
    clientIdpId: string,
    orgId: string,
    ecosystemId: string,
    role: EcosystemServiceRole,
    token: string
  ): Promise<void> {
    try {
      const realmName = process.env.KEYCLOAK_REALM;
      const serviceAccountUrl = await this.keycloakUrlService.GetServiceAccountUserURL(realmName, clientIdpId);
      const serviceAccountUser = await this.commonService.httpGet(serviceAccountUrl, this.getAuthHeader(token));

      if (!serviceAccountUser || !serviceAccountUser.id) {
        return;
      }

      await this.updateUserEcosystemAccess(serviceAccountUser.id, orgId, ecosystemId, role, token);
    } catch (error) {
      this.logger.error(`[updateClientServiceAccountEcosystemAccess] Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async updateClientServiceAccountEcosystemLead(
    clientIdpId: string,
    orgId: string,
    ecosystemId: string,
    token: string
  ): Promise<void> {
    return this.updateClientServiceAccountEcosystemAccess(
      clientIdpId,
      orgId,
      ecosystemId,
      EcosystemServiceRole.LEAD,
      token
    );
  }

  async updateClientServiceAccountEcosystemMember(
    clientIdpId: string,
    orgId: string,
    ecosystemId: string,
    token: string
  ): Promise<void> {
    return this.updateClientServiceAccountEcosystemAccess(
      clientIdpId,
      orgId,
      ecosystemId,
      EcosystemServiceRole.MEMBER,
      token
    );
  }

  async removeUserEcosystemAccess(
    keycloakUserId: string,
    orgId: string,
    ecosystemId: string,
    role: EcosystemServiceRole,
    token: string
  ): Promise<void> {
    try {
      const realmName = process.env.KEYCLOAK_REALM;
      const userUrl = await this.keycloakUrlService.GetUserInfoURL(realmName, keycloakUserId);
      const currentUser = await this.commonService.httpGet(userUrl, this.getAuthHeader(token));

      if (!currentUser) {
        throw new NotFoundException(`User not found in Keycloak: ${keycloakUserId}`);
      }
      const attributes = currentUser.attributes || {};

      let ecosystemAccess: Record<string, { ecosystem_role: { lead: string[]; member: string[] } }> = {};
      if (attributes.ecosystem_access && attributes.ecosystem_access[0]) {
        try {
          ecosystemAccess = JSON.parse(attributes.ecosystem_access[0]);
        } catch {
          return;
        }
      } else {
        return;
      }

      if (!ecosystemAccess[orgId] || !ecosystemAccess[orgId].ecosystem_role) {
        return;
      }

      const existingEcosystems = ecosystemAccess[orgId].ecosystem_role[role] || [];
      const updatedEcosystems = existingEcosystems.filter((id) => id !== ecosystemId);
      ecosystemAccess[orgId].ecosystem_role[role] = updatedEcosystems;
      const orgRoles = ecosystemAccess[orgId].ecosystem_role;
      if (0 === (orgRoles.lead?.length ?? 0) && 0 === (orgRoles.member?.length ?? 0)) {
        delete ecosystemAccess[orgId];
      }

      if (0 < Object.keys(ecosystemAccess).length) {
        attributes.ecosystem_access = [JSON.stringify(ecosystemAccess)];
      } else {
        delete attributes.ecosystem_access;
      }

      const updatePayload = { ...currentUser, attributes };
      await this.commonService.httpPut(userUrl, updatePayload, this.getAuthHeader(token));
    } catch (error) {
      this.logger.error(`[removeUserEcosystemAccess] Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async removeUserEcosystemLead(
    keycloakUserId: string,
    orgId: string,
    ecosystemId: string,
    token: string
  ): Promise<void> {
    return this.removeUserEcosystemAccess(keycloakUserId, orgId, ecosystemId, EcosystemServiceRole.LEAD, token);
  }

  async removeUserEcosystemMember(
    keycloakUserId: string,
    orgId: string,
    ecosystemId: string,
    token: string
  ): Promise<void> {
    return this.removeUserEcosystemAccess(keycloakUserId, orgId, ecosystemId, EcosystemServiceRole.MEMBER, token);
  }
}
