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
  Res
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
@Controller('agent-service')
@ApiTags('agents')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
export class AgentController {
  constructor(private readonly agentService: AgentService) { }

  private readonly logger = new Logger();

  /**
   * 
   * @param agentSpinupDto 
   * @param user 
   * @returns 
   */
  @Post('/spinup')
  @ApiOperation({
    summary: 'Agent spinup',
    description: 'Create a new agent spin up.'
  })
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  async agentSpinup(
    @Body() agentSpinupDto: AgentSpinupDto,
    @GetUser() user: user,
    @Res() res: Response
  ): Promise<Response<object, Record<string, object>>> {

    const regex = new RegExp('^[a-zA-Z0-9]+$');
    if (!regex.test(agentSpinupDto.walletName)) {
      this.logger.error(`Wallet name in wrong format.`);
      throw new BadRequestException(`Please enter valid wallet name, It allows only alphanumeric values`);
    }
    this.logger.log(`**** Spin up the agent...${JSON.stringify(agentSpinupDto)}`);
    const agentDetails = await this.agentService.agentSpinup(agentSpinupDto, user);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.agent.success.create,
      data: agentDetails.response
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Post('/tenant')
  @ApiOperation({
    summary: 'Shared Agent',
    description: 'Create a shared agent.'
  })
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  async createTenant(
    @Body() createTenantDto: CreateTenantDto,
    @GetUser() user: user,
    @Res() res: Response
  ): Promise<object> {
    const tenantDetails = await this.agentService.createTenant(createTenantDto, user);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.agent.success.create,
      data: tenantDetails.response
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

}
