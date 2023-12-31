import { ApiBearerAuth, ApiForbiddenResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CommonService } from '@credebl/common';
import { Controller, Get, Put, Param, UseGuards, UseFilters, Post, Body, Res, HttpStatus, Query, Delete } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dtos/create-organization-dto';
import IResponseType, { IResponse } from '@credebl/common/interfaces/response.interface';
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
import { GetAllOrganizationsDto } from './dtos/get-all-organizations.dto';
import { GetAllSentInvitationsDto } from './dtos/get-all-sent-invitations.dto';
import { UpdateOrganizationDto } from './dtos/update-organization-dto';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { IUserRequestInterface } from '../interfaces/IUserRequestInterface';
import { GetAllUsersDto } from '../user/dto/get-all-users.dto';
import { ImageServiceService } from '@credebl/image-service';

@UseFilters(CustomExceptionFilter)
@Controller('orgs')
@ApiTags('organizations')
@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
export class OrganizationController {

  constructor(
    private readonly organizationService: OrganizationService,
    private readonly imageServiceService: ImageServiceService,
    private readonly commonService: CommonService
  ) { }

  @Get('/profile/:orgId')
  @ApiOperation({ summary: 'Organization Profile', description: 'Update an organization' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  async getOgPofile(@Param('orgId') orgId: string, @Res() res: Response): Promise<IResponseType> {
    const orgProfile = await this.organizationService.getOgPofile(orgId);

    const base64Data = orgProfile['logoUrl'];
    const getImageBuffer = await this.imageServiceService.getBase64Image(base64Data);

    res.setHeader('Content-Type', 'image/png'); 
    return res.send(getImageBuffer);
  }

  /**
 * 
 * @param user 
 * @param orgId 
 * @param res 
 * @returns Users list of organization
 */
  @Get('/public-profile')
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @ApiOperation({ summary: 'Get all public profile of organizations', description: 'Get all public profile of organizations.' })
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
  async get(@Query() getAllUsersDto: GetAllOrganizationsDto, @Res() res: Response): Promise<IResponseType> {

    const users = await this.organizationService.getPublicOrganizations(getAllUsersDto);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.getOrganizations,
      data: users
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('/roles')
  @ApiOperation({
    summary: 'Fetch org-roles details',
    description: 'Fetch org-roles details'
  })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getOrgRoles(@Res() res: Response): Promise<IResponseType> {

    const orgRoles = await this.organizationService.getOrgRoles();

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.fetchOrgRoles,
      data: orgRoles
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }

  @Get('public-profiles/:orgSlug')
  @ApiOperation({
    summary: 'Fetch user details',
    description: 'Fetch user details'
  })

  @ApiParam({
    name: 'orgSlug',
    type: String,
    required: true
  })
  async getPublicProfile(@Param('orgSlug') orgSlug: string, @Res() res: Response): Promise<IResponseType> {
    const userData = await this.organizationService.getPublicProfile(orgSlug);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.fetchProfile,
      data: userData
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }


  @Get('/dashboard/:orgId')
  @ApiOperation({ summary: 'Get an organization', description: 'Get an organization' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()

  async getOrganizationDashboard(@Param('orgId') orgId: string, @Res() res: Response, @User() reqUser: user): Promise<IResponseType> {

    const getOrganization = await this.organizationService.getOrganizationDashboard(orgId, reqUser.id);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.getOrgDashboard,
      data: getOrganization
    };
    return res.status(HttpStatus.OK).json(finalResponse);

  }

  @Get('/:orgId/invitations')
  @ApiOperation({ summary: 'Get an invitations', description: 'Get an invitations' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
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
  async getInvitationsByOrgId(@Param('orgId') orgId: string, @Query() getAllInvitationsDto: GetAllSentInvitationsDto, @Res() res: Response): Promise<IResponseType> {

    const getInvitationById = await this.organizationService.getInvitationsByOrgId(orgId, getAllInvitationsDto);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.getInvitation,
      data: getInvitationById
    };
    return res.status(HttpStatus.OK).json(finalResponse);

  }

  @Get('/')
  @ApiOperation({ summary: 'Get all organizations', description: 'Get all organizations' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
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
  async getOrganizations(@Query() getAllOrgsDto: GetAllOrganizationsDto, @Res() res: Response, @User() reqUser: user): Promise<IResponseType> {

    const getOrganizations = await this.organizationService.getOrganizations(getAllOrgsDto, reqUser.id);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.getOrganizations,
      data: getOrganizations
    };
    return res.status(HttpStatus.OK).json(finalResponse);

  }

  @Get('/:orgId')
  @ApiOperation({ summary: 'Get an organization', description: 'Get an organization' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER)
  async getOrganization(@Param('orgId') orgId: string, @Res() res: Response, @User() reqUser: user): Promise<IResponseType> {

    const getOrganization = await this.organizationService.getOrganization(orgId, reqUser.id);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.getOrganization,
      data: getOrganization
    };
    return res.status(HttpStatus.OK).json(finalResponse);

  }

  /**
  * 
  * @param user 
  * @param orgId 
  * @param res 
  * @returns Users list of organization
  */
  @Get('/:orgId/users')
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.HOLDER, OrgRoles.ISSUER, OrgRoles.SUPER_ADMIN, OrgRoles.SUPER_ADMIN, OrgRoles.MEMBER)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
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
  async getOrganizationUsers(@User() user: IUserRequestInterface, @Query() getAllUsersDto: GetAllUsersDto, @Param('orgId') orgId: string, @Res() res: Response): Promise<IResponseType> {
    const users = await this.organizationService.getOrgUsers(orgId, getAllUsersDto);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.fetchUsers,
      data: users
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Post('/')
  @ApiOperation({ summary: 'Create a new Organization', description: 'Create an organization' })
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async createOrganization(@Body() createOrgDto: CreateOrganizationDto, @Res() res: Response, @User() reqUser: user): Promise<IResponseType> {
    await this.organizationService.createOrganization(createOrgDto, reqUser.id);
    const finalResponse: IResponseType = {
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
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @Roles(OrgRoles.OWNER, OrgRoles.SUPER_ADMIN, OrgRoles.ADMIN)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  async createInvitation(@Body() bulkInvitationDto: BulkSendInvitationDto, @Param('orgId') orgId: string, @User() user: user, @Res() res: Response): Promise<IResponseType> {

    bulkInvitationDto.orgId = orgId;
    await this.organizationService.createInvitation(bulkInvitationDto, user.id, user.email);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.organisation.success.createInvitation
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);

  }

  @Put('/:orgId/user-roles/:userId')
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @ApiOperation({ summary: 'Update user roles', description: 'update user roles' })
  async updateUserRoles(@Body() updateUserDto: UpdateUserRolesDto, @Param('orgId') orgId: string, @Param('userId') userId: string, @Res() res: Response): Promise<IResponseType> {

    updateUserDto.orgId = orgId;
    updateUserDto.userId = userId;
    await this.organizationService.updateUserRoles(updateUserDto, updateUserDto.userId);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.updateUserRoles
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Put('/:orgId')
  @ApiOperation({ summary: 'Update Organization', description: 'Update an organization' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async updateOrganization(@Body() updateOrgDto: UpdateOrganizationDto, @Param('orgId') orgId: string, @Res() res: Response, @User() reqUser: user): Promise<IResponseType> {

    updateOrgDto.orgId = orgId;
    await this.organizationService.updateOrganization(updateOrgDto, reqUser.id, orgId);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.update
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Delete('/:orgId')
  @ApiOperation({ summary: 'Delete Organization', description: 'Delete an organization' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async deleteOrganization(@Param('orgId') orgId: number, @Res() res: Response): Promise<IResponseType> {

    await this.organizationService.deleteOrganization(orgId);

    const finalResponse: IResponseType = {
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
    await this.organizationService.deleteOrganizationInvitation(orgId, invitationId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.orgInvitationDeleted
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }
}