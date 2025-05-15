import * as dotenv from 'dotenv'
import * as jwt from 'jsonwebtoken'

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { CommonConstants } from '@credebl/common/common.constant'
import { PassportStrategy } from '@nestjs/passport'
import { passportJwtSecret, type secretType } from 'jwks-rsa'
import type { JwtPayload } from './jwt-payload.interface'
dotenv.config()
const _logger = new Logger()

@Injectable()
export class MobileJwtStrategy extends PassportStrategy(Strategy, 'mobile-jwt') {
  private readonly logger = new Logger()

  constructor() {
    super({
      secretOrKeyProvider: (request, jwtToken, done) => {
        const decodedToken = jwt.decode(jwtToken) as JwtPayload
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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['RS256'],
    })
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  validate(payload: any) {
    if (payload.azp !== 'adeyaClient') {
      throw new UnauthorizedException('Authorization header contains an invalid token')
    }
    return payload
  }
}
