/* eslint-disable camelcase */
import { HttpException, Injectable, Logger, type NestMiddleware, UnauthorizedException } from '@nestjs/common'

import { CommonConstants } from '@credebl/common/common.constant'
import { JwtService } from '@nestjs/jwt'
import type { NextFunction } from 'express'
import { ExtractJwt } from 'passport-jwt'
import type { AuthzService } from './authz.service'
import { RequestingUser } from './dtos/requesting-user.dto'

@Injectable()
export class AuthzMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthzService) {}
  private readonly logger = new Logger('AuthzMiddleware')

  /**
   * Decodes and extracts the payload from the token
   *
   * @param token The authorization bearer token
   *
   * @throws UnauthorizedException If the token is not found
   */
  getPayload = (token: string): unknown => {
    if (!token) {
      throw new UnauthorizedException('Authorization header does not contain a token')
    }

    // ignore options since we don't need to verify here
    const jwtService = new JwtService({})
    const decoded = jwtService.decode(token, { complete: true })

    if (!decoded) {
      throw new UnauthorizedException('Authorization header contains an invalid token')
    }

    // TODO: add type to decoded

    return decoded['payload']
  }

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    // get token and decode or any custom auth logic
    try {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req as any)
      let payload: unknown

      try {
        payload = this.getPayload(token)
      } catch (error) {
        this.logger.log(`Caught error while parsing payload: ${error}`)
        next(error)
        return
      }

      const requestor = new RequestingUser()
      const tenant = (await this.authService.getUserByKeycloakUserId(payload['sub']))?.response
      if (!tenant) {
        req['requestor'] = requestor
        return next()
      }

      this.populateRequestorFromTenant(tenant, requestor)
      // biome-ignore lint: Not able to replace 'using Object.hasOwn() instead of using Object.hasOwnProperty()'
      if (!payload.hasOwnProperty('clientId')) {
        await this.populateRequestorFromUser(payload, requestor)
      } else {
        this.logger.log(`tenant requestor.permissions: ${JSON.stringify(requestor)}`)
      }

      req['requestor'] = requestor
      next()
    } catch (error) {
      this.logger.error(`RequestorMiddleware Error in middleware: ${error} ${JSON.stringify(error)}`)
      next(new HttpException(error, 500))
    }
  }

  // biome-ignore lint: This is temporary fix need to define type for 'tenant'
  private populateRequestorFromTenant(tenant: any, requestor: RequestingUser): void {
    this.logger.log(`tenant this.authService.getUserByKeycloakUserId: ${tenant.keycloakUserId}`)
    this.logger.log(`tenant id: ${tenant.id}`)

    requestor.tenant_name = `${tenant.firstName} ${tenant.lastName}`
    requestor.tenant_id = tenant.id
    requestor.userRoleOrgPermissions = tenant.userRoleOrgMap
    requestor.orgId = tenant.userRoleOrgMap[0].organization.id
    requestor.apiKey = tenant.userRoleOrgMap[0].organization.apiKey
    requestor.agentEndPoint = tenant.userRoleOrgMap[0].organization.agentEndPoint

    const tenantOrg = tenant.userRoleOrgMap.find(
      (item) => item.organization.orgRole.id === CommonConstants.ORG_TENANT_ROLE
    )?.organization

    if (tenantOrg) {
      this.logger.log(`In Tenant Org matched id : ${tenantOrg.id}`)
      requestor.tenantOrgId = tenantOrg.id
    }
  }

  // biome-ignore lint: This is temporary fix need to define type for 'payload'
  private async populateRequestorFromUser(payload: any, requestor: RequestingUser): Promise<void> {
    requestor.email = payload['email']
    const userData = (await this.authService.getUserByKeycloakUserId(payload['sub']))?.response

    if (!userData) return

    this.logger.debug(`User by keycloak ID ${userData.id}`)
    requestor.userId = userData.id
    requestor.name = `${userData.firstName} ${userData.lastName}`

    if (userData.organization != null) {
      this.logger.log(`Org Not Null: ${userData.organization.id}`)
      requestor.orgId = userData.organization.id
    }

    this.logger.log(` user id ${userData.id}`)
  }
}
