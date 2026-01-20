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
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
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
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { EcosystemRolesGuard } from '../authz/guards/ecosystem-roles.guard';
import { CreateEcosystemInvitationDto } from './dtos/send-ecosystem-invitation';
import { user } from '@prisma/client';
import { User } from '../authz/decorators/user.decorator';
import { CreateEcosystemDto } from 'apps/ecosystem/dtos/create-ecosystem-dto';
import { DeleteEcosystemOrgDto } from './dtos/delete-ecosystem-users';
import { GetEcosystemInvitationsQueryDto, UpdateEcosystemOrgStatusDto } from './dtos/ecosystem';

@UseFilters(CustomExceptionFilter)
@Controller('ecosystem')
@ApiTags('ecosystem')
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

  /**
   * Invitation to create ecosystem (platform admin)
   * @param createEcosystemInvitationDto
   * @returns Success message
   */
  @Post('/invitations')
  @Roles(OrgRoles.PLATFORM_ADMIN)
  @ApiOperation({
    summary: 'Create ecosystem invitation (platform admin)',
    description: 'Invite a user to create an ecosystem'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Success',
    type: ApiResponseDto
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  async createInvitation(
    @Body() createEcosystemInvitationDto: CreateEcosystemInvitationDto,
    @User() reqUser: user,
    @Res() res: Response
  ): Promise<Response> {
    await this.ecosystemService.inviteUserToCreateEcosystem(createEcosystemInvitationDto.email, reqUser.id);

    return res.status(HttpStatus.CREATED).json({
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.createInvitation
    });
  }

  /**
   * Get invitations sent by platform admin
   * @returns Invitation details
   */

  @Get('/invitations')
  @ApiOperation({
    summary: 'Get ecosystem invitations by user (platform admin)',
    description: 'Fetch all ecosystem invitations created by the logged-in user'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invitations fetched successfully'
  })
  @Roles(OrgRoles.PLATFORM_ADMIN)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  async getInvitations(@User() reqUser: user, @Res() res: Response): Promise<Response> {
    const invitations = await this.ecosystemService.getInvitationsByUserId(reqUser.id);

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.fetch,
      data: invitations
    });
  }

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
      if (error instanceof ConflictException || HttpStatus.CONFLICT === error.status) {
        return res.status(HttpStatus.CONFLICT).json({
          status: HttpStatus.CONFLICT,
          message: error.message
        });
      }

      const finalResponse: IResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: ResponseMessages.errorMessages.serverError
      };

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(finalResponse);
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
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async updateEcosystemInvitationStatus(
    @Body() updateInvitation: UpdateEcosystemInvitationDto,
    @User() reqUser: user,
    @Res() res: Response
  ): Promise<Response> {
    if (!reqUser.id) {
      throw new BadRequestException('Missing request user id');
    }
    const result = await this.ecosystemService.updateEcosystemInvitationStatus(
      updateInvitation.status,
      reqUser.id,
      updateInvitation.ecosystemId
    );

    if (result) {
      const finalResponse: IResponse = {
        statusCode: HttpStatus.OK,
        message: `${ResponseMessages.ecosystem.success.updateInvitation} as ${updateInvitation.status}`
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
  @Post('/:orgId')
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
  @Get()
  @ApiOperation({
    summary: 'Get all ecosystems (platform admin)',
    description: 'Fetch all ecosystems available on the platform'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ecosystems fetched successfully'
  })
  @Roles(OrgRoles.PLATFORM_ADMIN)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  async getAllEcosystems(@User() reqUser: user, @Res() res: Response): Promise<Response> {
    const ecosystems = await this.ecosystemService.getAllEcosystems();

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.fetch,
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
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiBearerAuth()
  async updateEcosystemOrgStatus(
    @Body() updateUser: UpdateEcosystemOrgStatusDto,
    @Res() res: Response
  ): Promise<Response> {
    const result = await this.ecosystemService.updateEcosystemOrgStatus(
      updateUser.ecosystemId,
      updateUser.orgIds,
      updateUser.status
    );

    if (0 < result.count) {
      const finalResponse: IResponse = {
        statusCode: HttpStatus.OK,
        message: ResponseMessages.ecosystem.success.updatedEcosytemOrg
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
    @Res() res: Response
  ): Promise<Response> {
    const ecosystemData = await this.ecosystemService.getAllEcosystemOrgsByEcosystemId(ecosystemId);
    if (ecosystemData && 0 < ecosystemData.length) {
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
  @ApiQuery({ name: 'role', required: true })
  @ApiQuery({ name: 'ecosystemId', required: false })
  @ApiQuery({ name: 'email', required: false })
  @ApiQuery({ name: 'userId', required: false })
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
    @Res() res: Response
  ): Promise<Response> {
    if (!query.email && !query.userId) {
      throw new BadRequestException('Need to have at least one of userId or email');
    }
    if (OrgRoles.ECOSYSTEM_LEAD === query.role && !query.ecosystemId) {
      throw new BadRequestException('EcosystemId is required for role "Lead"');
    }
    const invitationData = await this.ecosystemService.getEcosystemMemberInvitations(query);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.invitationsMemberSuccess,
      data: invitationData
    });
  }
}
