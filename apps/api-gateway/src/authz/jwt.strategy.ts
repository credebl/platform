import * as dotenv from 'dotenv'

import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { CommonConstants } from '@credebl/common/common.constant'
import type { IOrganization } from '@credebl/common/interfaces/organization.interface'
import { ResponseMessages } from '@credebl/common/response-messages'
import { PassportStrategy } from '@nestjs/passport'
import * as jwt from 'jsonwebtoken'
import { passportJwtSecret, type secretType } from 'jwks-rsa'
import type { OrganizationService } from '../organization/organization.service'
import type { UserService } from '../user/user.service'
import type { JwtPayload } from './jwt-payload.interface'

dotenv.config()

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger('Jwt Strategy')

  constructor(
    private readonly usersService: UserService,
    private readonly organizationService: OrganizationService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: (request, jwtToken, done) => {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        const decodedToken: any = jwt.decode(jwtToken)

        if (!decodedToken) {
          throw new UnauthorizedException(ResponseMessages.user.error.invalidAccessToken)
        }

        const audiance = decodedToken.iss.toString()
        const jwtOptions = {
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          jwksUri: `${audiance}${CommonConstants.URL_KEYCLOAK_JWKS}`,
        }
        const secretprovider = passportJwtSecret(jwtOptions)
        let certkey: secretType
        secretprovider(request, jwtToken, async (_err, data) => {
          certkey = data
          done(null, certkey)
        })
      },
      algorithms: ['RS256'],
    })
  }

  async validate(payload: JwtPayload): Promise<object> {
    let userDetails = null
    let userInfo: object

    if (payload?.email) {
      userInfo = await this.usersService.getUserByUserIdInKeycloak(payload?.email)
    }

    // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
    if (payload.hasOwnProperty('client_id')) {
      // biome-ignore lint/complexity/useLiteralKeys: <explanation>
      const orgDetails: IOrganization = await this.organizationService.findOrganizationOwner(payload['client_id'])

      this.logger.log('Organization details fetched')
      if (!orgDetails) {
        throw new NotFoundException(ResponseMessages.organisation.error.orgNotFound)
      }

      // eslint-disable-next-line prefer-destructuring
      const userOrgDetails = orgDetails.userOrgRoles.length > 0 && orgDetails.userOrgRoles[0]

      userDetails = userOrgDetails.user
      userDetails.userOrgRoles = []
      userDetails.userOrgRoles.push({
        id: userOrgDetails.id,
        userId: userOrgDetails.userId,
        orgRoleId: userOrgDetails.orgRoleId,
        orgId: userOrgDetails.orgId,
        orgRole: userOrgDetails.orgRole,
      })

      this.logger.log('User details set')
    } else {
      userDetails = await this.usersService.findUserinKeycloak(payload.sub)
    }

    if (!userDetails) {
      throw new NotFoundException(ResponseMessages.user.error.notFound)
    }
    //TODO patch to QA
    // biome-ignore lint/complexity/useLiteralKeys: <explanation>
    if (userInfo?.['attributes']?.userRole) {
      // biome-ignore lint/complexity/useLiteralKeys: <explanation>
      userDetails.userRole = userInfo?.['attributes']?.userRole
    }

    return {
      ...userDetails,
      ...payload,
    }
  }
}
