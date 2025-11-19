import * as dotenv from 'dotenv';
import * as jwt from 'jsonwebtoken';

import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { CommonConstants } from '@credebl/common/common.constant';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
dotenv.config();

@Injectable()
export class MobileJwtStrategy extends PassportStrategy(Strategy, 'mobile-jwt') {
  private readonly logger = new Logger();

  constructor() {
    super({

      secretOrKeyProvider: (request, jwtToken, done) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decodedToken: any = jwt.decode(jwtToken);       
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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['RS256']
    });
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type
  validate(payload: any) {
    if ('adeyaClient' !== payload.azp) {
      throw new UnauthorizedException(
        'Authorization header contains an invalid token'
      );
    } else {
      return payload;
    }
    
  }
}
