import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Body, Controller, Get, HttpStatus, Param, Post, Res, UseFilters, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CustomExceptionFilter } from '@credebl/common/exception-handler';
import { EcosystemService } from './ecosystem.service';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { OrgRoles } from 'libs/org-roles/enums';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Roles } from '../authz/decorators/roles.decorator';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { SendEcosystemCreateDto } from './dtos/send-ecosystem-invitation';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { user } from '@prisma/client';
import { User } from '../authz/decorators/user.decorator';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { CreateEcosystemDto } from 'apps/ecosystem/dtos/create-ecosystem-dto';
import { IResponse } from '@credebl/common/interfaces/response.interface';

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
   * @param SendEcosystemCreateDto The details of the invitation
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
    @Body() sendEcosystemCreateDto: SendEcosystemCreateDto,
    @User() reqUser: user,
    @Res() res: Response
  ): Promise<Response> {
    await this.ecosystemService.inviteUserToCreateEcosystem(sendEcosystemCreateDto.email, reqUser.id);

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
    const userId = reqUser?.id;

    const invitations = await this.ecosystemService.getInvitationsByUserId(userId);

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.fetch,
      data: invitations
    });
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
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  async createNewEcosystem(
    @Body() createEcosystemDto: CreateEcosystemDto,
    @Param('orgId') orgId: string,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    createEcosystemDto.orgId = orgId;
    createEcosystemDto.userId = user?.['id'];

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
   * @param SendEcosystemCreateDto The details of the invitation
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
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
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
}
