import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Res,
  UseFilters,
  UseGuards
} from '@nestjs/common';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CustomExceptionFilter } from '@credebl/common/exception-handler';
import { EcosystemService } from './ecosystem.service';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { IResponse } from '@credebl/common/interfaces/response.interface';
import { OrgRoles } from 'libs/org-roles/enums';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Roles } from '../authz/decorators/roles.decorator';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { InviteMemberToEcosystemDto, UpdateEcosystemInvitationDto } from './dtos/send-ecosystem-invitation';
import { EcosystemRolesGuard } from '../authz/guards/ecosystem-roles.guard';
import { user } from '@prisma/client';
import { User } from '../authz/decorators/user.decorator';
import { CreateEcosystemDto } from 'apps/ecosystem/dtos/create-ecosystem-dto';
import { DeleteEcosystemOrgDto } from './dtos/delete-ecosystem-users';
import { GetEcosystemInvitationsQueryDto, UpdateEcosystemOrgStatusDto } from './dtos/ecosystem';
import { IIntentTemplateList } from '@credebl/common/interfaces/intents-template.interface';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { CreateIntentDto } from 'apps/ecosystem/dtos/create-intent.dto';
import { UpdateIntentDto } from 'apps/ecosystem/dtos/update-intent.dto';
import { GetAllIntentTemplatesResponseDto } from '../utilities/dtos/get-all-intent-templates-response.dto';
import { GetAllIntentTemplatesDto } from '../utilities/dtos/get-all-intent-templates.dto';
import { GetIntentTemplateByIntentAndOrgDto } from '../utilities/dtos/get-intent-template-by-intent-and-org.dto';
import { CreateIntentTemplateDto, UpdateIntentTemplateDto } from '../utilities/dtos/intent-template.dto';
import { EcosystemFeatureGuard } from '../authz/guards/ecosystem-feature-guard';
import { EcosystemOrgStatus, Invitation, InvitationViewRole } from '@credebl/enum/enum';
import { PaginationDto } from '@credebl/common/dtos/pagination.dto';

@UseFilters(CustomExceptionFilter)
@Controller('ecosystem')
@ApiTags('ecosystem')
@UseGuards(EcosystemFeatureGuard)
@ApiUnauthorizedResponse({
  description: 'Unauthorized',
  type: UnauthorizedErrorDto
})
@ApiForbiddenResponse({
  description: 'Forbidden',
  type: ForbiddenErrorDto
})
export class EcosystemController {
  constructor(private readonly ecosystemService: EcosystemService) {}

  @Post('/invite-member')
  @ApiOperation({
    summary: 'Invite member to ecosystem',
    description: 'Send invitation for users to join the ecosystem'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invitation sent successfully for member invitation'
  })
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiBearerAuth()
  async inviteMemberToEcosystem(
    @Body() inviteMemberToEcosystem: InviteMemberToEcosystemDto,
    @User() reqUser: user,
    @Res() res: Response
  ): Promise<Response> {
    if (!reqUser.id) {
      throw new Error('Missing request user id');
    }
    try {
      await this.ecosystemService.inviteMemberToEcosystem(
        inviteMemberToEcosystem.orgId,
        reqUser.id,
        inviteMemberToEcosystem.ecosystemId
      );

      const finalResponse: IResponse = {
        statusCode: HttpStatus.CREATED,
        message: ResponseMessages.ecosystem.success.memberInviteSucess
      };
      return res.status(HttpStatus.CREATED).json(finalResponse);
    } catch (error) {
      if (error instanceof ConflictException || HttpStatus.CONFLICT === error.statusCode) {
        return res.status(HttpStatus.CONFLICT).json({
          status: HttpStatus.CONFLICT,
          message: error.message
        });
      }

      const finalResponse: IResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: ResponseMessages.errorMessages.serverError
      };

      return res.status(HttpStatus.OK).json(finalResponse);
    }
  }

  @Post('/update-invitation-status')
  @ApiOperation({
    summary: 'Update status for Invitation (org owner)',
    description: 'Update status for Invitation (org owner)'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status updated successfully'
  })
  @ApiQuery({
    name: 'status',
    enum: Invitation
  })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async updateEcosystemInvitationStatus(
    @Body() updateInvitation: UpdateEcosystemInvitationDto,
    @User() reqUser: user,
    @Res() res: Response,
    @Query('status', new ParseEnumPipe(Invitation)) status: Invitation
  ): Promise<Response> {
    if (!reqUser.id) {
      throw new BadRequestException('Missing request user id');
    }
    const result = await this.ecosystemService.updateEcosystemInvitationStatus(
      status,
      reqUser.id,
      updateInvitation.ecosystemId,
      updateInvitation.orgId
    );

    if (result) {
      const finalResponse: IResponse = {
        statusCode: HttpStatus.OK,
        message: `${ResponseMessages.ecosystem.success.updateInvitation} as ${status}`
      };
      return res.status(HttpStatus.CREATED).json(finalResponse);
    }
    const finalResponse: IResponse = {
      statusCode: HttpStatus.BAD_REQUEST,
      message: ResponseMessages.ecosystem.error.failInvitationUpdate
    };

    return res.status(HttpStatus.BAD_REQUEST).json(finalResponse);
  }

  /**
   * Create new ecosystem
   * @param createEcosystemDto
   * @param orgId The ID of the organization
   * @returns Created ecosystem details
   */
  @Post('/:orgId/create')
  @ApiOperation({
    summary: 'Create a new ecosystem',
    description: 'Create a new ecosystem'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Created',
    type: ApiResponseDto
  })
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  async createNewEcosystem(
    @Body() createEcosystemDto: CreateEcosystemDto,
    @Param('orgId') orgId: string,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    createEcosystemDto.orgId = orgId;
    createEcosystemDto.userId = user?.id;

    const ecosystem = await this.ecosystemService.createEcosystem(createEcosystemDto);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.create,
      data: ecosystem
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }
  /**
   * Get all ecosystems (platform admin)
   * @returns All ecosystems from platform
   */
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiBearerAuth()
  @Get('/all-ecosystem')
  @ApiOperation({
    summary: 'Get ecosystems',
    description: 'Fetch ecosystems for Platform Admin or Ecosystem Lead'
  })
  @Roles(OrgRoles.PLATFORM_ADMIN, OrgRoles.ECOSYSTEM_LEAD)
  async getEcosystems(
    @User() reqUser: user,
    @Res() res: Response,
    @Query() paginationDto: PaginationDto
  ): Promise<Response> {
    const ecosystems = await this.ecosystemService.getEcosystems(reqUser.id, paginationDto);

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.fetchAllEcosystems,
      data: ecosystems
    });
  }

  /**
   * Get specific ecosystem dashboard details
   * @param createEcosystemInvitationDto The details of the invitation
   * @param ecosystemId the ecosystem
   * @param orgId ID of the organization
   * @returns Details of specific ecosystem
   */
  @Get('/:ecosystemId/:orgId/dashboard')
  @ApiOperation({
    summary: 'Get ecosystem dashboard details (platform admin and organization owner)',
    description: 'Fetch ecosystem dashboard data for a specific organization'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ecosystem dashboard data fetched successfully'
  })
  @Roles(OrgRoles.PLATFORM_ADMIN, OrgRoles.OWNER, OrgRoles.ADMIN)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiBearerAuth()
  async getEcosystemDashboard(
    @Param('ecosystemId') ecosystemId: string,
    @Param('orgId') orgId: string,
    @Res() res: Response
  ): Promise<Response> {
    const dashboardData = await this.ecosystemService.getEcosystemDashboard(ecosystemId, orgId);

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.fetch,
      data: dashboardData
    });
  }

  @Delete('/delete-ecosystem-users')
  @ApiOperation({
    summary: 'Delete ecosystem users',
    description: 'Delete ecosystem users'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deleted ecosystem users successfully'
  })
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiBearerAuth()
  async deleteEcosystemUsers(@Body() deleteUser: DeleteEcosystemOrgDto, @Res() res: Response): Promise<Response> {
    const result = await this.ecosystemService.deleteEcosystemOrgs(deleteUser.ecosystemId, deleteUser.orgIds);
    if (0 < result.count) {
      const finalResponse: IResponse = {
        statusCode: HttpStatus.OK,
        message: `${result.count} ${ResponseMessages.ecosystem.success.deletionSuccessfull} for ecosystem id ${deleteUser.ecosystemId}`
      };
      return res.status(HttpStatus.CREATED).json(finalResponse);
    }
    const finalResponse: IResponse = {
      statusCode: HttpStatus.NOT_FOUND,
      message: ResponseMessages.ecosystem.error.noRecordsFound
    };

    return res.status(HttpStatus.BAD_REQUEST).json(finalResponse);
  }

  @Put('/update-org-status')
  @ApiOperation({
    summary: 'Updates status for ecosystem org (ecosystem lead)',
    description: 'Updates status for ecosystem org'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Updated ecosystem org successfully'
  })
  @ApiQuery({
    name: 'status',
    enum: EcosystemOrgStatus,
    required: true
  })
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiBearerAuth()
  async updateEcosystemOrgStatus(
    @Body() updateUser: UpdateEcosystemOrgStatusDto,
    @Res() res: Response,
    @Query('status') status: EcosystemOrgStatus = EcosystemOrgStatus.INACTIVE
  ): Promise<Response> {
    const result = await this.ecosystemService.updateEcosystemOrgStatus(
      updateUser.ecosystemId,
      updateUser.orgIds,
      status
    );

    if (0 < result.count) {
      const finalResponse: IResponse = {
        statusCode: HttpStatus.OK,
        message: ResponseMessages.ecosystem.success.updatedEcosystemOrg
      };
      return res.status(HttpStatus.CREATED).json(finalResponse);
    }
    const finalResponse: IResponse = {
      statusCode: HttpStatus.BAD_REQUEST,
      message: ResponseMessages.ecosystem.error.failedEcosystemOrgUpdate
    };

    return res.status(HttpStatus.BAD_REQUEST).json(finalResponse);
  }

  @Get('/get-ecosystem-orgs')
  @ApiOperation({
    summary: 'Get all Orgs for ecosystem',
    description: 'Get all Orgs for ecosystem'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Orgs fetched successfully'
  })
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiBearerAuth()
  async getEcosystemOrgs(
    @Query(
      'ecosystemId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException('Invalid Uuid');
        }
      })
    )
    ecosystemId: string,
    @Query() pageDto: PaginationDto,
    @Res() res: Response
  ): Promise<Response> {
    const ecosystemData = await this.ecosystemService.getAllEcosystemOrgsByEcosystemId(ecosystemId, pageDto);
    if (ecosystemData.data && 0 < ecosystemData.data.length) {
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: ResponseMessages.ecosystem.success.fetchOrgs,
        data: ecosystemData
      });
    }

    return res.status(HttpStatus.NOT_FOUND).json({
      statusCode: HttpStatus.NOT_FOUND,
      message: ResponseMessages.ecosystem.error.ecosystemOrgsFetchFailed
    });
  }

  @Get('/:orgId/get-member-invitations')
  @ApiOperation({
    summary: 'Get invitations for ecosystem members (org owner)',
    description: 'Get invitations for ecosystem members'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Orgs fetched successfully'
  })
  @ApiQuery({
    name: 'role',
    enum: InvitationViewRole,
    required: true
  })
  @ApiQuery({ name: 'ecosystemId', required: false })
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiBearerAuth()
  async getEcosystemMemberInvitations(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Query() query: GetEcosystemInvitationsQueryDto,
    @Query() pageDto: PaginationDto,
    @Res() res: Response,
    @User() reqUser: user,
    @Query('role') role: InvitationViewRole = InvitationViewRole.ECOSYSTEM_LEAD
  ): Promise<Response> {
    const data = { ...query, role, userId: reqUser.id };
    if (InvitationViewRole.ECOSYSTEM_LEAD === role && !query.ecosystemId) {
      throw new BadRequestException('EcosystemId is required for role "Lead"');
    }
    const invitationData = await this.ecosystemService.getEcosystemMemberInvitations(data, pageDto);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.invitationsMemberSuccess,
      data: invitationData
    });
  }
  // Intent Template CRUD operations
  /**
   * Create a new intent template mapping
   * @param createIntentTemplateDto The intent template mapping details
   * @param res The response object
   * @returns The created intent template mapping
   */
  @Post('/intent-templates')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({ summary: 'Create Intent Template', description: 'Create a new intent template mapping.' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Intent template created successfully',
    type: ApiResponseDto
  })
  async createIntentTemplate(
    @Body() createIntentTemplateDto: CreateIntentTemplateDto,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    const intentTemplate = await this.ecosystemService.createIntentTemplate(createIntentTemplateDto, user);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: 'Intent template created successfully',
      data: intentTemplate
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Get all intent templates
   * @param res The response object
   * @returns List of all intent templates
   */
  @Get('/intent-templates')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({ summary: 'Get All Intent Templates', description: 'Retrieve all intent template mappings.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Intent templates retrieved successfully',
    type: GetAllIntentTemplatesResponseDto
  })
  async getAllIntentTemplates(
    @Query() intentTemplateSearchCriteria: GetAllIntentTemplatesDto,
    @Res() res: Response
  ): Promise<Response> {
    const intentTemplates: IIntentTemplateList =
      await this.ecosystemService.getAllIntentTemplatesByQuery(intentTemplateSearchCriteria);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Intent templates retrieved successfully',
      data: intentTemplates
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Get intent template by intent name and verifier organization ID
   * @param body The intent name and verifier organization ID
   * @param res The response object
   * @returns The intent template details (org-specific if exists, otherwise global)
   */
  @Get('/intent-templates/by-intent-and-org')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({
    summary: 'Get Intent Template by Intent and Organization',
    description:
      'Retrieve intent template details by intent name and verifier organization ID. Returns org-specific template if mapped, otherwise returns global template.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Intent template retrieved successfully', type: ApiResponseDto })
  async getIntentTemplateByIntentAndOrg(
    @Query() getIntentTemplateByIntentAndOrgDto: GetIntentTemplateByIntentAndOrgDto,
    @Res() res: Response
  ): Promise<Response> {
    const intentTemplate = await this.ecosystemService.getIntentTemplateByIntentAndOrg(
      getIntentTemplateByIntentAndOrgDto.intentName,
      getIntentTemplateByIntentAndOrgDto.verifierOrgId
    );
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: intentTemplate ? 'Intent template retrieved successfully' : 'No intent template found',
      data: intentTemplate
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Get intent templates by intent ID
   * @param intentId The intent ID
   * @param res The response object
   * @returns List of intent templates for the intent
   */
  @Get('/intent-templates/intent/:intentId')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({
    summary: 'Get Intent Templates by Intent ID',
    description: 'Retrieve all intent templates for a specific intent.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Intent templates retrieved successfully', type: ApiResponseDto })
  async getIntentTemplatesByIntentId(
    @Param(
      'intentId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException('Invalid intent ID format');
        }
      })
    )
    intentId: string,
    @Res() res: Response
  ): Promise<Response> {
    const intentTemplates = await this.ecosystemService.getIntentTemplatesByIntentId(intentId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Intent templates retrieved successfully',
      data: intentTemplates
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Get intent templates by organization ID
   * @param orgId The organization ID
   * @param res The response object
   * @returns List of intent templates for the organization
   */
  @Get('/intent-templates/org/:orgId')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD, OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({
    summary: 'Get Intent Templates by Organization ID',
    description: 'Retrieve all intent templates for a specific organization.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Intent templates retrieved successfully', type: ApiResponseDto })
  async getIntentTemplatesByOrgId(@Param('orgId') orgId: string, @Res() res: Response): Promise<Response> {
    const intentTemplates = await this.ecosystemService.getIntentTemplatesByOrgId(orgId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Intent templates retrieved successfully',
      data: intentTemplates
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Get intent template by ID
   * @param id The intent template ID
   * @param res The response object
   * @returns The intent template details
   */
  @Get('/intent-templates/:id')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({ summary: 'Get Intent Template by ID', description: 'Retrieve intent template details by ID.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Intent template retrieved successfully', type: ApiResponseDto })
  async getIntentTemplateById(
    @Param(
      'id',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.oid4vpIntentToTemplate.error.invalidId);
        }
      })
    )
    id: string,
    @Res() res: Response
  ): Promise<Response> {
    const intentTemplate = await this.ecosystemService.getIntentTemplateById(id);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Intent template retrieved successfully',
      data: intentTemplate
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Update intent template
   * @param id The intent template ID
   * @param updateIntentTemplateDto The updated intent template details
   * @param res The response object
   * @returns The updated intent template
   */
  @Put('/intent-templates/:id')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({ summary: 'Update Intent Template', description: 'Update an existing intent template mapping.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Intent template updated successfully', type: ApiResponseDto })
  async updateIntentTemplate(
    @Param('id') id: string,
    @Body() updateIntentTemplateDto: UpdateIntentTemplateDto,
    @User() user: IUserRequest,
    @Res() res: Response
  ): Promise<Response> {
    const intentTemplate = await this.ecosystemService.updateIntentTemplate(id, updateIntentTemplateDto, user);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Intent template updated successfully',
      data: intentTemplate
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Delete intent template
   * @param id The intent template ID
   * @param res The response object
   * @returns The deleted intent template
   */
  @Delete('/intent-templates/:id')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({ summary: 'Delete Intent Template', description: 'Delete an intent template mapping.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Intent template deleted successfully', type: ApiResponseDto })
  async deleteIntentTemplate(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    const intentTemplate = await this.ecosystemService.deleteIntentTemplate(id);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Intent template deleted successfully',
      data: intentTemplate
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Create Intent
   * @param createIntentDto
   * @returns Created intent
   */
  @Post('/intents/:ecosystemId')
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create Intent',
    description: 'Create a new intent'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Intent created successfully',
    type: ApiResponseDto
  })
  async createIntent(
    @Body() createIntentDto: CreateIntentDto,
    @Param('ecosystemId') ecosystemId: string,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    createIntentDto.ecosystemId = ecosystemId;
    createIntentDto.userId = user?.id;

    const intent = await this.ecosystemService.createIntent(createIntentDto);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.intentCreated,
      data: intent
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Get('/intents/:ecosystemId')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({
    summary: 'Get intents by ecosystem',
    description: 'Retrieve all intents of an ecosystem or a specific intent if intentId is provided'
  })
  @ApiQuery({
    name: 'intentId',
    required: false,
    type: String
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Intents fetched successfully',
    type: ApiResponseDto
  })
  async getIntents(
    @Res() res: Response,
    @Param(
      'ecosystemId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException('Invalid ecosystem ID format');
        }
      })
    )
    ecosystemId: string,
    @Query() pageDto: PaginationDto,
    @Query('intentId') intentId?: string
  ): Promise<Response> {
    const intents = await this.ecosystemService.getIntents(ecosystemId, pageDto, intentId);

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.fetchIntents,
      data: intents
    });
  }
  // verification template details by org Id
  /**
   * Get template details by org ID
   */
  @Get('/:orgId/templates')
  @Roles(OrgRoles.ECOSYSTEM_LEAD, OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get template details by orgId',
    description: 'Retrieve verification template details by orgId'
  })
  @ApiParam({
    name: 'orgId',
    required: true,
    description: 'Organization ID'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template details fetched successfully'
  })
  async getTemplateByIntentId(
    @Param('orgId') orgId: string,
    @Res() res: Response,
    @Query() pageDto: PaginationDto
  ): Promise<Response> {
    const templates = await this.ecosystemService.getVerificationTemplates(orgId, pageDto);

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.fetchVerificationTemplates,
      data: templates
    });
  }

  /**
   * Update intent
   * @param id Intent ID
   * @param updateIntentDto
   * @returns Updated intent
   */
  @Put('/intents/:ecosystemId/:intentId')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({
    summary: 'Update Intent',
    description: 'Update an existing intent within an ecosystem'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Intent updated successfully',
    type: ApiResponseDto
  })
  async updateIntent(
    @Param(
      'ecosystemId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.ecosystem.error.invalidFormatOfEcosystemId);
        }
      })
    )
    ecosystemId: string,
    @Param(
      'intentId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.ecosystem.error.invalidFormatOfIntentId);
        }
      })
    )
    intentId: string,
    @Body() updateIntentDto: UpdateIntentDto,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    updateIntentDto.userId = user?.id;
    updateIntentDto.intentId = intentId;
    updateIntentDto.ecosystemId = ecosystemId;

    const intent = await this.ecosystemService.updateIntent(updateIntentDto);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.intentUpdated,
      data: intent
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }
  /**
   * Delete intent
   * @param id Intent ID
   * @returns Deleted intent
   */
  @Delete('/intents/:ecosystemId/:intentId')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({
    summary: 'Delete Intent',
    description: 'Delete an intent within an ecosystem'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Intent deleted successfully',
    type: ApiResponseDto
  })
  async deleteIntent(
    @Param(
      'ecosystemId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.ecosystem.error.invalidFormatOfEcosystemId);
        }
      })
    )
    ecosystemId: string,
    @Param(
      'intentId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.ecosystem.error.invalidFormatOfIntentId);
        }
      })
    )
    intentId: string,

    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    const intent = await this.ecosystemService.deleteIntent(ecosystemId, intentId, user.id);

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.deleteIntent,
      data: intent
    });
  }
}
