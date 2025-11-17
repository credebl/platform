import * as dotenv from 'dotenv';

import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';

import { JwtPayload } from './jwt-payload.interface';
import { PassportStrategy } from '@nestjs/passport';
import { UserService } from '../user/user.service';
import * as jwt from 'jsonwebtoken';
import { passportJwtSecret } from 'jwks-rsa';
import { CommonConstants } from '@credebl/common/common.constant';
import { OrganizationService } from '../organization/organization.service';
import { IOrganization } from '@credebl/common/interfaces/organization.interface';
import { ResponseMessages } from '@credebl/common/response-messages';

dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger('Jwt Strategy');

  constructor(
    private readonly usersService: UserService,
    private readonly organizationService: OrganizationService
    ) {

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: (request, jwtToken, done) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decodedToken: any = jwt.decode(jwtToken);

        if (!decodedToken) {
          throw new UnauthorizedException(ResponseMessages.user.error.invalidAccessToken);
        }

        const audiance = decodedToken.iss.toString();
        const jwtOptions = {
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          jwksUri: `${audiance}${CommonConstants.URL_KEYCLOAK_JWKS}`
        };
        const secretprovider = passportJwtSecret(jwtOptions);
        let certkey;
        secretprovider(request, jwtToken, async (err, data) => {
          certkey = data;
          done(null, certkey);
        });
      },
      algorithms: ['RS256']
    });  
  }

  async validate(payload: JwtPayload): Promise<object> {

    let userDetails = null;
    let userInfo;

    if (payload && !(payload.preferred_username.includes('service-account'))) {
      userInfo = await this.usersService.getUserByUserIdInKeycloak(payload?.preferred_username);
    }
    
    if (payload.hasOwnProperty('client_id')) {
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

    } else {
      userDetails = await this.usersService.findUserinKeycloak(payload.sub);
    }
    
    if (!userDetails) {
      throw new NotFoundException(ResponseMessages.user.error.notFound);
    }
    //TODO patch to QA
    if (userInfo && userInfo?.['attributes'] && userInfo?.['attributes']?.userRole) {
      userDetails['userRole'] = userInfo?.['attributes']?.userRole;
    }

    return {
      ...userDetails,
      ...payload
    };
  }
}
