import { ApiBearerAuth, ApiForbiddenResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Controller, UseFilters, Put, Param, UseGuards, Query, BadRequestException, Delete } from '@nestjs/common';
import { EcosystemService } from './ecosystem.service';
import { Post, Get } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { Res } from '@nestjs/common';
import { RequestCredDefDto, RequestSchemaDto } from './dtos/request-schema-dto';
import IResponseType from '@credebl/common/interfaces/response.interface';
import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { ResponseMessages } from '@credebl/common/response-messages';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { EditEcosystemDto } from './dtos/edit-ecosystem-dto';
import { AuthGuard } from '@nestjs/passport';
import { GetAllSentEcosystemInvitationsDto } from './dtos/get-all-sent-ecosystemInvitations-dto';
import { User } from '../authz/decorators/user.decorator';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { user } from '@prisma/client';
import { Invitation } from '@credebl/enum/enum';

@UseFilters(CustomExceptionFilter)
@Controller('ecosystem')
@ApiTags('ecosystem')
@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
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
    ): Promise<Response>  {
    
    const ecosystemList = await this.ecosystemService.getEndorsementTranasactions(ecosystemId, orgId, getAllEndorsementsDto);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.fetchEndorsors,
      data: ecosystemList.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('/:orgId')
  @ApiOperation({ summary: 'Get all ecosystem', description: 'Get all existing ecosystem' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiBearerAuth()
  async getEcosystem(
    @Param('orgId') orgId: string,
    @Res() res: Response
    ): Promise<Response>  {
    const ecosystemList = await this.ecosystemService.getAllEcosystem(orgId);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.fetch,
      data: ecosystemList.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('/users/invitations')
  @ApiOperation({ summary: 'Get received ecosystem invitations', description: 'Get received ecosystem invitations' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
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
  async getEcosystemInvitations(@Query() getAllInvitationsDto: GetAllSentEcosystemInvitationsDto, @User() user: user, @Res() res: Response): Promise<Response> {
    if (!Object.values(Invitation).includes(getAllInvitationsDto.status)) {
      throw new BadRequestException(ResponseMessages.ecosystem.error.invalidInvitationStatus);
    }
    const getEcosystemInvitation = await this.ecosystemService.getEcosystemInvitations(getAllInvitationsDto, user.email, getAllInvitationsDto.status);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.getInvitation,
      data: getEcosystemInvitation.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);

  }

  @Get('/:ecosystemId/:orgId/invitations')
  @ApiOperation({ summary: 'Get all sent invitations', description: 'Get all sent invitations' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard, OrgRolesGuard)
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
    @Query() getAllInvitationsDto: GetAllEcosystemInvitationsDto,
    @User() user: user,
    @Res() res: Response): Promise<Response> {

    const getInvitationById = await this.ecosystemService.getInvitationsByEcosystemId(ecosystemId, getAllInvitationsDto, String(user.id));

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.getInvitation,
      data: getInvitationById.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);

  }

  /**
   * 
   * @param createOrgDto 
   * @param res 
   * @returns Ecosystem create response
   */
  @Post('/:orgId')
  @ApiOperation({ summary: 'Create a new ecosystem', description: 'Create an ecosystem' })
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  async createNewEcosystem(
    @Body() createOrgDto: CreateEcosystemDto,
    @Param('orgId') orgId: string,
    @Res() res: Response): Promise<Response> {
    createOrgDto.orgId = orgId;
    await this.ecosystemService.createEcosystem(createOrgDto);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.create
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Post('/:orgId/transaction/schema')
  @ApiOperation({ summary: 'Request new schema', description: 'Request new schema' })
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard, OrgRolesGuard)
  @ApiBearerAuth()
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_OWNER, EcosystemRoles.ECOSYSTEM_LEAD)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  async requestSchemaTransaction(@Body() requestSchemaPayload: RequestSchemaDto, @Param('orgId') orgId: number, @Res() res: Response): Promise<Response> {
    await this.ecosystemService.schemaEndorsementRequest(requestSchemaPayload, orgId);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.schemaRequest
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }


  @Post('/:orgId/transaction/cred-def')
  @ApiOperation({ summary: 'Request new credential-definition', description: 'Request new credential-definition' })
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard, OrgRolesGuard)
  @ApiBearerAuth()
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_OWNER, EcosystemRoles.ECOSYSTEM_LEAD)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  async requestCredDefTransaction(@Body() requestCredDefPayload: RequestCredDefDto, @Param('orgId') orgId: number, @Res() res: Response): Promise<Response> {
    await this.ecosystemService.credDefEndorsementRequest(requestCredDefPayload, orgId);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.schemaRequest
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }
  @Post('transaction/sign/:endorsementId')
  @ApiOperation({ summary: 'Sign transaction', description: 'Sign transaction' })
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard, OrgRolesGuard)
  @ApiBearerAuth()
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_OWNER, EcosystemRoles.ECOSYSTEM_LEAD)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  async SignEndorsementRequests(@Param('endorsementId') endorsementId: string, @Res() res: Response): Promise<Response> {
    await this.ecosystemService.signTransaction(endorsementId);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.sign
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Post('transaction/sumbit/:endorsementId')
  @ApiOperation({ summary: 'Sumbit transaction', description: 'Sumbit transaction' })
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard, OrgRolesGuard)
  @ApiBearerAuth()
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_OWNER, EcosystemRoles.ECOSYSTEM_LEAD)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  async SumbitEndorsementRequests(@Param('endorsementId') endorsementId: string, @Res() res: Response): Promise<Response> {
    await this.ecosystemService.submitTransaction(endorsementId);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.sign
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
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard, OrgRolesGuard)
  @ApiBearerAuth()
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_OWNER, EcosystemRoles.ECOSYSTEM_LEAD)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  async createInvitation(@Body() bulkInvitationDto: BulkEcosystemInvitationDto,
   @Param('ecosystemId') ecosystemId: string,
   @Param('orgId') orgId: string,
   @User() user: user, @Res() res: Response): Promise<Response> {

    bulkInvitationDto.ecosystemId = ecosystemId;
    await this.ecosystemService.createInvitation(bulkInvitationDto, String(user.id));

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.createInvitation
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);

  }

  @Get('/:ecosystemId/invitations')
  @ApiOperation({ summary: 'Get all sent invitations', description: 'Get all sent invitations' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
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
  async getInvitationsByEcosystemId(
    @Param('ecosystemId') ecosystemId: string,
    @Query() getAllInvitationsDto: GetAllEcosystemInvitationsDto,
    @User() user: user,
    @Res() res: Response): Promise<Response> {

    const getInvitationById = await this.ecosystemService.getInvitationsByEcosystemId(ecosystemId, getAllInvitationsDto, String(user.id));

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.getInvitation,
      data: getInvitationById.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);

  }


  /**
   * 
   * @param acceptRejectEcosystemInvitation 
   * @param reqUser 
   * @param res 
   * @returns Ecosystem invitation status
   */
    @Post('/:ecosytemId/:orgId/invitations/:invitationId')
    @ApiOperation({
      summary: 'Accept or reject ecosystem invitation',
      description: 'Accept or Reject ecosystem invitations'
    })
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async acceptRejectEcosystemInvitaion(@Body() acceptRejectEcosystemInvitation: AcceptRejectEcosystemInvitationDto, @Param('ecosystemId') ecosystemId: string, @Param('orgId') orgId: string, @Param('invitationId') invitationId: string, @User() user: user, @Res() res: Response): Promise<object> {
      acceptRejectEcosystemInvitation.ecosystemId = ecosystemId;
      acceptRejectEcosystemInvitation.orgId = orgId;
      acceptRejectEcosystemInvitation.invitationId = invitationId;

      const invitationRes = await this.ecosystemService.acceptRejectEcosystemInvitaion(acceptRejectEcosystemInvitation, user.email); 

      const finalResponse: IResponseType = {
        statusCode: HttpStatus.CREATED,
        message: invitationRes.response
      };
      return res.status(HttpStatus.CREATED).json(finalResponse);
    }

  
  @Put('/:ecosystemId/')
  @ApiOperation({ summary: 'Edit ecosystem', description: 'Edit existing ecosystem' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @EcosystemsRoles(EcosystemRoles.ECOSYSTEM_OWNER, EcosystemRoles.ECOSYSTEM_LEAD)
  @Roles(OrgRoles.OWNER)
  async editEcosystem(
    @Body() editEcosystemDto: EditEcosystemDto,
    @Param('ecosystemId') ecosystemId: string,
    @Param('orgId') orgId: string,
    @Res() res: Response): Promise<Response> {
    await this.ecosystemService.editEcosystem(editEcosystemDto, ecosystemId);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.update
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Delete('/:ecosystemId/:orgId/invitations/:invitationId')
  @ApiOperation({ summary: 'Delete ecosystem pending invitations', description: 'Delete ecosystem pending invitations' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async deleteEcosystemInvitations(
    @Param('ecosystemId') ecosystemId: string, 
    @Param('invitationId') invitationId: string, 
    @Param('orgId') orgId: string, 
    @Res() res: Response): Promise<Response> {
  
    await this.ecosystemService.deleteEcosystemInvitations(invitationId);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.delete
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

}