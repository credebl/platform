import { ApiBearerAuth, ApiExcludeEndpoint, ApiForbiddenResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CommonService } from '@credebl/common';
import { Controller, Get, Put, Param, UseGuards, UseFilters, Post, Body, Res, HttpStatus, Query, Delete, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dtos/create-organization-dto';
import  IResponse from '@credebl/common/interfaces/response.interface';
import { Response } from 'express';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../authz/decorators/user.decorator';
import { user } from '@prisma/client';
import { ResponseMessages } from '@credebl/common/response-messages';
import { BulkSendInvitationDto } from './dtos/send-invitation.dto';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRoles } from 'libs/org-roles/enums';
import { UpdateUserRolesDto } from './dtos/update-user-roles.dto';
import { UpdateOrganizationDto } from './dtos/update-organization-dto';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { IUserRequestInterface } from '../interfaces/IUserRequestInterface';
import { ImageServiceService } from '@credebl/image-service';
import { PaginationDto } from '@credebl/common/dtos/pagination.dto';
import { validate as isValidUUID } from 'uuid';

@UseFilters(CustomExceptionFilter)
@Controller('orgs')
@ApiTags('organizations')
@ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
export class OrganizationController {

  constructor(
    private readonly organizationService: OrganizationService,
    private readonly imageServiceService: ImageServiceService,
    private readonly commonService: CommonService
  ) { }

/**
 * @param orgId 
 * @returns Organization logo image
 */

  @Get('/profile/:orgId')
  @ApiOperation({ summary: 'Organization Profile', description: 'Get organization profile details' })
  @ApiExcludeEndpoint()
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async getOrgPofile(@Param('orgId', new ParseUUIDPipe({exceptionFactory: (): Error => { throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId); }}))
  orgId: string, @Res() res: Response): Promise<Response> {

    const orgProfile = await this.organizationService.getOrgPofile(orgId);

    const base64Data = orgProfile['logoUrl'];
    const getImageBuffer = await this.imageServiceService.getBase64Image(base64Data);
    res.setHeader('Content-Type', 'image/png'); 
    return res.send(getImageBuffer);
  }

/**
 * @returns List of public organizations
 */
  @Get('/public-profile')
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiOperation({ summary: 'Get all public profile organizations', description: 'Get all public profile organizations.' })
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
  async get(@Query() paginationDto: PaginationDto, @Res() res: Response): Promise<Response> {

    const users = await this.organizationService.getPublicOrganizations(paginationDto);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.getOrganizations,
      data: users
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

/**
 * @returns get organization roles
 */

  @Get('/roles')
  @ApiOperation({
    summary: 'Fetch org-roles details',
    description: 'Fetch org-roles details'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getOrgRoles(@Res() res: Response): Promise<Response> {

    const orgRoles = await this.organizationService.getOrgRoles();

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.fetchOrgRoles,
      data: orgRoles
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }
/**
 * @param orgSlug 
 * @returns organization details
 */
  @Get('public-profiles/:orgSlug')
  @ApiOperation({
    summary: 'Fetch organization details',
    description: 'Fetch organization details'
  })

  @ApiParam({
    name: 'orgSlug',
    type: String,
    required: true
  })
  async getPublicProfile(@Param('orgSlug') orgSlug: string, @Res() res: Response): Promise<Response> {
    // eslint-disable-next-line no-param-reassign
    orgSlug = orgSlug.trim();
    
    if (!orgSlug.length) {
      throw new BadRequestException(ResponseMessages.organisation.error.orgSlugIsRequired);
    }
    const userData = await this.organizationService.getPublicProfile(orgSlug);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.fetchProfile,
      data: userData
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }

/**
 * @param orgId 
 * @returns Organization dashboard details
 */

  @Get('/dashboard/:orgId')
  @ApiOperation({ summary: 'Get dashboard details', description: 'Get organization dashboard details' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER, OrgRoles.SUPER_ADMIN, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER)
  async getOrganizationDashboard(@Param('orgId') orgId: string, @Res() res: Response, @User() reqUser: user): Promise<Response> {

    const getOrganization = await this.organizationService.getOrganizationDashboard(orgId, reqUser.id);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.getOrgDashboard,
      data: getOrganization
    };
    return res.status(HttpStatus.OK).json(finalResponse);

  }

  @Get('/:orgId/invitations')
  @ApiOperation({ summary: 'Get all invitations', description: 'Get all invitations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
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
  @Roles(OrgRoles.OWNER, OrgRoles.SUPER_ADMIN, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER)
  async getInvitationsByOrgId(@Param('orgId') orgId: string, @Query() paginationDto: PaginationDto, @Res() res: Response): Promise<Response> {

    const getInvitationById = await this.organizationService.getInvitationsByOrgId(orgId, paginationDto);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.getInvitation,
      data: getInvitationById
    };
    return res.status(HttpStatus.OK).json(finalResponse);

  }

  @Get('/')
  @ApiOperation({ summary: 'Get all organizations', description: 'Get all organizations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiQuery({
    name: 'pageNumber',
    example: '1',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'pageSize',
    example: '10',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'search',
    example: '',
    type: String,
    required: false
  })
  async getOrganizations(@Query() paginationDto: PaginationDto, @Res() res: Response, @User() reqUser: user): Promise<Response> {

    const getOrganizations = await this.organizationService.getOrganizations(paginationDto, reqUser.id);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.getOrganizations,
      data: getOrganizations
    };
    return res.status(HttpStatus.OK).json(finalResponse);

  }

  /**
   * @returns Organization details
   */
  @Get('/:orgId')
  @ApiOperation({ summary: 'Get an organization', description: 'Get an organization by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER)
  async getOrganization(@Param('orgId') orgId: string, @Res() res: Response, @User() reqUser: user): Promise<Response> {

    const getOrganization = await this.organizationService.getOrganization(orgId, reqUser.id);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.getOrganization,
      data: getOrganization
    };
    return res.status(HttpStatus.OK).json(finalResponse);

  }

  /**
  * @returns Users list of organization
  */

  @Get('/:orgId/users')
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.HOLDER, OrgRoles.ISSUER, OrgRoles.SUPER_ADMIN, OrgRoles.SUPER_ADMIN, OrgRoles.MEMBER)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiOperation({ summary: 'Get organization users list', description: 'Get organization users list.' })
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
  async getOrganizationUsers(@User() user: IUserRequestInterface, @Query() paginationDto: PaginationDto, @Param('orgId') orgId: string, @Res() res: Response): Promise<Response> {
    const users = await this.organizationService.getOrgUsers(orgId, paginationDto);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.fetchUsers,
      data: users
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }
/**
 * @returns organization details
 */

  @Post('/')
  @ApiOperation({ summary: 'Create a new Organization', description: 'Create an organization' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async createOrganization(@Body() createOrgDto: CreateOrganizationDto, @Res() res: Response, @User() reqUser: user): Promise<Response> {
    await this.organizationService.createOrganization(createOrgDto, reqUser.id);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.organisation.success.create
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Post('/:orgId/invitations')
  @ApiOperation({
    summary: 'Create organization invitation',
    description: 'Create send invitation'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @Roles(OrgRoles.OWNER, OrgRoles.SUPER_ADMIN, OrgRoles.ADMIN)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  async createInvitation(@Body() bulkInvitationDto: BulkSendInvitationDto, @Param('orgId') orgId: string, @User() user: user, @Res() res: Response): Promise<Response> {

    bulkInvitationDto.orgId = orgId;
    await this.organizationService.createInvitation(bulkInvitationDto, user.id, user.email);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.organisation.success.createInvitation
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);

  }
/**
 * @returns organization details
 */
  @Put('/:orgId/user-roles/:userId')
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiOperation({ summary: 'Update user roles', description: 'update user roles' })
  async updateUserRoles(@Body() updateUserDto: UpdateUserRolesDto, @Param('orgId') orgId: string, @Param('userId') userId: string, @Res() res: Response): Promise<Response> {

    updateUserDto.orgId = orgId;  
    updateUserDto.userId = userId.trim();  
    if (!updateUserDto.userId.length) {
      throw new BadRequestException(ResponseMessages.organisation.error.userIdIsRequired);
    }

    if (!isValidUUID(updateUserDto.userId)) {
      throw new BadRequestException(ResponseMessages.organisation.error.invalidUserId);
    } 

    await this.organizationService.updateUserRoles(updateUserDto, updateUserDto.userId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.updateUserRoles
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }
/**
 * @returns organization details
 */
  @Put('/:orgId')
  @ApiOperation({ summary: 'Update Organization', description: 'Update an organization' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async updateOrganization(@Body() updateOrgDto: UpdateOrganizationDto, @Param('orgId') orgId: string, @Res() res: Response, @User() reqUser: user): Promise<Response> {

    updateOrgDto.orgId = orgId;
    await this.organizationService.updateOrganization(updateOrgDto, reqUser.id, orgId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.update
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * @returns Boolean
   */
  //Todo
  @Delete('/:orgId')
  @ApiOperation({ summary: 'Delete Organization', description: 'Delete an organization' })
  @ApiExcludeEndpoint()
  @ApiResponse({ status: HttpStatus.ACCEPTED, description: 'Success', type: ApiResponseDto })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async deleteOrganization(
    @Param('orgId') orgId: string, 
    @Res() res: Response
    ): Promise<Response> {

    await this.organizationService.deleteOrganization(orgId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.ACCEPTED,
      message: ResponseMessages.organisation.success.delete
    };
    return res.status(HttpStatus.ACCEPTED).json(finalResponse);
  }


  @Delete('/:orgId/invitations/:invitationId')
  @ApiOperation({ summary: 'Delete organization invitation', description: 'Delete organization invitation' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async deleteOrganizationInvitation(
    @Param('orgId') orgId: string, 
    @Param('invitationId') invitationId: string, 
    @Res() res: Response
    ): Promise<Response> {
      // eslint-disable-next-line no-param-reassign
      invitationId = invitationId.trim();
      if (!invitationId.length) {
        throw new BadRequestException(ResponseMessages.organisation.error.invitationIdIsRequired);
      }
  
      if (!isValidUUID(invitationId)) {
        throw new BadRequestException(ResponseMessages.organisation.error.invalidInvitationId);
      } 


    await this.organizationService.deleteOrganizationInvitation(orgId, invitationId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.orgInvitationDeleted
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }
}

