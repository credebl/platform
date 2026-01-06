import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Body, Controller, Get, HttpStatus, Param, Post, Res, UseFilters, UseGuards } from '@nestjs/common';
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
import { SendEcosystemCreateDto } from './dtos/send-ecosystem-invitation';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';

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
   * Create organization invitation
   * @param SendEcosystemCreateDto The details of the invitation
   * @param userId The ID of the organization
   * @returns Success message
   */
  @Post('/:userId/invitations')
  @Roles(OrgRoles.PLATFORM_ADMIN)
  @ApiOperation({
    summary: 'Create ecosystem invitation',
    description: 'Create an invitation to user to create a new ecosystem'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  async createInvitation(
    @Body() sendEcosystemCreateDto: SendEcosystemCreateDto,
    @Param('userId') userId: string,
    @Res() res: Response
  ): Promise<Response> {
    await this.ecosystemService.inviteUserToCreateEcosystem(sendEcosystemCreateDto, userId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.createInvitation
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Get('/:userId/invitations')
  @ApiOperation({
    summary: 'Get ecosystem invitations by user',
    description: 'Fetch all ecosystem invitations created by a user'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invitations fetched successfully'
  })
  @Roles(OrgRoles.PLATFORM_ADMIN)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  async getInvitations(@Param('userId') userId: string, @Res() res: Response): Promise<Response> {
    const invitations = await this.ecosystemService.getInvitationsByUserId(userId);

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.fetch,
      data: invitations
    });
  }

  // @Post('/:orgId')
  // @ApiOperation({
  //   summary: 'Create a new ecosystem',
  //   description: 'Create a new ecosystem'
  // })
  // @ApiResponse({
  //   status: HttpStatus.CREATED,
  //   description: 'Created',
  //   type: ApiResponseDto
  // })
  // @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  // @ApiBearerAuth()
  // @Roles(OrgRoles.OWNER)
  // async createNewEcosystem(
  //   @Body() createEcosystemDto: CreateEcosystemDto,
  //   @Param('orgId') orgId: string,
  //   @User() user: object,
  //   @Res() res: Response
  // ): Promise<Response> {
  //   createEcosystemDto.orgId = orgId;
  //   createEcosystemDto.userId = user?.['id'];

  //   const ecosystem = await this.ecosystemService.createEcosystem(createEcosystemDto);

  //   const finalResponse: IResponse = {
  //     statusCode: HttpStatus.CREATED,
  //     message: ResponseMessages.ecosystem.success.create,
  //     data: ecosystem
  //   };

  //   return res.status(HttpStatus.CREATED).json(finalResponse);
  // }
}
