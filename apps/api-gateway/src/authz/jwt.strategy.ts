/* eslint-disable camelcase */
import * as dotenv from 'dotenv';
import * as jwt from 'jsonwebtoken';

import { uuidRegex } from '@credebl/common/common.constant';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { AuthzService } from './authz.service';
import { IOrganization } from '@credebl/common/interfaces/organization.interface';
import { JwtPayload } from './jwt-payload.interface';
import { OrganizationService } from '../organization/organization.service';
import { PassportStrategy } from '@nestjs/passport';
import { ResponseMessages } from '@credebl/common/response-messages';
import { UserService } from '../user/user.service';
import { passportJwtSecret } from 'jwks-rsa';
import { getTrustedJwksUri, getTrustedJwtIssuerVariants, getTrustedJwtIssuers } from './jwt-issuer.util';

dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger('Jwt Strategy');

  constructor(
    private readonly usersService: UserService,
    private readonly organizationService: OrganizationService,
    private readonly authzService: AuthzService
  ) {
    const trustedIssuers = getTrustedJwtIssuers();
    const trustedIssuerVariants = getTrustedJwtIssuerVariants(trustedIssuers);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: async (request, jwtToken, done) => {
        // Todo: We need to add this logic in seprate jwt gurd to handle the token expiration functionality.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decodedToken: any = jwt.decode(jwtToken);
        if (!decodedToken) {
          return done(new UnauthorizedException(ResponseMessages.user.error.invalidAccessToken), null);
        }

        try {
          const jwtOptions = {
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 5,
            jwksUri: getTrustedJwksUri(decodedToken.iss, trustedIssuers)
          };
          const secretprovider = passportJwtSecret(jwtOptions);
          secretprovider(request, jwtToken, (err, data) => done(err, data));
        } catch (error) {
          return done(new UnauthorizedException(ResponseMessages.user.error.invalidAccessToken), null);
        }
      },
      algorithms: ['RS256'],
      issuer: trustedIssuerVariants
    });
  }

  async validate(payload: JwtPayload): Promise<object> {
    let userDetails = null;
    let userInfo;

    const sessionId = payload?.sid;
    let sessionDetails = null;
    if (sessionId) {
      try {
        sessionDetails = await this.authzService.checkSession(sessionId);
      } catch (error) {
        this.logger.log('Error in JWT Stratergy while fetching session details', JSON.stringify(error, null, 2));
      }
      if (!sessionDetails) {
        throw new UnauthorizedException(ResponseMessages.user.error.invalidAccessToken);
      }
    }
    if (payload?.email) {
      userInfo = await this.usersService.getUserByUserIdInKeycloak(payload?.email);
    }

    if (payload.hasOwnProperty('client_id') && uuidRegex.test(payload['client_id'])) {
      const orgDetails: IOrganization = await this.organizationService.findOrganizationOwner(payload['client_id']);
      this.logger.log('Organization details fetched');
      if (!orgDetails) {
        throw new NotFoundException(ResponseMessages.organisation.error.orgNotFound);
      }

      // eslint-disable-next-line prefer-destructuring
      const userOrgDetails = 0 < orgDetails.userOrgRoles.length && orgDetails.userOrgRoles[0];
      userDetails = userOrgDetails.user;
      userDetails.userOrgRoles = [];
      userDetails.userOrgRoles.push({
        id: userOrgDetails.id,
        userId: userOrgDetails.userId,
        orgRoleId: userOrgDetails.orgRoleId,
        orgId: userOrgDetails.orgId,
        orgRole: userOrgDetails.orgRole
      });

      this.logger.log('User details set');
    } else if (!payload.hasOwnProperty('client_id')) {
      userDetails = await this.usersService.findUserinKeycloak(payload.sub);
    }

    const isServiceToken = payload.hasOwnProperty('client_id') && !uuidRegex.test(payload['client_id'] as string);
    if (!userDetails && !isServiceToken) {
      throw new NotFoundException(ResponseMessages.user.error.notFound);
    }
    //TODO patch to QA
    if (userInfo && userInfo?.['attributes'] && userInfo?.['attributes']?.userRole) {
      userDetails['userRole'] = userInfo?.['attributes']?.userRole;
    }

    if (userDetails && payload?.ecosystem_access) {
      userDetails.ecosystem_access = payload.ecosystem_access;
    }

    return {
      ...userDetails,
      ...payload
    };
  }
}
