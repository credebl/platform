import { BadRequestException, CanActivate, ExecutionContext, Logger } from '@nestjs/common';

import { HttpException } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ECOSYSTEM_ROLES_KEY } from '../decorators/roles.decorator';
import { Reflector } from '@nestjs/core';
import { EcosystemService } from '../../ecosystem/ecosystem.service';
import { EcosystemRoles } from '@credebl/enum/enum';
import { ResponseMessages } from '@credebl/common/response-messages';

@Injectable()
export class EcosystemRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly ecosystemService: EcosystemService // Inject the service
    ) { }            


  private logger = new Logger('Ecosystem Role Guard');
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<EcosystemRoles[]>(ECOSYSTEM_ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    const requiredRolesNames = Object.values(requiredRoles) as string[];

    if (!requiredRolesNames) {
      return true;
    }

    // Request requires org check, proceed with it
    const req = context.switchToHttp().getRequest();

    const { user } = req;

    req.params.ecosystemId = req.params?.ecosystemId ? req.params?.ecosystemId?.trim() : '';
    req.query.ecosystemId = req.query?.ecosystemId ? req.query?.ecosystemId?.trim() : '';
    req.body.ecosystemId = req.body?.ecosystemId ? req.body?.ecosystemId?.trim() : '';

    const ecosystemId = req.params.ecosystemId || req.query.ecosystemId || req.body.ecosystemId;
  
    if (!ecosystemId) {
      throw new BadRequestException(ResponseMessages.organisation.error.ecosystemIdIsRequired);
    }

    if ((req.params.orgId || req.query.orgId || req.body.orgId) 
    && (req.params.ecosystemId || req.query.ecosystemId || req.body.ecosystemId)) {

      const orgId = req.params.orgId || req.query.orgId || req.body.orgId;
      const ecosystemId = req.params.ecosystemId || req.query.ecosystemId || req.body.ecosystemId;


      const ecosystemOrgData = await this.ecosystemService.fetchEcosystemOrg(ecosystemId, orgId);

      if (!ecosystemOrgData) {
        throw new HttpException('Organization does not match', HttpStatus.FORBIDDEN);
      }

      const {response} = ecosystemOrgData;

      user.ecosystemOrgRole = response['ecosystemRole']['name'];

      if (!user.ecosystemOrgRole) {
        throw new HttpException('Ecosystem role not match', HttpStatus.FORBIDDEN);
      }

    } else {
      throw new HttpException('organization & ecosystem is required', HttpStatus.BAD_REQUEST);
    }

    return requiredRoles.some((role) => user.ecosystemOrgRole === role);
    
  }
}