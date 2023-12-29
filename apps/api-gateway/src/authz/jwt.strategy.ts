import * as dotenv from 'dotenv';

import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, Logger } from '@nestjs/common';

import { JwtPayload } from './jwt-payload.interface';
import { NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserService } from '../user/user.service';

dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger();

  constructor(
    private readonly usersService: UserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.SUPABASE_JWT_SECRET,
      ignoreExpiration: false
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
