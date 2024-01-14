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
import { AuthGuard } from '@nestjs/passport';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { ResponseMessages } from '@credebl/common/response-messages';
import { AgentService } from './agent-service.service';
import IResponseType, { IResponse } from '@credebl/common/interfaces/response.interface';
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

const seedLength = 32;
@UseFilters(CustomExceptionFilter)
@Controller()
@ApiTags('agents')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
export class AgentController {
  constructor(private readonly agentService: AgentService) { }
  private readonly logger = new Logger();

  /**
   * Get Organization agent health
   * @param orgId 
   * @param reqUser 
   * @param res 
   * @returns Get agent details
   */
  @Get('/orgs/:orgId/agents/health')
  @ApiOperation({
    summary: 'Get the agent health details',
    description: 'Get the agent health details'
  })
  @UseGuards(AuthGuard('jwt'))
  async getAgentHealth(
    @Param('orgId') orgId: string,
    @User() reqUser: user,
    @Res() res: Response
  ): Promise<Response> {

    const agentData = await this.agentService.getAgentHealth(reqUser, orgId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.agent.success.health,
      data: agentData
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }

  /**
   * Spinup the agent by organization
   * @param agentSpinupDto 
   * @param user 
   * @returns Get agent status
   */
  @Post('/orgs/:orgId/agents/spinup')
  @ApiOperation({
    summary: 'Agent spinup',
    description: 'Create a new agent spin up.'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  async agentSpinup(
    @Param('orgId') orgId: string,
    @Body() agentSpinupDto: AgentSpinupDto,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {

    if (seedLength !== agentSpinupDto.seed.length) {
      this.logger.error(`seed must be at most 32 characters.`);
      throw new BadRequestException(
        ResponseMessages.agent.error.seedChar,
        { cause: new Error(), description: ResponseMessages.errorMessages.badRequest }
      );
    }

    const regex = new RegExp('^[a-zA-Z0-9]+$');

    if (!regex.test(agentSpinupDto.walletName)) {
      this.logger.error(`Please enter valid wallet name, It allows only alphanumeric values`);
      throw new BadRequestException(
        ResponseMessages.agent.error.seedChar,
        { cause: new Error(), description: ResponseMessages.errorMessages.badRequest }
      );
    }

    this.logger.log(`**** Spin up the agent...${JSON.stringify(agentSpinupDto)}`);

    agentSpinupDto.orgId = orgId;
    const agentDetails = await this.agentService.agentSpinup(agentSpinupDto, user);


    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.agent.success.create,
      data: agentDetails
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Create wallet for shared agent
   * @param orgId 
   * @param createTenantDto 
   * @param user 
   * @param res 
   * @returns wallet initialization status
   */
  @Post('/orgs/:orgId/agents/wallet')
  @ApiOperation({
    summary: 'Shared Agent',
    description: 'Create a shared agent.'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  async createTenant(
    @Param('orgId') orgId: string,
    @Body() createTenantDto: CreateTenantDto,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {

    createTenantDto.orgId = orgId;

    if (seedLength !== createTenantDto.seed.length) {
      this.logger.error(`seed must be at most 32 characters`);
      throw new BadRequestException(
        ResponseMessages.agent.error.seedCharCount,
        { cause: new Error(), description: ResponseMessages.errorMessages.badRequest }
      );
    }

    const tenantDetails = await this.agentService.createTenant(createTenantDto, user);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.agent.success.create,
      data: tenantDetails
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }
}