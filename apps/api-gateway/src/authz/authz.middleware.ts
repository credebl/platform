/* eslint-disable camelcase */
import {
  HttpException,
  Injectable,
  Logger,
  NestMiddleware,
  UnauthorizedException
} from '@nestjs/common';

import { AuthzService } from './authz.service';
import { CommonConstants } from '@credebl/common/common.constant';
import { ExtractJwt } from 'passport-jwt';
import { JwtService } from '@nestjs/jwt';
import { NextFunction } from 'express';
import { RequestingUser } from './dtos/requesting-user.dto';

@Injectable()
export class AuthzMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthzService) { }
  private readonly logger = new Logger('AuthzMiddleware');

  /**
   * Decodes and extracts the payload from the token
   *
   * @param token The authorization bearer token
   *
   * @throws UnauthorizedException If the token is not found
   */
  getPayload = (token: string): unknown => {

    if (!token) {
      throw new UnauthorizedException(
        'Authorization header does not contain a token'
      );
    }

    // ignore options since we don't need to verify here
    const jwtService = new JwtService({});
    const decoded = jwtService.decode(token, { complete: true });

    if (!decoded) {
      throw new UnauthorizedException(
        'Authorization header contains an invalid token'
      );
    }

    return decoded['payload'];
  };

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // get token and decode or any custom auth logic
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req as any);
      let payload;

      try {
        payload = this.getPayload(token);
      } catch (error) {
        this.logger.log(`Caught error while parsing payload: ${error}`);
        next(error);
        return;
      }

      const requestor = new RequestingUser();
      const tenant = (await this.authService.getUserByKeycloakUserId(payload['sub']))?.response;
      
      if (tenant) {
        this.logger.log(`tenant this.authService.getUserByKeycloakUserId: ${tenant.keycloakUserId}`);
        this.logger.log(`tenant id: ${tenant.id}`);

        requestor.tenant_name = `${tenant.firstName} ${tenant.lastName}`;
        requestor.tenant_id = tenant.id;
        requestor.userRoleOrgPermissions = tenant.userRoleOrgMap;
        requestor.orgId = tenant.userRoleOrgMap[0].organization.id;
        requestor.apiKey = tenant.userRoleOrgMap[0].organization.apiKey;
        requestor.agentEndPoint = tenant.userRoleOrgMap[0].organization.agentEndPoint;

        let tenantOrgInfo;

        for (const item of tenant.userRoleOrgMap) {
          this.logger.log(`${JSON.stringify(item.organization.orgRole)}`);

          if (item.organization.orgRole.id == CommonConstants.ORG_TENANT_ROLE) {
            this.logger.log(`In Tenant Org matched id : ${item.organization.id}`);
            tenantOrgInfo = item.organization;

          }
        }

        if (null != tenantOrgInfo) {
          requestor.tenantOrgId = tenantOrgInfo.id;
        }

        if (payload.hasOwnProperty('clientId')) {
          this.logger.log(`tenant requestor.permissions: ${JSON.stringify(requestor)}`);
        } else {
          requestor.email = payload['email'];

          const userData
           = (
            await this.authService.getUserByKeycloakUserId(payload['sub'])
          )?.response;

          this.logger.debug(`User by keycloak ID ${userData.id}`);

          requestor.userId = userData?.id;
          requestor.name = `${userData.firstName} ${userData.lastName}`;

          if (null != userData?.organization) {
            this.logger.log(`Org Not Null: ${userData?.organization.Id} `);
            requestor.orgId = userData?.organization.id;
          }

          this.logger.log(` user id ${userData.id}`);
        }
      }

      req['requestor'] = requestor;

      next();
    } catch (error) {
      this.logger.error(
        `RequestorMiddleware Error in middleware: ${error} ${JSON.stringify(
          error
        )}`
      );
      next(new HttpException(error, 500));
    }
  }
}
