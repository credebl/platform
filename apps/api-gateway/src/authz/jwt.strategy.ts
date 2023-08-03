// src/authz/jwt.strategy.ts

import * as dotenv from 'dotenv';
import * as jwt from 'jsonwebtoken';

import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, Logger } from '@nestjs/common';

import { CommonConstants } from '@credebl/common/common.constant';
import { JwtPayload } from './jwt-payload.interface';
import { NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserService } from '../user/user.service';
import { passportJwtSecret } from 'jwks-rsa';

dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger();

  constructor(
    private readonly usersService: UserService
  ) {
    super({

      secretOrKeyProvider: (request, jwtToken, done) => {
        const decodedToken = jwt.decode(jwtToken) as jwt.JwtPayload;       
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
  async validate(payload: JwtPayload): Promise<object> {

    const userDetails = await this.usersService.findUserByKeycloakId(payload?.sub);
    
    if (!userDetails.response) {
      throw new NotFoundException('Keycloak user not found');
    }
    
    return {
      ...userDetails.response,
      ...payload
    };
  }
}
