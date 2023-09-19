/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Controller,
  Logger,
  Post,
  UseGuards,
  BadRequestException,
  Body,
  HttpStatus,
  Res,
  Get,
  UseFilters,
  Param
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GetUser } from '../authz/decorators/get-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { ResponseMessages } from '@credebl/common/response-messages';
import { AgentService } from './agent-service.service';
import IResponseType from '@credebl/common/interfaces/response.interface';
import { AgentSpinupDto } from './dto/agent-service.dto';
import { Response } from 'express';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { user } from '@prisma/client';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { User } from '../authz/decorators/user.decorator';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRoles } from 'libs/org-roles/enums';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';

@UseFilters(CustomExceptionFilter)
@Controller()
@ApiTags('agents')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
export class AgentController {
  constructor(private readonly agentService: AgentService) { }

  private readonly logger = new Logger();

  @Get('/orgs/:orgId/agents/health')
  @ApiOperation({
    summary: 'Get the agent health details',
    description: 'Get the agent health details'
  })
  @UseGuards(AuthGuard('jwt'))
  async getAgentHealth(@User() reqUser: user, @Param('orgId') orgId: number, @Res() res: Response): Promise<object> {
    const agentData = await this.agentService.getAgentHealth(reqUser, orgId);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.agent.success.health,
      data: agentData.response
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }

  /**
   * 
   * @param agentSpinupDto 
   * @param user 
   * @returns 
   */
  @Post('/orgs/:orgId/agents/spinup')
  @ApiOperation({
    summary: 'Agent spinup',
    description: 'Create a new agent spin up.'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  async agentSpinup(
    @Body() agentSpinupDto: AgentSpinupDto,
    @Param('orgId') orgId: number,
    @GetUser() user: user,
    @Res() res: Response
  ): Promise<Response<object, Record<string, object>>> {

    const seedLength = 32;
    if (seedLength !== agentSpinupDto.seed.length) {
      throw new BadRequestException(`seed must be at most 32 characters.`);
    }

    const regex = new RegExp('^[a-zA-Z0-9]+$');

    if (!regex.test(agentSpinupDto.walletName)) {
      this.logger.error(`Wallet name in wrong format.`);
      throw new BadRequestException(`Please enter valid wallet name, It allows only alphanumeric values`);
    }
    this.logger.log(`**** Spin up the agent...${JSON.stringify(agentSpinupDto)}`);

    agentSpinupDto.orgId = orgId;
    const agentDetails = await this.agentService.agentSpinup(agentSpinupDto, user);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.agent.success.create,
      data: agentDetails.response
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Post('/orgs/:orgId/agents/wallet')
  @ApiOperation({
    summary: 'Shared Agent',
    description: 'Create a shared agent.'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  async createTenant(
    @Param('orgId') orgId: number,
    @Body() createTenantDto: CreateTenantDto,
    @GetUser() user: user,
    @Res() res: Response
  ): Promise<object> {

    createTenantDto.orgId = orgId;

    const seedLength = 32;
    if (seedLength !== createTenantDto.seed.length) {
      throw new BadRequestException(`seed must be at most 32 characters.`);
    }

    const tenantDetails = await this.agentService.createTenant(createTenantDto, user);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.agent.success.create,
      data: tenantDetails.response
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }
}