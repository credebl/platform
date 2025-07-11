import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Res,
  UnauthorizedException,
  UseFilters
} from '@nestjs/common';
import { AuthzService } from './authz.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UserEmailVerificationDto } from '../user/dto/create-user.dto';
import { ResponseType as IResponseType } from '@credebl/common';
import { ResponseMessages, CommonService } from '@credebl/common';
import { Response } from 'express';
import { EmailVerificationDto } from '../user/dto/email-verify.dto';
import { AuthTokenResponse } from './dtos/auth-token-res.dto';
import { LoginUserDto } from '../user/dto/login-user.dto';
import { AddUserDetailsDto } from '../user/dto/add-user.dto';
import { CustomExceptionFilter } from 'apps/api-gateway/src/common/exception-handler';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetTokenPasswordDto } from './dtos/reset-token-password';
import { RefreshTokenDto } from './dtos/refresh-token.dto';

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
  @ApiOperation({ summary: 'Send verification email', description: 'Send verification email to new user' })
  async create(@Body() userEmailVerification: UserEmailVerificationDto, @Res() res: Response): Promise<Response> {
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
  async login(@Body() loginUserDto: LoginUserDto, @Res() res: Response): Promise<Response> {
    if (loginUserDto.email) {
      const userData = await this.authzService.login(loginUserDto.email, loginUserDto.password);

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
}
