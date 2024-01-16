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
import { CreateUserCertificateDto } from './dto/share-certificate.dto';
import { AwsService } from '@credebl/aws/aws.service';
import { PaginationDto } from '@credebl/common/dtos/pagination.dto';

@UseFilters(CustomExceptionFilter)
@Controller('users')
@ApiTags('users')
@ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly commonService: CommonService,
    private readonly awsService: AwsService
  ) { }

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

  @Get('public-profiles/:username')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Fetch user details',
    description: 'Fetch user details'
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

  @Get('/profile')
  @ApiOperation({
    summary: 'Fetch login user details',
    description: 'Fetch login user details'
  })
  @UseGuards(AuthGuard('jwt'))
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
   * @returns platform and ecosystem settings
   */
  @Get('/platform-settings')
  @ApiOperation({
    summary: 'Get all platform and ecosystem settings',
    description: 'Get all platform and ecosystem settings'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
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

  @Get('/activity')
  @ApiOperation({
    summary: 'users activity',
    description: 'Fetch users activity'
  })
  @UseGuards(AuthGuard('jwt'))
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
   * @returns Organization invitation data
   */

  @Get('/org-invitations')
  @ApiOperation({
    summary: 'organization invitations',
    description: 'Fetch organization invitations'
  })
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
   *
   * @param email
   * @returns User's email exist status
   */
  @Get('/:email')
  @ApiOperation({ summary: 'Check if user exist', description: 'check user existence' })
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
   * @param credentialId
   * @returns User credentials
   */
  @Get('/user-credentials/:credentialId')
  @ApiOperation({ summary: 'Get user credentials by Id', description: 'Get user credentials by Id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async getUserCredentialsById(@Param('credentialId') credentialId: string, @Res() res: Response): Promise<Response> {
    const getUserCrdentialsById = await this.userService.getUserCredentialsById(credentialId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.userCredentials,
      data: getUserCrdentialsById
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
*
   * @param acceptRejectInvitation
   * @returns Organization invitation status
   */
  @Post('/org-invitations/:invitationId')
  @ApiOperation({
    summary: 'accept/reject organization invitation',
    description: 'Accept or Reject organization invitations'
  })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async acceptRejectInvitaion(
      @Body() acceptRejectInvitation: AcceptRejectInvitationDto,
      @Param('invitationId', new ParseUUIDPipe({exceptionFactory: (): Error => { throw new BadRequestException(`Invalid format for InvitationId`); }})) invitationId: string,
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
   * @Body shareUserCredentials
   * @returns User certificate URL
   */
  @Post('/certificate')
  @ApiOperation({
    summary: 'Share user certificate',
    description: 'Share user certificate'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async shareUserCertificate(
    @Body() shareUserCredentials: CreateUserCertificateDto,
    @Res() res: Response
  ): Promise<Response> {  
    const schemaIdParts = shareUserCredentials.schemaId.split(':');
    // eslint-disable-next-line prefer-destructuring
    const title = schemaIdParts[2];

   const imageBuffer = await this.userService.shareUserCertificate(shareUserCredentials);
      const finalResponse: IResponse = {
        statusCode: HttpStatus.CREATED,
        message: ResponseMessages.user.success.shareUserCertificate,
        label: title,
        data: imageBuffer
      };
      return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * @Body updateUserProfileDto
   * @returns User details
   */
  @Put('/')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update user profile'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
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
   * @Body userInfo
   * @returns User's profile update status
   */
  

  @Put('/password/:email')
  @ApiOperation({ summary: 'Store user password details', description: 'Store user password details' })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async addPasskey(
    @Body() userInfo: AddPasskeyDetailsDto,
    @Param('email') email: string,
    @Res() res: Response
  ): Promise<Response> {
    const userDetails = await this.userService.addPasskey(email, userInfo);
    const finalResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.update,
      data: userDetails
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * @Body platformSettings
   * @returns platform and ecosystem settings updated status
   */
  
  @Put('/platform-settings')
  @ApiOperation({
    summary: 'Update platform and ecosystem settings',
    description: 'Update platform and ecosystem settings'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
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
