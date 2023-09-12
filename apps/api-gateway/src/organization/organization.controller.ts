import { ApiBearerAuth, ApiForbiddenResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CommonService } from '@credebl/common';
import { Controller, Get, Put, Param, UseGuards, UseFilters } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { Post } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { Res } from '@nestjs/common';
import { CreateOrganizationDto } from './dtos/create-organization-dto';
import IResponseType from '@credebl/common/interfaces/response.interface';
import { HttpStatus } from '@nestjs/common';
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
import { Query } from '@nestjs/common';
import { GetAllOrganizationsDto } from './dtos/get-all-organizations.dto';
import { GetAllSentInvitationsDto } from './dtos/get-all-sent-invitations.dto';
import { UpdateOrganizationDto } from './dtos/update-organization-dto';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';

@UseFilters(CustomExceptionFilter)
@Controller('orgs')
@ApiTags('organizations')
@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
export class OrganizationController {

  constructor(
    private readonly organizationService: OrganizationService,
    private readonly commonService: CommonService
  ) { }

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
  async get(@Query() getAllUsersDto: GetAllOrganizationsDto, @Res() res: Response): Promise<Response> {

    const users = await this.organizationService.getPublicOrganizations(getAllUsersDto);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.getOrganizations,
      data: users.response
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
  async getOrgRoles(@Res() res: Response): Promise<Response> {

    const orgRoles = await this.organizationService.getOrgRoles();

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.fetchOrgRoles,
      data: orgRoles
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }

  @Get('/public-profile/:orgId')
  @ApiOperation({
    summary: 'Get public profile of specific organization',
    description: 'Get public profile of specific organization'
  })

  async getPublicProfile(@User() reqUser: user, @Param('orgId') id: number, @Res() res: Response): Promise<object> {
    const userData = await this.organizationService.getPublicProfile(id);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.fetchProfile,
      data: userData.response
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }

  @Get('/:orgId/invitations')
  @ApiOperation({ summary: 'Get an invitations', description: 'Get an invitations' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getInvitationsByOrgId(@Param('orgId') orgId: number, @Query() getAllInvitationsDto: GetAllSentInvitationsDto, @Res() res: Response): Promise<Response> {

    const getInvitationById = await this.organizationService.getInvitationsByOrgId(orgId, getAllInvitationsDto);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.getInvitation,
      data: getInvitationById.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);

  }

  @Get('/dashboard/:orgId')
  @ApiOperation({ summary: 'Get an organization', description: 'Get an organization' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()

  async getOrganizationDashboard(@Param('orgId') orgId: number, @Res() res: Response, @User() reqUser: user): Promise<Response> {

    const getOrganization = await this.organizationService.getOrganizationDashboard(orgId, reqUser.id);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.getOrgDashboard,
      data: getOrganization.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);

  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get an organization', description: 'Get an organization' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getOrganization(@Param('id') orgId: number, @Res() res: Response, @User() reqUser: user): Promise<Response> {

    const getOrganization = await this.organizationService.getOrganization(orgId, reqUser.id);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.getOrganization,
      data: getOrganization.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);

  }

  @Get('/')
  @ApiOperation({ summary: 'Get all organizations', description: 'Get all organizations' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getOrganizations(@Query() getAllOrgsDto: GetAllOrganizationsDto, @Res() res: Response, @User() reqUser: user): Promise<Response> {

    const getOrganizations = await this.organizationService.getOrganizations(getAllOrgsDto, reqUser.id);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.getOrganizations,
      data: getOrganizations.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);

  }

  @Post('/')
  @ApiOperation({ summary: 'Create a new Organization', description: 'Create an organization' })
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async createOrganization(@Body() createOrgDto: CreateOrganizationDto, @Res() res: Response, @User() reqUser: user): Promise<Response> {
    await this.organizationService.createOrganization(createOrgDto, reqUser.id);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.organisation.success.create
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Post('/invitations')
  @ApiOperation({
    summary: 'Create organization invitation',
    description: 'Create send invitation'
  })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @Roles(OrgRoles.OWNER, OrgRoles.SUPER_ADMIN, OrgRoles.ADMIN)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  async createInvitation(@Body() bulkInvitationDto: BulkSendInvitationDto, @User() user: user, @Res() res: Response): Promise<Response> {
    await this.organizationService.createInvitation(bulkInvitationDto, user.id);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.organisation.success.createInvitation
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);

  }

  @Put('/:orgId')
  @ApiOperation({ summary: 'Update Organization', description: 'Update an organization' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async updateOrganization(@Body() updateOrgDto: UpdateOrganizationDto, @Param('orgId') orgId: number, @Res() res: Response, @User() reqUser: user): Promise<Response> {

    updateOrgDto.orgId = orgId;
    await this.organizationService.updateOrganization(updateOrgDto, reqUser.id);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.update
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Put('/:orgId/user-roles/:userId')
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @ApiOperation({ summary: 'Update user roles', description: 'update user roles' })
  async updateUserRoles(@Body() updateUserDto: UpdateUserRolesDto, @Param('orgId') orgId: number, @Param('userId') userId: number, @Res() res: Response): Promise<Response> {

    updateUserDto.orgId = orgId;
    updateUserDto.userId = userId;
    await this.organizationService.updateUserRoles(updateUserDto, updateUserDto.userId);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.organisation.success.updateUserRoles
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }
}
