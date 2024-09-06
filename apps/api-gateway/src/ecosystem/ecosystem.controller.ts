import { ApiBearerAuth, ApiExcludeEndpoint, ApiExtraModels, ApiForbiddenResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { EcosystemService } from './ecosystem.service';
import { Controller, UseFilters, Put, Post, Get, Body, Param, UseGuards, Query, BadRequestException, Delete, HttpStatus, Res, ParseUUIDPipe } from '@nestjs/common';
import { RequestCredDefDto, RequestSchemaDto, RequestW3CSchemaDto } from './dtos/request-schema.dto';
import IResponse from '@credebl/common/interfaces/response.interface';
import { Response } from 'express';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { ResponseMessages } from '@credebl/common/response-messages';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { EditEcosystemDto } from './dtos/edit-ecosystem-dto';
import { AuthGuard } from '@nestjs/passport';
import { GetAllSentEcosystemInvitationsDto } from './dtos/get-all-received-invitations.dto';
import { EcosystemRoles, Invitation } from '@credebl/enum/enum';
import { User } from '../authz/decorators/user.decorator';
import { BulkEcosystemInvitationDto } from './dtos/send-invitation.dto';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { user } from '@prisma/client';
import { AcceptRejectEcosystemInvitationDto } from './dtos/accept-reject-invitations.dto';
import { EcosystemRolesGuard } from '../authz/guards/ecosystem-roles.guard';
import { EcosystemsRoles, Roles } from '../authz/decorators/roles.decorator';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { OrgRoles } from 'libs/org-roles/enums';
import { GetAllEcosystemMembersDto } from './dtos/get-members.dto';
import { GetAllEndorsementsDto } from './dtos/get-all-endorsements.dto';
import { CreateEcosystemDto } from './dtos/create-ecosystem-dto';
import { PaginationDto } from '@credebl/common/dtos/pagination.dto';
import { IEcosystemInvitations, IEditEcosystem, IEndorsementTransaction } from 'apps/ecosystem/interfaces/ecosystem.interfaces';
import { AddOrganizationsDto } from './dtos/add-organizations.dto';
import { TrimStringParamPipe } from '@credebl/common/cast.helper';


@UseFilters(CustomExceptionFilter)
@Controller('ecosystem')
@ApiTags('ecosystem')
@ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
export class EcosystemController {
  constructor(
    private readonly ecosystemService: EcosystemService
  ) { }

  @Get('/:ecosystemId/:orgId/endorsement-transactions')
  @ApiOperation({ summary: 'Get all endorsement transactions', description: 'Get all endorsement transactions' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard, OrgRolesGuard)
  @ApiBearerAuth()
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_OWNER, EcosystemRoles.ECOSYSTEM_LEAD, EcosystemRoles.ECOSYSTEM_MEMBER)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER)
  @ApiQuery({
    name: 'pageNumber',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false
  })
  async getEndorsementTranasactions(
    @Param('ecosystemId') ecosystemId: string,
    @Param('orgId') orgId: string,
    @Query() getAllEndorsementsDto: GetAllEndorsementsDto,
    @Res() res: Response
  ): Promise<Response> {

    const ecosystemList = await this.ecosystemService.getEndorsementTranasactions(ecosystemId, orgId, getAllEndorsementsDto);
    const finalResponse: IResponse = {
      statusCode: 200,
      message: ResponseMessages.ecosystem.success.fetchEndorsors,
      data: ecosystemList.response
    };
    return res.status(200).json(finalResponse);
  }

  @Get('/:ecosystemId/:orgId/schemas')
  @ApiOperation({ summary: 'Get all ecosystem schemas', description: 'Get all ecosystem schemas' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard, OrgRolesGuard)
  @ApiBearerAuth()
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_OWNER, EcosystemRoles.ECOSYSTEM_LEAD, EcosystemRoles.ECOSYSTEM_MEMBER)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER)
  @ApiQuery({
    name: 'pageNumber',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: false
  })
  async getAllEcosystemSchemas(
    @Param('ecosystemId') ecosystemId: string,
    @Param('orgId') orgId: string,
    @Query() paginationDto: PaginationDto,
    @Res() res: Response
  ): Promise<Response> {

    const schemaList = await this.ecosystemService.getAllEcosystemSchemas(ecosystemId, orgId, paginationDto);
    const finalResponse: IResponse = {
      statusCode: 200,
      message: ResponseMessages.ecosystem.success.allschema,
      data: schemaList
    };
    return res.status(200).json(finalResponse);
  }

  /**
   * @returns Ecosystem details 
   */
  @Get('/:orgId')
  @ApiOperation({ summary: 'Get all organization ecosystems', description: 'Get all existing ecosystems of an specific organization' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER)
  @ApiBearerAuth()
  @ApiQuery({
    name: 'pageNumber',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false
  })
  async getEcosystem(
    @Query() paginationDto: PaginationDto,
    @Param('orgId', new ParseUUIDPipe({exceptionFactory: (): Error => { throw new BadRequestException(`Invalid format for orgId`); }})) orgId: string,
    @Res() res: Response
  ): Promise<Response> {
    const ecosystemList = await this.ecosystemService.getAllEcosystem(orgId, paginationDto);
    const finalResponse: IResponse = {
      statusCode: 200,
      message: ResponseMessages.ecosystem.success.fetch,
      data: ecosystemList
    };
    return res.status(200).json(finalResponse);
  }

 /**
  * @param ecosystemId 
  * @param orgId 
  * @returns Ecosystem dashboard details
  */ 

  @Get('/:ecosystemId/:orgId/dashboard')
  @ApiOperation({ summary: 'Get ecosystem dashboard details', description: 'Get ecosystem dashboard details' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard, EcosystemRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER)
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_OWNER, EcosystemRoles.ECOSYSTEM_LEAD, EcosystemRoles.ECOSYSTEM_MEMBER)
  @ApiBearerAuth()
  async getEcosystemDashboardDetails(@Param('ecosystemId') ecosystemId: string, @Param('orgId') orgId: string, @Res() res: Response): Promise<Response> {

    const getEcosystemDetails = await this.ecosystemService.getEcosystemDashboardDetails(ecosystemId, orgId);
    const finalResponse: IResponse = {
      statusCode: 200,
      message: ResponseMessages.ecosystem.success.getEcosystemDashboard,
      data: getEcosystemDetails
    };
    return res.status(200).json(finalResponse);

  }

  @Get('/:orgId/users/invitations')
  @ApiOperation({ summary: 'Get received ecosystem invitations', description: 'Get received ecosystem invitations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiBearerAuth()
  @ApiQuery({
    name: 'pageNumber',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false
  })
  @ApiQuery({
    name: 'status',
    type: String,
    required: false
  })
  async getEcosystemInvitations(
    @Query() getAllInvitationsDto: GetAllSentEcosystemInvitationsDto,
    @Param('orgId') orgId: string,
    @User() user: user, @Res() res: Response): Promise<Response> {

    if (!Object.values(Invitation).includes(getAllInvitationsDto.status)) {
      throw new BadRequestException(ResponseMessages.ecosystem.error.invalidInvitationStatus);
    }
    const getEcosystemInvitation = await this.ecosystemService.getEcosystemInvitations(getAllInvitationsDto, user.email, getAllInvitationsDto.status);
    const finalResponse: IResponse = {
      statusCode: 200,
      message: ResponseMessages.ecosystem.success.getInvitation,
      data: getEcosystemInvitation
    };
    return res.status(200).json(finalResponse);

  }

  @Get('/:ecosystemId/:orgId/invitations')
  @ApiOperation({ summary: 'Get all sent invitations', description: 'Get all sent invitations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard, EcosystemRolesGuard)
  @ApiBearerAuth()
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_OWNER, EcosystemRoles.ECOSYSTEM_LEAD)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiQuery({
    name: 'pageNumber',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false
  })
  async getInvitationsByEcosystemId(
    @Param('ecosystemId') ecosystemId: string,
    @Param('orgId') orgId: string,
    @Query() paginationDto: PaginationDto,
    @User() user: user,
    @Res() res: Response): Promise<Response> {

    const getInvitationById = await this.ecosystemService.getInvitationsByEcosystemId(ecosystemId, paginationDto, String(user.id));

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.getInvitation,
      data: getInvitationById
    };
    return res.status(200).json(finalResponse);

  }

  /**
    * 
    * @param res 
    * @returns Ecosystem members list
    */
  @Get('/:ecosystemId/:orgId/members')
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER)
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_OWNER, EcosystemRoles.ECOSYSTEM_LEAD, EcosystemRoles.ECOSYSTEM_MEMBER)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard, OrgRolesGuard)
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiOperation({ summary: 'Get ecosystem members list', description: 'Get ecosystem members list.' })
  @ApiQuery({
    name: 'pageNumber',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false
  })
  async getEcosystemMembers(
    @Param('ecosystemId', new ParseUUIDPipe({exceptionFactory: (): Error => { throw new BadRequestException(`Invalid format for ecosystemId`); }})) ecosystemId: string,
    @Param('orgId') orgId: string,
    @Query() getEcosystemMembers: GetAllEcosystemMembersDto,
    @Res() res: Response): Promise<Response> {

    const members = await this.ecosystemService.getEcosystemMembers(ecosystemId, getEcosystemMembers);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.fetchMembers,
      data: members
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  
  @Post('/:ecosystemId/:orgId/transaction/schema')
  @ApiExtraModels(RequestSchemaDto, RequestW3CSchemaDto)
  @ApiOperation({ summary: 'Request new schema', description: 'Create request for new schema' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard, OrgRolesGuard)
  @ApiBearerAuth()
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_MEMBER, EcosystemRoles.ECOSYSTEM_LEAD, EcosystemRoles.ECOSYSTEM_OWNER)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER)
  async requestSchemaTransaction(
    @Body() requestSchemaPayload: RequestSchemaDto,
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    ) orgId: string,   
    @Param('ecosystemId', TrimStringParamPipe) ecosystemId: string,
    @Res() res: Response,
    @User() user: user
  ): Promise<Response> {

    const createSchemaRequest = await this.ecosystemService.schemaEndorsementRequest(
      requestSchemaPayload,
      user,
      orgId,
      ecosystemId
    );

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.schemaRequest,
      data: createSchemaRequest
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }


  /**
   * @param createOrgDto 
   * @param res 
   * @returns Created Ecosystem details
   */
  @Post('/:orgId')
  @ApiOperation({ summary: 'Create a new ecosystem', description: 'Create a new ecosystem' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  async createNewEcosystem(
    @Body() createOrgDto: CreateEcosystemDto,
    @Param('orgId') orgId: string,
    @User() user: user,
    @Res() res: Response): Promise<Response> {
    createOrgDto.orgId = orgId;
    createOrgDto.userId = user.id;
    const createEcosystemResponse = await this.ecosystemService.createEcosystem(createOrgDto);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.create,
      data: createEcosystemResponse
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }


  @Post('/:ecosystemId/:orgId/transaction/cred-def')
  @ApiOperation({ summary: 'Request new credential-definition', description: 'Request new credential-definition' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard, OrgRolesGuard)
  @ApiBearerAuth()
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_MEMBER)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER)
  async requestCredDefTransaction(@Body() requestCredDefPayload: RequestCredDefDto, @Param('ecosystemId', TrimStringParamPipe) ecosystemId: string, @Param('orgId', new ParseUUIDPipe({exceptionFactory: (): Error => { throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId); }})) orgId: string, @Res() res: Response, @User() user: user): Promise<Response> {
    requestCredDefPayload.userId = user.id;
    const createCredDefRequest: IEndorsementTransaction = await this.ecosystemService.credDefEndorsementRequest(requestCredDefPayload, orgId, ecosystemId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.credDefRequest,
      data: createCredDefRequest
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Post('/:ecosystemId/:orgId/transaction/sign/:endorsementId')
  @ApiOperation({ summary: 'Sign transaction', description: 'Sign transaction' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard, OrgRolesGuard)
  @ApiBearerAuth()
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_LEAD)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  async SignEndorsementRequests(
    @Param('endorsementId', TrimStringParamPipe) endorsementId: string,
    @Param('ecosystemId', TrimStringParamPipe) ecosystemId: string,
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    ) orgId: string,   
    @Res() res: Response
  ): Promise<Response> {
    
    const transactionResponse = await this.ecosystemService.signTransaction(endorsementId, ecosystemId);

    const responseMessage =
      true === transactionResponse['autoEndorsement']
        ? ResponseMessages.ecosystem.success.AutoSignAndSubmit
        : ResponseMessages.ecosystem.success.sign;

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: responseMessage,
      data: transactionResponse
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Post('/:ecosystemId/:orgId/transaction/submit/:endorsementId')
  @ApiOperation({ summary: 'Submit transaction', description: 'Submit transaction' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard, OrgRolesGuard)
  @ApiBearerAuth()
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_MEMBER, EcosystemRoles.ECOSYSTEM_LEAD)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER)
  async SubmitEndorsementRequests(
    @Param('endorsementId', TrimStringParamPipe) endorsementId: string,
    @Param('ecosystemId', TrimStringParamPipe) ecosystemId: string,
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    const transactionResponse = await this.ecosystemService.submitTransaction(endorsementId, ecosystemId, orgId, user);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.submit,
      data: transactionResponse
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }


  /**
   * 
   * @param bulkInvitationDto 
   * @param ecosystemId 
   * @param user 
   * @param res 
   * @returns Ecosystem invitation send details
   */
  @Post('/:ecosystemId/:orgId/invitations')
  @ApiOperation({
    summary: 'Send ecosystem invitation',
    description: 'Send ecosystem invitation'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard, EcosystemRolesGuard)
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_OWNER, EcosystemRoles.ECOSYSTEM_LEAD)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  async createInvitation(@Body() bulkInvitationDto: BulkEcosystemInvitationDto,
    @Param('ecosystemId') ecosystemId: string,
    @Param('orgId') orgId: string,
    @User() user: user, @Res() res: Response): Promise<Response> {

    bulkInvitationDto.ecosystemId = ecosystemId;

    const ecosystemInvitationResponse: IEcosystemInvitations[] = await this.ecosystemService.createInvitation(bulkInvitationDto, user.id, user.email, orgId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.createInvitation,
      data: ecosystemInvitationResponse
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);

  }

  /**
   *
   * @param orgId
   * @param ecosystemId
   */
    @Post('/:ecosystemId/:orgId/orgs')
    @ApiOperation({
      summary: 'Add multiple organizations of ecosystem owner in ecosystem',
      description: 'Add multiple organizations of ecosystem owner under the same ecosystem'
    })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard, EcosystemRolesGuard)
    @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_OWNER, EcosystemRoles.ECOSYSTEM_LEAD)
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
    async addOrganizationsInEcosystem(
      @Body() addOrganizationsDto: AddOrganizationsDto,
      @Param('ecosystemId', new ParseUUIDPipe({exceptionFactory: (): Error => { throw new BadRequestException(ResponseMessages.ecosystem.error.invalidEcosystemId); }}), TrimStringParamPipe) ecosystemId: string,
      @Param('orgId', new ParseUUIDPipe({exceptionFactory: (): Error => { throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId); }})) orgId: string,
      @User() user: user,
      @Res() res: Response
    ): Promise<Response> {  
  
      addOrganizationsDto.ecosystemId = ecosystemId;
      addOrganizationsDto.orgId = orgId;

      const addOrganizations = await this.ecosystemService.addOrganizationsInEcosystem(addOrganizationsDto, user.id);
      const { results, statusCode, message } = addOrganizations;

      const finalResponse: IResponse = {
        statusCode,
        message,
        data: results
      };
  
      return res.status(statusCode).json(finalResponse);
    }

    
  /**
   * 
   * @param res 
   * @returns 
   */
  @Put('transaction/endorsement/auto')
  // Not required anywhere
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Auto sign and submit transactions',
    description: 'Auto sign and submit transactions'
  })
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard, OrgRolesGuard)
  @ApiBearerAuth()
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_LEAD)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  async autoSignAndSubmitTransaction(
    @Res() res: Response
  ): Promise<object> {
    await this.ecosystemService.autoSignAndSubmitTransaction();
    const finalResponse: IResponse = {
      statusCode: 200,
      message: ResponseMessages.ecosystem.success.AutoEndorsementTransaction
    };
    return res.status(200).json(finalResponse);
  }

  /**
 * 
 * @param acceptRejectEcosystemInvitation 
 * @param reqUser 
 * @param res 
 * @returns Ecosystem invitation status
 */
  @Put('/:orgId/invitations/:invitationId')
  @ApiOperation({
    summary: 'Accept or reject ecosystem invitation',
    description: 'Accept or Reject ecosystem invitations'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  async acceptRejectEcosystemInvitaion(@Body() acceptRejectEcosystemInvitation: AcceptRejectEcosystemInvitationDto, @Param('orgId') orgId: string, @Param('invitationId') invitationId: string, @User() user: user, @Res() res: Response): Promise<object> {
    acceptRejectEcosystemInvitation.orgId = orgId;
    acceptRejectEcosystemInvitation.invitationId = invitationId;
    acceptRejectEcosystemInvitation.userId = user.id;
    const invitationRes = await this.ecosystemService.acceptRejectEcosystemInvitaion(acceptRejectEcosystemInvitation, user.email);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: invitationRes.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * 
   * @param editEcosystemDto 
   * @param ecosystemId 
   * @param orgId
   * @returns Response with edited details of ecosystem
   */


  @Put('/:ecosystemId/:orgId')
  @ApiOperation({ summary: 'Edit ecosystem', description: 'Edit ecosystem' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard, EcosystemRolesGuard)
  @ApiBearerAuth()
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_OWNER, EcosystemRoles.ECOSYSTEM_LEAD)
  @Roles(OrgRoles.OWNER)
  async editEcosystem(
    @Body() editEcosystemDto: EditEcosystemDto,
    @Param('ecosystemId') ecosystemId: string,
    @Param('orgId') orgId: string,
    @User() user: user,
    @Res() res: Response): Promise<Response> {
    editEcosystemDto.userId = user.id;
    const editEcosystemResponse: IEditEcosystem = await this.ecosystemService.editEcosystem(editEcosystemDto, ecosystemId);
    const finalResponse: IResponse = {
      statusCode: 200,
      message: ResponseMessages.ecosystem.success.update,
      data: editEcosystemResponse
    };
    return res.status(200).json(finalResponse);
  }


  /**
  *
  * @param declineEndorsementTransactionRequest
  *
  * @param res
  * @returns  endorsement transaction status
  */
  @Put('/:ecosystemId/:orgId/transactions/:endorsementId')
  @ApiOperation({
    summary: 'Decline Endorsement Request By Lead',
    description: 'Decline Endorsement Request By Lead'
  })
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard, OrgRolesGuard)
  @ApiBearerAuth()
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_LEAD)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  async declineEndorsementRequestByLead(
    @Param('ecosystemId') ecosystemId: string,
    @Param('endorsementId') endorsementId: string,
    @Param('orgId') orgId: string,
    @Res() res: Response
  ): Promise<object> {
    const response = await this.ecosystemService.declineEndorsementRequestByLead(ecosystemId, endorsementId, orgId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.DeclineEndorsementTransaction,
      data: response
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Delete('/:orgId/member-org')
  @ApiOperation({ summary: 'Delete organization from ecosystem as a ecosystem member', description: 'Delete organization from ecosystem as a ecosystem meber' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER)
  @ApiBearerAuth()
  async deleteOrgFromEcosystem(
    @Param('orgId', new ParseUUIDPipe({exceptionFactory: (): Error => { throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId); }})) orgId: string,
    @Res() res: Response,
    @User() user: user
  ): Promise<Response> {

    await this.ecosystemService.deleteOrgFromEcosystem(orgId, user);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.deleteEcosystemMember
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }


  @Delete('/:ecosystemId/:orgId/invitations/:invitationId')
  @ApiOperation({ summary: 'Delete ecosystem pending invitations', description: 'Delete ecosystem pending invitations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard, OrgRolesGuard)
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_OWNER, EcosystemRoles.ECOSYSTEM_LEAD)
  @Roles(OrgRoles.OWNER)
  @ApiBearerAuth()
  async deleteEcosystemInvitations(
    @Param('ecosystemId') ecosystemId: string,
    @Param('invitationId') invitationId: string,
    @Param('orgId') orgId: string,
    @Res() res: Response): Promise<Response> {

   const deletedEcosystemInvitationResponse = await this.ecosystemService.deleteEcosystemInvitations(invitationId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.delete,
      data:deletedEcosystemInvitationResponse
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }


}