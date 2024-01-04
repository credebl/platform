import * as dotenv from 'dotenv';

import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, Logger } from '@nestjs/common';

import { JwtPayload } from './jwt-payload.interface';
import { NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserService } from '../user/user.service';
import * as jwt from 'jsonwebtoken';
import { passportJwtSecret } from 'jwks-rsa';
import { CommonConstants } from '@credebl/common/common.constant';

dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger();

  constructor(private readonly usersService: UserService) {

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: (request, jwtToken, done) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decodedToken: any = jwt.decode(jwtToken);

        if (decodedToken.hasOwnProperty('clientId')) {

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
        } else {
          
          done(null, process.env.SUPABASE_JWT_SECRET);
        }
      }
      // algorithms: ['RS256']
    });  
  }

  async validate(payload: JwtPayload): Promise<object> {

    const userDetails = await this.usersService.findUserinSupabase(payload.sub);

    if (!userDetails) {
      throw new NotFoundException('User not found');
    }

    return {
      ...userDetails,
      ...payload
    };
  }
}
