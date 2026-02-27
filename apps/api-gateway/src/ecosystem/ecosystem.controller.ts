import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
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
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
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
import { CreateEcosystemDto, PaginationGetAllEcosystem } from 'apps/ecosystem/dtos/create-ecosystem-dto';
import { DeleteEcosystemOrgDto } from './dtos/delete-ecosystem-users';
import { GetEcosystemInvitationsQueryDto, UpdateEcosystemOrgStatusDto } from './dtos/ecosystem';
import { EcosystemFeatureGuard } from '../authz/guards/ecosystem-feature-guard';
import { EcosystemOrgStatus, Invitation, InvitationViewRole } from '@credebl/enum/enum';
import { PaginationDto } from '@credebl/common/dtos/pagination.dto';
import { TrimStringParamPipe } from '@credebl/common/cast.helper';

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

  @Post('/invitation')
  @ApiOperation({
    summary: 'Invite member to ecosystem',
    description: 'Creates an invitation to add an organization to an ecosystem.'
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
  }

  @Post('/invitation/status')
  @ApiOperation({
    summary: 'Update invitation status',
    description: 'Updates the status of an existing ecosystem invitation (accept or reject).'
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
        statusCode: HttpStatus.CREATED,
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
  @Post('/')
  @ApiOperation({
    summary: 'Create ecosystem',
    description: 'Creates a new ecosystem for the specified organization.'
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
    @Query(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.ecosystem.error.invalidOrgId);
        }
      })
    )
    orgId: string,
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
  @Get('/')
  @ApiOperation({
    summary: 'Get ecosystems',
    description: 'Retrieves all ecosystems accessible to the current user.'
  })
  @ApiQuery({
    name: 'orgId',
    required: true,
    type: String
  })
  @Roles(OrgRoles.PLATFORM_ADMIN, OrgRoles.ECOSYSTEM_LEAD)
  async getEcosystems(
    @User() reqUser: user,
    @Res() res: Response,
    @Query() paginationDto: PaginationGetAllEcosystem,
    @Query(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.ecosystem.error.invalidOrgId);
        }
      })
    )
    orgId?: string
  ): Promise<Response> {
    const ecosystems = await this.ecosystemService.getEcosystemOrgs(orgId ?? null, paginationDto);
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
  @Get('/:ecosystemId/org/:orgId')
  @ApiOperation({
    summary: 'Get ecosystem dashboard',
    description: 'Retrieves details for a specific ecosystem and organization.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ecosystem dashboard data fetched successfully'
  })
  @Roles(OrgRoles.PLATFORM_ADMIN, OrgRoles.OWNER, OrgRoles.ADMIN)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiBearerAuth()
  async getEcosystemDashboard(
    @Param(
      'ecosystemId',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.ecosystem.error.invalidFormatOfEcosystemId);
        }
      })
    )
    ecosystemId: string,
    @Param(
      'orgId',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.ecosystem.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Res() res: Response
  ): Promise<Response> {
    const dashboardData = await this.ecosystemService.getEcosystemDashboard(ecosystemId, orgId);

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.getEcosystemDashboard,
      data: dashboardData
    });
  }

  @Delete('/member')
  @ApiOperation({
    summary: 'Delete ecosystem members',
    description: 'Removes one or more members from an ecosystem.'
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

  @Put('/member/status')
  @ApiOperation({
    summary: 'Update member status',
    description: 'Updates the status of an ecosystem member or organization within the ecosystem.'
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
    @Query('status', new ParseEnumPipe(EcosystemOrgStatus)) status: EcosystemOrgStatus
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

  @Get('/members')
  @ApiOperation({
    summary: 'Get ecosystem members',
    description: 'Retrieves all members associated with an ecosystem.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully fetched all the organisations for ecosystem'
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

  @Get('/invitations')
  @ApiOperation({
    summary: 'Get ecosystem invitations',
    description: 'Retrieves all invitations related to ecosystem membership.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invitations for members fetched successfully'
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
    @Query(
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

  @Get('/dashboard/summary')
  @Roles(OrgRoles.PLATFORM_ADMIN)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get Count for Ecosystem dashboard',
    description: 'Get Count for Ecosystem dashboard'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard count fetched successfully'
  })
  async getDashboardCountEcosystem(@Res() res: Response): Promise<Response> {
    const dashboard = await this.ecosystemService.getDashboardCountEcosystem();

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.dashboard,
      data: dashboard
    });
  }

  @Get('/invitation/status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get status of pending invitation for ecosystem creation',
    description: 'Get status of pending invitation for ecosystem creation'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invitation status fetched successfully'
  })
  async getCreateEcosystemInvitationStatus(@Res() res: Response, @User() reqUser: user): Promise<Response> {
    if (!reqUser.email) {
      throw new Error('Email not Found');
    }
    const status = await this.ecosystemService.getCreateEcosystemInvitationStatus(reqUser.email);

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.ecosystemStatus,
      status
    });
  }
}
