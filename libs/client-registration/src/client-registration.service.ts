
import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import * as qs from 'qs';

import { ClientCredentialTokenPayloadDto } from './dtos/client-credential-token-payload.dto';
import { CommonConstants } from '@credebl/common/common.constant';
import { CommonService } from '@credebl/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { KeycloakUrlService } from '@credebl/keycloak-url';
import { accessTokenPayloadDto } from './dtos/accessTokenPayloadDto';
import { userTokenPayloadDto } from './dtos/userTokenPayloadDto';
import { KeycloakUserRegistrationDto } from 'apps/user/dtos/keycloak-register.dto';
import { ResponseMessages } from '@credebl/common/response-messages';

@Injectable()
export class ClientRegistrationService {
  constructor(private readonly commonService: CommonService,
    private readonly keycloakUrlService: KeycloakUrlService) { }

  private readonly logger = new Logger('ClientRegistrationService');

  async registerKeycloakUser(
    userDetails: KeycloakUserRegistrationDto,
    realm: string,
    token: string
  ) {
    try {
      const url = await this.keycloakUrlService.createUserURL(realm);
      const registerUserResponse = await this.commonService.httpPost(
        url,
        userDetails,
        this.getAuthHeader(token)
      );

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

  async createUser(
    user: CreateUserDto,
    realm: string,
    token: string
  ) {
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
      realmRoles: ['mb-user']
    };

    const registerUserResponse = await this.commonService.httpPost(
      await this.keycloakUrlService.createUserURL(realm),
      payload,
      this.getAuthHeader(token)
    );

    const getUserResponse = await this.commonService.httpGet(
      await this.keycloakUrlService.getUserByUsernameURL(realm, user.email),
      this.getAuthHeader(token)
    );
    const userid = getUserResponse[0].id;


    const setPasswordResponse = await this.resetPasswordOfKeycloakUser(realm, user.password, userid, token);

    return {
      keycloakUserId: getUserResponse[0].id
    };
  }

  async resetPasswordOfKeycloakUser(
    realm: string,
    resetPasswordValue: string,
    userid: string,
    token: string

  ) {

    const passwordPayload = {
      type: 'password',
      value: resetPasswordValue,
      temporary: false
    };
    const setPasswordResponse = await this.commonService.httpPut(
      //await this.keycloakUrlService.ResetPasswordURL(`${process.env.KEYCLOAK_CREDEBL_REALM}`, userid),
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
        throw new UnauthorizedException(
          'Invalid token'
        );
      }

      const payload = decoded['payload'];

      const userInfoResponse = await this.commonService.httpGet(
        `${process.env.KEYCLOAK_DOMAIN}admin/realms/${process.env.KEYCLOAK_REALM}/users/${payload['sub']}`,
        this.getAuthHeader(token)
      );
      this.logger.debug(`keycloak user ${JSON.stringify(userInfoResponse)}`);
      return userInfoResponse.data;
    } catch (error) {
      this.logger.error(`[getUserInfo]: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getManagementToken() {
    try {
      const payload = new ClientCredentialTokenPayloadDto();
      payload.client_id = process.env.KEYCLOAK_MANAGEMENT_CLIENT_ID;
      payload.client_secret = process.env.KEYCLOAK_MANAGEMENT_CLIENT_SECRET;
      payload.scope = 'email profile';
      const mgmtTokenResponse = await this.getToken(payload);
      return mgmtTokenResponse.access_token;
    } catch (error) {

      throw error;
    }
  }


  async getManagementTokenForMobile() {
    try {
      const payload = new ClientCredentialTokenPayloadDto();
      payload.client_id = process.env.KEYCLOAK_MANAGEMENT_ADEYA_CLIENT_ID;
      payload.client_secret = process.env.KEYCLOAK_MANAGEMENT_ADEYA_CLIENT_SECRET;
      payload.scope = 'email profile';

      this.logger.log(`management Payload: ${JSON.stringify(payload)}`);
      const mgmtTokenResponse = await this.getToken(payload);
      this.logger.debug(
        `ClientRegistrationService management token ${JSON.stringify(
          mgmtTokenResponse
        )}`
      );
      //return mgmtTokenResponse;
      return mgmtTokenResponse;
    } catch (error) {

      throw error;
    }
  }

  async getClientIdAndSecret(
    clientId: string,
    token: string
  ): Promise<{ clientId: string; clientSecret: string }> | undefined {
    // Client id cannot be undefined
    if (!clientId) {
      return;
    }
    try {
      const realmName = process.env.KEYCLOAK_CREDEBL_REALM;
      const getClientResponse = await this.commonService.httpGet(
        await this.keycloakUrlService.GetClientURL(realmName, clientId),
        this.getAuthHeader(token)
      );
      const { id } = getClientResponse[0];
      const client_id = getClientResponse[0].clientId;

      const response = await this.commonService.httpGet(
        `${process.env.KEYCLOAK_DOMAIN
        }${CommonConstants.URL_KEYCLOAK_CLIENT_SECRET.replace(
          '{id}',
          id
        )}`,
        this.getAuthHeader(token)
      );

      this.logger.debug(`Existing apps response ${JSON.stringify(response)}`);

      return {
        clientId: client_id,
        clientSecret: response.value
      };
    } catch (error) {
      if (404 === error?.response?.statusCode) {

      } else {
        this.logger.error(
          `Caught exception while retrieving clientSecret from Auth0: ${JSON.stringify(
            error
          )}`
        );
        throw new Error('Unable to retrieve clientSecret from server');
      }
    }
  }


  async createClient(
    name: string,
    token: string
  ) {

    //create client for respective created realm in order to access its resources
    const realmName = process.env.KEYCLOAK_CREDEBL_REALM;
    const clientPayload = {
      clientId: `admin-${name}`,
      name: `admin-${name}`,
      adminUrl: process.env.KEYCLOAK_ADMIN_URL,
      alwaysDisplayInConsole: false,
      access: {
        view: true,
        configure: true,
        manage: true
      },
      attributes: {},
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
      defaultRoles: [
        'manage-account',
        'view-profile'
      ],
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
      nodeReRegistrationTimeout: 0,
      defaultClientScopes: [
        'web-origins',
        'role_list',
        'profile',
        'roles',
        'email'
      ],
      optionalClientScopes: [
        'address',
        'phone',
        'offline_access',
        'microprofile-jwt'
      ]
    };

    const createClientResponse = await this.commonService.httpPost(
      await this.keycloakUrlService.createClientURL(realmName),
      clientPayload,
      this.getAuthHeader(token)
    );
    this.logger.debug(
      `ClientRegistrationService create realm client ${JSON.stringify(
        createClientResponse
      )}`
    );

    const getClientResponse = await this.commonService.httpGet(
      await this.keycloakUrlService.GetClientURL(realmName, `admin-${name}`),
      this.getAuthHeader(token)
    );
    this.logger.debug(
      `ClientRegistrationService get realm admin client ${JSON.stringify(
        createClientResponse
      )}`
    );
    const { id } = getClientResponse[0];
    const client_id = getClientResponse[0].clientId;

    const getClientSercretResponse = await this.commonService.httpGet(
      await this.keycloakUrlService.GetClientSecretURL(realmName, id),
      this.getAuthHeader(token)
    );
    this.logger.debug(
      `ClientRegistrationService get realm admin client secret ${JSON.stringify(
        getClientSercretResponse
      )}`
    );
    this.logger.log(`${getClientSercretResponse.value}`);
    const client_secret = getClientSercretResponse.value;

    return {
      //  response: JSON.stringify(
      //     registerAppResponse
      //   )
      clientId: client_id,
      clientSecret: client_secret
    };
  }

  async registerApplication(
    name: string,
    organizationId: number,
    token: string
  ) {
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
    this.logger.debug(
      `ClientRegistrationService register app ${JSON.stringify(
        registerAppResponse
      )}`
    );

    return {
      clientId: registerAppResponse.data.client_id,
      clientSecret: registerAppResponse.data.client_secret
    };
  }

  async authorizeApi(clientId: string, scope: string[], token: string) {
    try {
      const existingGrantsResponse = await this.commonService.httpGet(
        `${process.env.KEYCLOAK_DOMAIN}${CommonConstants.URL_KEYCLOAK_MANAGEMENT_GRANTS}`,
        this.getAuthHeader(token)
      );

      // If an grant matching the client id is already found, don't recreate it.
      let grantResponse = { data: undefined };
      grantResponse.data = existingGrantsResponse.data.find(
        (grant) => grant.client_id === clientId
      );
      this.logger.debug(
        `ClientRegistrationService existing grant ${JSON.stringify(
          grantResponse
        )}`
      );

      // Grant wasn't found, so we need to create it
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
        this.logger.debug(
          `ClientRegistrationService authorize api ${JSON.stringify(
            grantResponse
          )}`
        );
      }
      return grantResponse.data.id;
    } catch (error) {
      throw error;
    }
  }

  async getToken(payload: ClientCredentialTokenPayloadDto) {
    try {
      this.logger.log(`getting token : ${JSON.stringify(payload)}`);
      if (
        'client_credentials' !== payload.grant_type ||
        !payload.client_id ||
        !payload.client_secret
      ) {
        throw new Error('Invalid inputs while getting token.');
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
        qs.stringify(payload)
        , config);

      this.logger.debug(
        `ClientRegistrationService token ${JSON.stringify(tokenResponse)}`
      );
      return tokenResponse;
    } catch (error) {
      throw error;
    }
  }

  async CreateConnection(clientId: string, token: string) {
    const payload = {
      name: 'TestConnection1',
      display_name: 'Connectiondisplay',
      strategy: 'auth0',
      options: {
        enabledDatabaseCustomization: true,
        import_mode: false,
        customScripts: {
          login: 'function login(email, password, callback) {\n  //this example uses the "pg" library\n  //more info here: https://github.com/brianc/node-postgres\n\n  const bcrypt = require(\'bcrypt\');\n  const postgres = require(\'pg\');\n\n  const conString = `postgres://${configuration.pg_user}:${configuration.pg_pass}@${configuration.pg_ip}/${configuration.pg_db}`;\n  postgres.connect(conString, function (err, client, done) {\n    if (err) return callback(err);\n\t\t\t\n    const query = \'SELECT id, email, password FROM public.user WHERE email = $1 or username = $1\';\n    client.query(query, [email], function (err, result) {\n      // NOTE: always call done() here to close\n      // the connection to the database\n      done();\n\n      if (err || result.rows.length === 0) return callback(err || new WrongUsernameOrPasswordError(email));\n\n      const user = result.rows[0];\n\n      //if(password === user.password) {\n        this.logger.log(email);\n        if (password === user.password) return callback(err || new WrongUsernameOrPasswordError(email));\n\n        return callback(null, {\n          user_id: user.id,\n          email: user.email\n        });\n      });\n      \n    });\n  //});\n}',
          create: 'function create(user, callback) {\n  // This script should create a user entry in your existing database. It will\n  // be executed when a user attempts to sign up, or when a user is created\n  // through the Auth0 dashboard or API.\n  // When this script has finished executing, the Login script will be\n  // executed immediately afterwards, to verify that the user was created\n  // successfully.\n  //\n  // The user object will always contain the following properties:\n  // * email: the user\'s email\n  // * password: the password entered by the user, in plain text\n  // * tenant: the name of this Auth0 account\n  // * client_id: the client ID of the application where the user signed up, or\n  //              API key if created through the API or Auth0 dashboard\n  // * connection: the name of this database connection\n  //\n  // There are three ways this script can finish:\n  // 1. A user was successfully created\n  //     callback(null);\n  // 2. This user already exists in your database\n  //     callback(new ValidationError("user_exists", "my error message"));\n  // 3. Something went wrong while trying to reach your database\n  //     callback(new Error("my error message"));\n\n  const msg = \'Please implement the Create script for this database connection \' +\n    \'at https://manage.auth0.com/#/connections/database\';\n  return callback(new Error(msg));\n}\n',
          delete: 'function remove(id, callback) {\n  // This script remove a user from your existing database.\n  // It is executed whenever a user is deleted from the API or Auth0 dashboard.\n  //\n  // There are two ways that this script can finish:\n  // 1. The user was removed successfully:\n  //     callback(null);\n  // 2. Something went wrong while trying to reach your database:\n  //     callback(new Error("my error message"));\n\n  const msg = \'Please implement the Delete script for this database \' +\n    \'connection at https://manage.auth0.com/#/connections/database\';\n  return callback(new Error(msg));\n}\n',
          verify: 'function verify(email, callback) {\n  // This script should mark the current user\'s email address as verified in\n  // your database.\n  // It is executed whenever a user clicks the verification link sent by email.\n  // These emails can be customized at https://manage.auth0.com/#/emails.\n  // It is safe to assume that the user\'s email already exists in your database,\n  // because verification emails, if enabled, are sent immediately after a\n  // successful signup.\n  //\n  // There are two ways that this script can finish:\n  // 1. The user\'s email was verified successfully\n  //     callback(null, true);\n  // 2. Something went wrong while trying to reach your database:\n  //     callback(new Error("my error message"));\n  //\n  // If an error is returned, it will be passed to the query string of the page\n  // where the user is being redirected to after clicking the verification link.\n  // For example, returning `callback(new Error("error"))` and redirecting to\n  // https://example.com would redirect to the following URL:\n  //     https://example.com?email=alice%40example.com&message=error&success=false\n\n  const msg = \'Please implement the Verify script for this database connection \' +\n    \'at https://manage.auth0.com/#/connections/database\';\n  return callback(new Error(msg));\n}\n',
          get_user: 'function getByEmail(email, callback) {\n  // This script should retrieve a user profile from your existing database,\n  // without authenticating the user.\n  // It is used to check if a user exists before executing flows that do not\n  // require authentication (signup and password reset).\n  //\n  // There are three ways this script can finish:\n  // 1. A user was successfully found. The profile should be in the following\n  // format: https://auth0.com/docs/users/normalized/auth0/normalized-user-profile-schema.\n  //     callback(null, profile);\n  // 2. A user was not found\n  //     callback(null);\n  // 3. Something went wrong while trying to reach your database:\n  //     callback(new Error("my error message"));\n\n  const msg = \'Please implement the Get User script for this database connection \' +\n    \'at https://manage.auth0.com/#/connections/database\';\n  return callback(new Error(msg));\n}\n',
          change_password: 'function changePassword(email, newPassword, callback) {\n  // This script should change the password stored for the current user in your\n  // database. It is executed when the user clicks on the confirmation link\n  // after a reset password request.\n  // The content and behavior of password confirmation emails can be customized\n  // here: https://manage.auth0.com/#/emails\n  // The `newPassword` parameter of this function is in plain text. It must be\n  // hashed/salted to match whatever is stored in your database.\n  //\n  // There are three ways that this script can finish:\n  // 1. The user\'s password was updated successfully:\n  //     callback(null, true);\n  // 2. The user\'s password was not updated:\n  //     callback(null, false);\n  // 3. Something went wrong while trying to reach your database:\n  //     callback(new Error("my error message"));\n  //\n  // If an error is returned, it will be passed to the query string of the page\n  // where the user is being redirected to after clicking the confirmation link.\n  // For example, returning `callback(new Error("error"))` and redirecting to\n  // https://example.com would redirect to the following URL:\n  //     https://example.com?email=alice%40example.com&message=error&success=false\n\n  const msg = \'Please implement the Change Password script for this database \' +\n    \'connection at https://manage.auth0.com/#/connections/database\';\n  return callback(new Error(msg));\n}\n'
        },
        passwordPolicy: 'good',
        password_complexity_options: {
          min_length: 8
        },
        password_history: {
          size: 5,
          enable: false
        },
        password_no_personal_info: {
          enable: false
        },
        password_dictionary: {
          enable: false,
          dictionary: []
        },

        gateway_authentication: 'object'
      },
      enabled_clients: [clientId],
      realms: [''],
      metadata: {}

    };

    const clientConnResponse = await this.commonService.httpPost(
      `${process.env.KEYCLOAK_DOMAIN}${CommonConstants.URL_KEYCLOAK_MANAGEMENT_CONNECTIONS}`,
      payload,
      this.getAuthHeader(token)
    );
    this.logger.debug(
      `ClientRegistrationService create connection app ${JSON.stringify(
        clientConnResponse
      )}`
    );

    return {
      name: clientConnResponse.data.name,
      id: clientConnResponse.data.id
    };
  }


  async getUserToken(email: string, password: string) {
    try {
      const payload = new userTokenPayloadDto();
      payload.client_id = process.env.KEYCLOAK_MANAGEMENT_CLIENT_ID;
      payload.client_secret = process.env.KEYCLOAK_MANAGEMENT_CLIENT_SECRET;
      payload.username = email;
      payload.password = password;

      this.logger.log(`User Token Payload: ${JSON.stringify(payload)}`);


      if (
        'password' !== payload.grant_type ||
        !payload.client_id ||
        !payload.client_secret ||
        !payload.username ||
        !payload.password

      ) {
        throw new Error('Invalid inputs while getting token.');
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
        qs.stringify(payload)
        , config);

      this.logger.debug(
        `ClientRegistrationService token ${JSON.stringify(tokenResponse)}`
      );
      return tokenResponse;

    } catch (error) {

      throw error;
    }
  }

  async getAccessToken(refreshToken: string) {
    try {
      const payload = new accessTokenPayloadDto();
      payload.grant_type = 'refresh_token';
      payload.client_id = process.env.KEYCLOAK_MANAGEMENT_CLIENT_ID;
      payload.refresh_token = refreshToken;
      payload.client_secret = process.env.KEYCLOAK_MANAGEMENT_CLIENT_SECRET;


      this.logger.log(`access Token for platform Payload: ${JSON.stringify(payload)}`);


      if (
        'refresh_token' !== payload.grant_type ||
        !payload.client_id ||
        !payload.client_secret ||
        !payload.refresh_token

      ) {
        throw new Error('Invalid inputs while getting token.');
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
        qs.stringify(payload)
        , config);

      this.logger.debug(
        `ClientRegistrationService token ${JSON.stringify(tokenResponse)}`
      );
      return tokenResponse;

    } catch (error) {

      throw error;
    }
  }

  async getAccessTokenHolder(refreshToken: string) {
    try {
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
        qs.stringify(payload)
        , config);

      this.logger.debug(
        `ClientRegistrationService token ${JSON.stringify(tokenResponse)}`
      );
      return tokenResponse;

    } catch (error) {

      throw error;
    }
  }


}