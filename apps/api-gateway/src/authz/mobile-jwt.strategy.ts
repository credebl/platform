import * as dotenv from 'dotenv';
import * as jwt from 'jsonwebtoken';

import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { getTrustedJwksUri, getTrustedJwtIssuerVariants, getTrustedJwtIssuers } from './jwt-issuer.util';
dotenv.config();

interface MobileJwtPayload {
  azp?: string;
  iss?: string;
  [key: string]: unknown;
}

@Injectable()
export class MobileJwtStrategy extends PassportStrategy(Strategy, 'mobile-jwt') {
  constructor() {
    const trustedIssuers = getTrustedJwtIssuers();
    const trustedIssuerVariants = getTrustedJwtIssuerVariants(trustedIssuers);
    super({
      secretOrKeyProvider: (request, jwtToken, done) => {
        const decodedToken = jwt.decode(jwtToken);
        const issuer = decodedToken && 'object' === typeof decodedToken ? decodedToken.iss : undefined;
        try {
          const jwtOptions = {
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 5,
            jwksUri: getTrustedJwksUri(issuer, trustedIssuers)
          };
          const secretprovider = passportJwtSecret(jwtOptions);
          secretprovider(request, jwtToken, (err, data) => done(err, data));
        } catch (error) {
          return done(new UnauthorizedException('Authorization header contains an invalid token'), null);
        }
      },
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['RS256'],
      issuer: trustedIssuerVariants
    });
  }

  validate(payload: MobileJwtPayload): MobileJwtPayload {
    if ('adeyaClient' !== payload.azp) {
      throw new UnauthorizedException('Authorization header contains an invalid token');
    } else {
      return payload;
    }
  }
}
