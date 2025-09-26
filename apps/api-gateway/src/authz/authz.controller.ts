import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseFilters,
  UseGuards
} from '@nestjs/common';
import { AuthzService } from './authz.service';
import { CommonService } from '../../../../libs/common/src/common.service';
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
import { UserEmailVerificationDto } from '../user/dto/create-user.dto';
import IResponseType, { IResponse } from '@credebl/common/interfaces/response.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Response, Request } from 'express';
import { EmailVerificationDto } from '../user/dto/email-verify.dto';
import { AuthTokenResponse } from './dtos/auth-token-res.dto';
import { LoginUserDto } from '../user/dto/login-user.dto';
import { AddUserDetailsDto } from '../user/dto/add-user.dto';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetTokenPasswordDto } from './dtos/reset-token-password';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { getDefaultClient } from '../user/utils';
import { ClientAliasValidationPipe } from './decorators/user-auth-client';
import { SessionGuard } from './guards/session.guard';
import { UserLogoutDto } from './dtos/user-logout.dto';
import { AuthGuard } from '@nestjs/passport';
import { ISessionData } from 'apps/user/interfaces/user.interface';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { User } from './decorators/user.decorator';
import { user } from '@prisma/client';
import * as useragent from 'express-useragent';
import { EmptyStringParamPipe, TrimStringParamPipe } from '@credebl/common/cast.helper';

@Controller('auth')
@ApiTags('auth')
@UseFilters(CustomExceptionFilter)
export class AuthzController {
  private logger = new Logger('AuthzController');

  constructor(
    private readonly authzService: AuthzService,
    private readonly commonService: CommonService
  ) {}

  /**
   * Fetch client aliase.
   *
   * @returns Returns client alias and its url.
   */
  @Get('/clientAliases')
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiOperation({
    summary: 'Get client aliases',
    description: 'Fetch client aliases and itr url'
  })
  async getClientAlias(@Res() res: Response): Promise<Response> {
    const clientAliases = await this.authzService.getClientAlias();
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.fetchClientAliases,
      data: clientAliases
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Verify user’s email address.
   *
   * @param email  The email address of the user.
   * @param verificationcode The verification code sent to the user's email.
   * @returns Returns the email verification status.
   */
  @Get('/verify')
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiOperation({
    summary: 'Verify user’s email',
    description: 'Checks if the provided verification code is valid for the given email.'
  })
  async verifyEmail(@Query() query: EmailVerificationDto, @Res() res: Response): Promise<Response> {
    await this.authzService.verifyEmail(query);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.emaiVerified
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Sends a verification email to the user.
   *
   * @body UserEmailVerificationDto.
   * @returns The status of the verification email.
   */
  @Post('/verification-mail')
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
  @ApiQuery({
    name: 'clientAlias',
    required: false,
    enum: (process.env.SUPPORTED_SSO_CLIENTS || '')
      .split(',')
      .map((alias) => alias.trim()?.toUpperCase())
      .filter(Boolean)
  })
  @ApiOperation({ summary: 'Send verification email', description: 'Send verification email to new user' })
  async create(
    @Query('clientAlias', ClientAliasValidationPipe) clientAlias: string,
    @Body() userEmailVerification: UserEmailVerificationDto,
    @Res() res: Response
  ): Promise<Response> {
    userEmailVerification.clientAlias = clientAlias ?? (await getDefaultClient()).alias;
    await this.authzService.sendVerificationMail(userEmailVerification);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.user.success.sendVerificationCode
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Registers a new user on the platform.
   *
   * @body AddUserDetailsDto
   * @returns User's registration status and user details
   */
  @Post('/signup')
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
  @ApiOperation({
    summary: 'Register new user to platform',
    description: 'Register new user to platform with the provided details.'
  })
  async addUserDetails(@Body() userInfo: AddUserDetailsDto, @Res() res: Response): Promise<Response> {
    const userData = await this.authzService.addUserDetails(userInfo);
    const finalResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.user.success.create,
      data: userData
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Authenticates a user and returns an access token.
   *
   * @body LoginUserDto
   * @returns User's access token details
   */
  @Post('/signin')
  @ApiOperation({
    summary: 'Authenticate the user for the access',
    description: 'Allows registered user to sign.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: AuthTokenResponse })
  @ApiBody({ type: LoginUserDto })
  async login(@Req() req: Request, @Body() loginUserDto: LoginUserDto, @Res() res: Response): Promise<Response> {
    if (loginUserDto.email) {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress;
      const ua = req.headers['user-agent'];
      const expressUa = useragent.parse(ua);
      const device = {
        browser: `${expressUa.browser} ${expressUa.version ?? ''}`.trim(),
        os: expressUa.platform,
        deviceType: expressUa.isDesktop ? 'desktop' : 'mobile'
      };

      const clientInfo = JSON.stringify({ ...device, rawDetail: ua, ip });
      const userData = await this.authzService.login(clientInfo, loginUserDto.email, loginUserDto.password);

      const finalResponse: IResponseType = {
        statusCode: HttpStatus.OK,
        message: ResponseMessages.user.success.login,
        data: userData
      };

      return res.status(HttpStatus.OK).json(finalResponse);
    } else {
      throw new UnauthorizedException(`Please provide valid credentials`);
    }
  }

  /**
   * Fetch session details
   *
   * @returns User's access token details
   */
  @Get('/sessionDetails')
  @UseGuards(SessionGuard)
  @ApiOperation({
    summary: 'Fetch session details',
    description: 'Fetch session details against logged in user'
  })
  @ApiQuery({
    name: 'sessionId',
    required: false
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: AuthTokenResponse })
  async sessionDetails(@Res() res: Response, @Req() req: Request, @Query() sessionId: ISessionData): Promise<Response> {
    this.logger.debug(`in authz controller`);

    let sessionDetails;
    if (0 < Object.keys(sessionId).length) {
      sessionDetails = await this.authzService.getSession(sessionId);
    }
    if (req.user) {
      sessionDetails = req.user;
    }

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.fetchSession,
      data: sessionDetails
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Resets user's password.
   *
   * @body ResetPasswordDto
   * @returns The password reset status.
   */
  @Post('/reset-password')
  @ApiOperation({
    summary: 'Reset password',
    description: 'Allows users to reset a new password which should be different form existing password.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Res() res: Response): Promise<Response> {
    const userData = await this.authzService.resetPassword(resetPasswordDto);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.resetPassword,
      data: userData
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Initiates the password reset process by sending a reset link to the user's email.
   *
   * @body ForgotPasswordDto
   * @returns Status message indicating whether the reset link was sent successfully.
   */
  @Post('/forgot-password')
  @ApiOperation({
    summary: 'Forgot password',
    description: 'Sends a password reset link to the user’s email.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto, @Res() res: Response): Promise<Response> {
    const userData = await this.authzService.forgotPassword(forgotPasswordDto);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.resetPasswordLink,
      data: userData
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Resets the user's password using a verification token.
   *
   * @param email The email address of the user.
   * @body ResetTokenPasswordDto
   * @returns Status message indicating whether the password reset was successful.
   */
  @Post('/password-reset/:email')
  @ApiOperation({
    summary: 'Reset password with verification token',
    description: 'Resets a user’s password using a verification token sent to their email'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async resetNewPassword(
    @Param('email') email: string,
    @Body() resetTokenPasswordDto: ResetTokenPasswordDto,
    @Res() res: Response
  ): Promise<Response> {
    resetTokenPasswordDto.email = email.trim();
    const userData = await this.authzService.resetNewPassword(resetTokenPasswordDto);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.resetPassword,
      data: userData
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Generates a new access token using a refresh token.
   *
   * @body RefreshTokenDto
   * @returns New access token and its details.
   */
  @Post('/refresh-token')
  @ApiOperation({
    summary: 'Token from refresh token',
    description: 'Generates a new access token using a refresh token.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto, @Res() res: Response): Promise<Response> {
    const tokenData = await this.authzService.refreshToken(refreshTokenDto.refreshToken);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.refreshToken,
      data: tokenData
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Log out user.
   *
   * @body LogoutUserDto
   * @returns Logged out user from current session
   */
  @Post('/signout')
  @ApiOperation({
    summary: 'Logout user',
    description: 'Logout user from current session.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiBody({ type: UserLogoutDto })
  async logout(@Body() logoutUserDto: UserLogoutDto, @Res() res: Response): Promise<Response> {
    await this.authzService.logout(logoutUserDto);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.logout
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Get all sessions by userId
   * @param userId The ID of the user
   * @returns All sessions related to the user
   */
  @Get('/:userId/sessions')
  @ApiOperation({
    summary: 'Get all sessions by userId',
    description: 'Retrieve sessions for the user. Based on userId.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ForbiddenErrorDto })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async userSessions(
    @User() reqUser: user,
    @Res() res: Response,
    @Param(
      'userId',
      EmptyStringParamPipe.forParam('userId'),
      new TrimStringParamPipe(),
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(`Invalid user ID`);
        }
      })
    )
    userId: string
  ): Promise<Response> {
    if (reqUser.id !== userId) {
      throw new ForbiddenException('You are not allowed to access sessions of another user');
    }
    const response = await this.authzService.userSessions(userId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.fetchAllSession,
      data: response
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Delete session by sessionId
   * @param sessionId The ID of the session record to delete
   * @returns Acknowledgement on deletion
   */
  @Delete('/:sessionId/sessions')
  @ApiOperation({
    summary: 'Delete a particular session using its sessionId',
    description: 'Delete a particular session using its sessionId'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ForbiddenErrorDto })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async deleteSession(
    @User() reqUser: user,
    @Res() res: Response,
    @Param(
      'sessionId',
      EmptyStringParamPipe.forParam('sessionId'),
      new TrimStringParamPipe(),
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(`Invalid session ID`);
        }
      })
    )
    sessionId: string
  ): Promise<Response> {
    const response = await this.authzService.deleteSession(sessionId, reqUser.id);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: response.message
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }
}
