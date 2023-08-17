import { Controller, Post, Put, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { UserEmailVerificationDto } from './dto/create-user.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { Res } from '@nestjs/common';
import { Response } from 'express';
import { HttpStatus } from '@nestjs/common';
import { CommonService } from '@credebl/common';
import IResponseType from '@credebl/common/interfaces/response.interface';
import { BadRequestException } from '@nestjs/common';
import { AuthTokenResponse } from '../authz/dtos/auth-token-res.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UnauthorizedException } from '@nestjs/common';
import { ResponseMessages } from '@credebl/common/response-messages';
import { EmailVerificationDto } from './dto/email-verify.dto';
import { Get } from '@nestjs/common';
import { Query } from '@nestjs/common';
import { user } from '@prisma/client';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../authz/decorators/user.decorator';
import { AcceptRejectInvitationDto } from './dto/accept-reject-invitation.dto';
import { Invitation } from '@credebl/enum/enum';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRoles } from 'libs/org-roles/enums';
import { IUserRequestInterface } from './interfaces';
import { GetAllInvitationsDto } from './dto/get-all-invitations.dto';
import { GetAllUsersDto } from './dto/get-all-users.dto';
import { AddUserDetails } from './dto/add-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Controller('users')
@ApiTags('users')
@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
export class UserController {
  constructor(private readonly userService: UserService, private readonly commonService: CommonService) { }

  /**
   *
   * @param email
   * @param res
   * @returns Email sent success
   */
  @Post('/send-mail')
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  @ApiOperation({ summary: 'Send verification email', description: 'Send verification email to new user' })
  async create(@Body() userEmailVerificationDto: UserEmailVerificationDto, @Res() res: Response): Promise<Response> {
    await this.userService.sendVerificationMail(userEmailVerificationDto);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.sendVerificationCode
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * 
   * @param user 
   * @param orgId 
   * @param res 
   * @returns Users list of organization
   */
  @Get()
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.HOLDER, OrgRoles.ISSUER, OrgRoles.SUPER_ADMIN, OrgRoles.SUPER_ADMIN, OrgRoles.MEMBER)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @ApiOperation({ summary: 'Get organization users list', description: 'Get organization users list.' })
  async get(@User() user: IUserRequestInterface, @Query() getAllUsersDto: GetAllUsersDto, @Query('orgId') orgId: number, @Res() res: Response): Promise<Response> {

    const org = user.selectedOrg?.orgId;
    const users = await this.userService.get(org, getAllUsersDto);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.fetchUsers,
      data: users.response
    };

 return res.status(HttpStatus.OK).json(finalResponse);
}


  /**
   *
   * @param query
   * @param res
   * @returns User email verified
   */
  @Get('/verify')
  @ApiOperation({ summary: 'Verify new users email', description: 'Email verification for new users' })
  async verifyEmail(@Query() query: EmailVerificationDto, @Res() res: Response): Promise<Response> {
    await this.userService.verifyEmail(query);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.emaiVerified
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }

  /**
   * 
   * @param loginUserDto 
   * @param res 
   * @returns User access token details
   */
  @Post('/login')
  @ApiOperation({
    summary: 'Login API for web portal',
    description: 'Password should be AES encrypted.'
  })
  @ApiResponse({ status: 200, description: 'Success', type: AuthTokenResponse })
  @ApiBody({ type: LoginUserDto })
  async login(@Body() loginUserDto: LoginUserDto, @Res() res: Response): Promise<Response> {

    if (loginUserDto.email) {
      let decryptedPassword;
      if (loginUserDto.password) {
        decryptedPassword = this.commonService.decryptPassword(loginUserDto.password);
      }
      const userData = await this.userService.login(loginUserDto.email, decryptedPassword, loginUserDto.isPasskey);
      const finalResponse: IResponseType = {
        statusCode: HttpStatus.OK,
        message: ResponseMessages.user.success.login,
        data: userData.response
      };

      return res.status(HttpStatus.OK).json(finalResponse);
    } else {
      throw new UnauthorizedException(`Please provide valid credentials`);
    }
  }

  @Get('profile')
  @ApiOperation({
    summary: 'Fetch login user details',
    description: 'Fetch login user details'
  })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getProfile(@User() reqUser: user, @Res() res: Response): Promise<object> {

    const userData = await this.userService.getProfile(reqUser.id);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.fetchProfile,
      data: userData.response
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }

  @Get('public-profile')
  @ApiOperation({
    summary: 'Fetch user details',
    description: 'Fetch user details'
  })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiQuery({
    name: 'id',
    type: Number,
    required: false
  })
  async getPublicProfile(@User() reqUser: user, @Query('id') id: number, @Res() res: Response): Promise<object> {
    const userData = await this.userService.getPublicProfile(id);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.fetchProfile,
      data: userData.response
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }

  @Get('invitations')
  @ApiOperation({
    summary: 'organization invitations',
    description: 'Fetch organization invitations'
  })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async invitations(@User() reqUser: user, @Query() getAllInvitationsDto: GetAllInvitationsDto, @Res() res: Response): Promise<object> {

    if (!Object.values(Invitation).includes(getAllInvitationsDto.status)) {
      throw new BadRequestException(ResponseMessages.user.error.invalidInvitationStatus);
    }

    const invitations = await this.userService.invitations(reqUser.id, getAllInvitationsDto.status, getAllInvitationsDto);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.fetchInvitations,
      data: invitations.response
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }


  /**
   * 
   * @param acceptRejectInvitation 
   * @param reqUser 
   * @param res 
   * @returns Organization invitation status
   */
  @Post('invitations')
  @ApiOperation({
    summary: 'accept/reject organization invitation',
    description: 'Accept or Reject organization invitations'
  })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async acceptRejectInvitaion(@Body() acceptRejectInvitation: AcceptRejectInvitationDto, @User() reqUser: user, @Res() res: Response): Promise<object> {
    const invitationRes = await this.userService.acceptRejectInvitaion(acceptRejectInvitation, reqUser.id);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: invitationRes.response
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }

  /**
  *
  * @param email
  * @param res
  * @returns User email check
  */
  @Get('/check-user/:email')
  @ApiOperation({ summary: 'Check user exist', description: 'check user existence' })
  async checkUserExist(@Param('email') email: string, @Res() res: Response): Promise<Response> {
    const userDetails = await this.userService.checkUserExist(email);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.checkEmail,
      data: userDetails.response
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }

  /**
  *
  * @param email
  * @param userInfo
  * @param res
  * @returns Add new user
  */
  @Post('/add/:email')
  @ApiOperation({ summary: 'Add user information', description: 'Add user information' })
  async addUserDetailsInKeyCloak(@Body() userInfo: AddUserDetails, @Param('email') email: string, @Res() res: Response): Promise<Response> {
    const decryptedPassword = this.commonService.decryptPassword(userInfo.password);
    if (8 <= decryptedPassword.length && 50 >= decryptedPassword.length) {
      this.commonService.passwordValidation(decryptedPassword);
      userInfo.password = decryptedPassword;
      const userDetails = await this.userService.addUserDetailsInKeyCloak(email, userInfo);
      const finalResponse: IResponseType = {
        statusCode: HttpStatus.CREATED,
        message: ResponseMessages.user.success.create,
        data: userDetails.response
      };
      return res.status(HttpStatus.OK).json(finalResponse);

    } else {
      throw new BadRequestException('Password name must be between 8 to 50 Characters');
    }

  }

  @Put('/')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update user profile'
  })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async updateUserProfile(@Body() updateUserProfileDto: UpdateUserProfileDto, @Res() res: Response): Promise<Response> {

    await this.userService.updateUserProfile(updateUserProfileDto);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.update
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }
}