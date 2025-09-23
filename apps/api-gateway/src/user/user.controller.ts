import {
  Controller,
  Post,
  Put,
  Body,
  Param,
  UseFilters,
  Res,
  HttpStatus,
  BadRequestException,
  Get,
  Query,
  UseGuards,
  ParseUUIDPipe
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { Response } from 'express';
import { CommonService } from '@credebl/common';
import IResponse from '@credebl/common/interfaces/response.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { user } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../authz/decorators/user.decorator';
import { AcceptRejectInvitationDto } from './dto/accept-reject-invitation.dto';
import { Invitation } from '@credebl/enum/enum';
import { IUserRequestInterface } from './interfaces';
import { GetAllInvitationsDto } from './dto/get-all-invitations.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { AddPasskeyDetailsDto } from './dto/add-user.dto';
import { EmailValidator } from '../dtos/email-validator.dto';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { OrgRoles } from 'libs/org-roles/enums';
import { AwsService } from '@credebl/aws/aws.service';
import { PaginationDto } from '@credebl/common/dtos/pagination.dto';
import { UserAccessGuard } from '../authz/guards/user-access-guard';
import { TrimStringParamPipe } from '@credebl/common/cast.helper';

@UseFilters(CustomExceptionFilter)
@Controller('users')
@ApiTags('users')
@ApiUnauthorizedResponse({ description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ description: 'Forbidden', type: ForbiddenErrorDto })
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly commonService: CommonService,
    private readonly awsService: AwsService
  ) {}

  /**
   *
   * @param user
   * @param orgId
   * @param res
   * @returns Users list of organization
   */
  @Get('/public-profiles')
  @ApiExcludeEndpoint()
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiOperation({ summary: 'Get users list', description: 'Get users list.' })
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
  async get(
    @User() user: IUserRequestInterface,
    @Query() paginationDto: PaginationDto,
    @Res() res: Response
  ): Promise<Response> {
    const users = await this.userService.get(paginationDto);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.fetchUsers,
      data: users
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Get public profile details of a user by username.
   *
   * @param username The username of the user.
   * @returns Public profile information.
   */
  @Get('public-profiles/:username')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Fetch user details',
    description: 'Retrieve publicly available details of a user using their username.'
  })
  @ApiParam({
    name: 'username',
    type: String,
    required: false
  })
  async getPublicProfile(@Param('username') username: string, @Res() res: Response): Promise<object> {
    const userData = await this.userService.getPublicProfile(username);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.fetchProfile,
      data: userData
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Retrieves the profile details of the currently logged-in user.
   *
   * @returns The user profile details.
   */
  @Get('/profile')
  @ApiOperation({
    summary: 'Fetch login user details',
    description: 'Retrieves the profile details of the currently logged-in user.'
  })
  @UseGuards(AuthGuard('jwt'), UserAccessGuard)
  @ApiBearerAuth()
  async getProfile(@User() reqUser: user, @Res() res: Response): Promise<Response> {
    const userData = await this.userService.getProfile(reqUser.id);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.fetchProfile,
      data: userData
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Retrieves all platform settings.
   *
   * @returns  The platform settings.
   */
  @Get('/platform-settings')
  @ApiOperation({
    summary: 'Get all platform settings',
    description: 'Retrieves all platform settings.'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard, UserAccessGuard)
  @Roles(OrgRoles.PLATFORM_ADMIN)
  @ApiBearerAuth()
  async getPlatformSettings(@Res() res: Response): Promise<Response> {
    const settings = await this.userService.getPlatformSettings();

    const finalResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.fetchPlatformSettings,
      data: settings
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Fetch user activities.
   *
   * @param limit - Number of activities to fetch.
   * @returns A response containing user activity data.
   */
  @Get('/activity')
  @ApiOperation({
    summary: 'Fetch users activity',
    description: 'Fetch a list of recent activities performed by the user.'
  })
  @UseGuards(AuthGuard('jwt'), UserAccessGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'limit', required: true })
  async getUserActivities(
    @Query('limit') limit: number,
    @Res() res: Response,
    @User() reqUser: user
  ): Promise<Response> {
    const userDetails = await this.userService.getUserActivities(reqUser.id, limit);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.userActivity,
      data: userDetails
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Fetch organization invitations.
   *
   * @returns A paginated list of organization invitations.
   */
  @Get('/org-invitations')
  @ApiOperation({
    summary: 'organization invitations',
    description: 'Retrieve a list of invitations received to the user to join organizations.'
  })
  @UseGuards(AuthGuard('jwt'), UserAccessGuard)
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
  async invitations(
    @Query() getAllInvitationsDto: GetAllInvitationsDto,
    @User() reqUser: user,
    @Res() res: Response
  ): Promise<Response> {
    if (!Object.values(Invitation).includes(getAllInvitationsDto.status)) {
      throw new BadRequestException(ResponseMessages.user.error.invalidInvitationStatus);
    }

    const invitations = await this.userService.invitations(
      reqUser.id,
      getAllInvitationsDto.status,
      getAllInvitationsDto
    );

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.fetchInvitations,
      data: invitations
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Checks if a user is registered and verifies email existence.
   *
   * @param email The email address to check.
   * @returns Returns user registration and email verification status.
   */
  @Get('/:email')
  @ApiOperation({
    summary: 'Check user registration and email verification status',
    description: 'Check if a user is already registered and if their email already exists.'
  })
  async checkUserExist(@Param() emailParam: EmailValidator, @Res() res: Response): Promise<Response> {
    const userDetails = await this.userService.checkUserExist(emailParam.email);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.checkEmail,
      data: userDetails
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Accept or reject an organization invitation.
   *
   * @param invitationId The ID of the organization invitation.
   * @body AcceptRejectInvitationDto
   * @returns The status of the organization invitation response.
   */
  @Post('/org-invitations/:invitationId')
  @ApiOperation({
    summary: 'accept/reject organization invitation',
    description: 'Accept or reject an invitation to join an organization.'
  })
  @UseGuards(AuthGuard('jwt'), UserAccessGuard)
  @ApiBearerAuth()
  async acceptRejectInvitaion(
    @Body() acceptRejectInvitation: AcceptRejectInvitationDto,
    @Param(
      'invitationId',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(`Invalid format for InvitationId`);
        }
      })
    )
    invitationId: string,
    @User() reqUser: user,
    @Res() res: Response
  ): Promise<Response> {
    acceptRejectInvitation.invitationId = invitationId;
    const invitationRes = await this.userService.acceptRejectInvitaion(acceptRejectInvitation, reqUser.id);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: invitationRes
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Updates the user profile.
   *
   * @body UpdateUserProfileDto
   * @returns A response indicating the success of the update operation.
   */
  @Put('/')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Modify the user profile details such as name, email, or other information.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserAccessGuard)
  async updateUserProfile(
    @Body() updateUserProfileDto: UpdateUserProfileDto,
    @User() reqUser: user,
    @Res() res: Response
  ): Promise<Response> {
    const userId = reqUser.id;
    updateUserProfileDto.id = userId;
    await this.userService.updateUserProfile(updateUserProfileDto);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.update
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * @body AddPasskeyDetailsDto
   * @returns User's profile update status
   */

  @Put('/password/:email')
  @ApiOperation({
    summary: 'Store user password details',
    description: 'Securely store and update the user’s password details.'
  })
  @ApiExcludeEndpoint()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserAccessGuard)
  async addPasskey(
    @Body() userInfo: AddPasskeyDetailsDto,
    @User() reqUser: user,
    @Res() res: Response
  ): Promise<Response> {
    const userDetails = await this.userService.addPasskey(reqUser.email, userInfo);
    const finalResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.update,
      data: userDetails
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Updates platform settings.
   * @body UpdatePlatformSettingsDto
   *
   * @returns Status of the update operation.
   */
  @Put('/platform-settings')
  @ApiOperation({
    summary: 'Update platform settings',
    description: 'Modify platform settings. Only accessible by platform admins.'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard, UserAccessGuard)
  @Roles(OrgRoles.PLATFORM_ADMIN)
  @ApiBearerAuth()
  async updatePlatformSettings(
    @Body() platformSettings: UpdatePlatformSettingsDto,
    @Res() res: Response
  ): Promise<Response> {
    const result = await this.userService.updatePlatformSettings(platformSettings);

    const finalResponse = {
      statusCode: HttpStatus.OK,
      message: result
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }
}
