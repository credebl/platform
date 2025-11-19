/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Controller,
  Logger,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  BadRequestException,
  Body,
  SetMetadata,
  HttpStatus
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { ApiTags, ApiResponse, ApiOperation, ApiQuery, ApiBearerAuth, ApiParam, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WalletDetailsDto } from '../dtos/wallet-details.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { AgentActions } from '../dtos/enums';
import { RolesGuard } from '../authz/roles.guard';
import { CommonConstants } from '@credebl/common/common.constant';
import { booleanStatus, sortValue } from '../enum';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { CommonService } from '@credebl/common';
import { IUserRequestInterface } from '../interfaces/IUserRequestInterface';
import { User } from '../authz/decorators/user.decorator';

@ApiBearerAuth()
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService,
    private readonly commonService: CommonService) { }

  private readonly logger = new Logger();

  /**
   * 
   * @param user 
   * @param _public 
   * @param verkey 
   * @param did 
   * @returns List of all the DID created for the current Cloud Agent.
   */
  @Get('/wallet/did')
  @ApiTags('agent')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('permissions', [CommonConstants.PERMISSION_ORG_MGMT])
  @ApiQuery({ name: '_public', required: false })
  @ApiQuery({ name: 'verkey', required: false })
  @ApiQuery({ name: 'did', required: false })
  @ApiOperation({ summary: 'List of all DID', description: 'List of all the DID created for the current Cloud Agent.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
  getAllDid(
    @User() user: any,
    @Query('_public') _public: boolean,
    @Query('verkey') verkey: string,
    @Query('did') did: string
  ): Promise<object> {
    this.logger.log(`**** Fetch all Did...`);
    return this.agentService.getAllDid(_public, verkey, did, user);
  }

  /**
   * 
   * @param user 
   * @returns Created DID
   */
  @Post('/wallet/did/create')
  @ApiTags('agent')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('permissions', [CommonConstants.PERMISSION_ORG_MGMT])
  @ApiOperation({ summary: 'Create a new DID', description: 'Create a new did for the current Cloud Agent wallet.' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
  createLocalDid(
    @User() user: any
  ): Promise<object> {
    this.logger.log(`**** Create Local Did...`);
    return this.agentService.createLocalDid(user);
  }

  /**
   * 
   * @param walletUserDetails 
   * @param user 
   * @returns 
   */
  @Post('/wallet/provision')
  @ApiTags('agent')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('permissions', [CommonConstants.PERMISSION_USER_MANAGEMENT])
  @ApiOperation({
    summary: 'Create wallet and start ACA-Py',
    description: 'Create a new wallet and spin up your Aries Cloud Agent Python by selecting your desired network.'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
  walletProvision(
    @Body() walletUserDetails: WalletDetailsDto,
    @User() user: object
  ): Promise<object> {
    this.logger.log(`**** Spin up the agent...${JSON.stringify(walletUserDetails)}`);

    const regex = new RegExp('^[a-zA-Z0-9]+$');
    if (!regex.test(walletUserDetails.walletName)) {
      this.logger.error(`Wallet name in wrong format.`);
      throw new BadRequestException(`Please enter valid wallet name, It allows only alphanumeric values`);
    }
    const  decryptedPassword =  this.commonService.decryptPassword(walletUserDetails.walletPassword);
    walletUserDetails.walletPassword = decryptedPassword;
    return this.agentService.walletProvision(walletUserDetails, user);
  }

  /**
   * Description: Route for fetch public DID
   */
  @Get('/wallet/did/public')
  @ApiTags('agent')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('permissions', [CommonConstants.PERMISSION_ORG_MGMT])
  @ApiOperation({ summary: 'Fetch the current public DID', description: 'Fetch the current public DID.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
  getPublicDid(
    @User() user: any
  ): Promise<object> {
    this.logger.log(`**** Fetch public Did...`);
    return this.agentService.getPublicDid(user);
  }

  /**
   * Description: Route for assign public DID
   * @param did 
   */
  @Get('/wallet/did/public/:id')
  @ApiTags('agent')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('permissions', [CommonConstants.PERMISSION_USER_MANAGEMENT])
  @ApiOperation({ summary: 'Assign public DID', description: 'Assign public DID for the current use.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
  assignPublicDid(
    @Param('id') id: number,
    @User() user: any
  ): Promise<object> {
    this.logger.log(`**** Assign public DID...`);
    this.logger.log(`user: ${user.orgId} == id: ${Number(id)}`);

    if (user.orgId === Number(id)) {
      return this.agentService.assignPublicDid(id, user);
    } else {
      this.logger.error(`Cannot make DID public of requested organization.`);
      throw new BadRequestException(`Cannot make DID public requested organization.`);
    }
  }


  /**
   * Description: Route for onboarding register role on ledger
   * @param role 
   * @param alias 
   * @param verkey 
   * @param did 
   */
  @Get('/ledger/register-nym/:id')
  @ApiTags('agent')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('permissions', [CommonConstants.PERMISSION_ORG_MGMT])
  @ApiOperation({ summary: 'Send a NYM registration to the ledger', description: 'Write the DID to the ledger to make that DID public.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
  registerNym(
    @Param('id') id: string,
    @User() user: IUserRequestInterface
  ): Promise<object> {
    this.logger.log(`user: ${typeof user.orgId} == id: ${typeof Number(id)}`);

    if (user.orgId !== id) {
      return this.agentService.registerNym(id, user);
    } else {
      this.logger.error(`Cannot register nym of requested organization.`);
      throw new BadRequestException(`Cannot register nym of requested organization`);
    }
  }

  @Get('/agents/:orgId/service/:action')
  @ApiTags('platform-admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('permissions', [CommonConstants.PERMISSION_PLATFORM_MANAGEMENT])
  @ApiOperation({
    summary: 'Restart/Stop an running Aries Agent. (Platform Admin)',
    description: 'Platform Admin can restart or stop the running Aries Agent. (Platform Admin)'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
  @ApiParam({ name: 'action', enum: AgentActions })
  restartStopAgent(@Param('orgId') orgId: string, @Param('action') action: string): Promise<object> {
    return this.agentService.restartStopAgent(action, orgId);
  }

  @Get('/server/status')
  @ApiTags('platform-admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('permissions', [CommonConstants.PERMISSION_CONNECTIONS])
  @ApiOperation({
    summary: 'Fetch Aries Cloud Agent status',
    description: 'Fetch the status of the Aries Cloud Agent.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
  getAgentServerStatus(@User() user: any): Promise<object> {
    this.logger.log(`**** getPlatformConfig called...`);
    return this.agentService.getAgentServerStatus(user);
  }

  @Get('/ping-agent')
  @UseGuards(AuthGuard('jwt'))
  @ApiTags('service-status')
  @ApiExcludeEndpoint()
  @ApiResponse({
    status: 200,
    description: 'The agent service status'
  })
  pingServiceAgent(): Promise<object> {
    this.logger.log(`**** pingServiceAgent called`);
    return this.agentService.pingServiceAgent();
  }

  @Get('/spinup-status')
  @ApiTags('platform-admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('permissions', [CommonConstants.PERMISSION_ORG_MGMT])
  @ApiOperation({
    summary: 'List all Aries Cloud Agent status',
    description: 'List of all created Aries Cloud Agent status.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
  @ApiQuery({ name: 'items_per_page', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'search_text', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'sortValue', enum: sortValue, required: false })
  @ApiQuery({ name: 'status', enum: booleanStatus, required: false })
  agentSpinupStatus(
    @Query('items_per_page') items_per_page: number,
    @Query('page') page: number,
    @Query('search_text') search_text: string,
    @Query('sortValue') sortValue: any,
    @Query('status') status: any,
    @User() user: any
  ): Promise<object> {

    this.logger.log(`status: ${typeof status} ${status}`);

    items_per_page = items_per_page || 10;
    page = page || 1;
    search_text = search_text || '';
    sortValue = sortValue ? sortValue : 'DESC';
    status = status ? status : 'all';

    let agentsStatus: any;
    if ('all' === status) {
      agentsStatus = 3;
    } else if ('true' === status) {
      agentsStatus = 2;
    } else if ('false' === status) {
      agentsStatus = 1;
    } else {
      throw new BadRequestException('Invalid status received');
    }

    this.logger.log(`**** agentSpinupStatus called`);
    return this.agentService.agentSpinupStatus(items_per_page, page, search_text, agentsStatus, sortValue, user);
  }
}
