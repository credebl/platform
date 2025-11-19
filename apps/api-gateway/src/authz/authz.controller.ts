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
import { CommonService } from '../../../../libs/common/src/common.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UserEmailVerificationDto } from '../user/dto/create-user.dto';
import IResponseType from '@credebl/common/interfaces/response.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Response } from 'express';
import { EmailVerificationDto } from '../user/dto/email-verify.dto';
import { AuthTokenResponse } from './dtos/auth-token-res.dto';
import { LoginUserDto, LoginUserNameDto } from '../user/dto/login-user.dto';
import { AddUserDetailsDto, AddUserDetailsUsernameBasedDto } from '../user/dto/add-user.dto';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetTokenPasswordDto } from './dtos/reset-token-password';
import { RefreshTokenDto } from './dtos/refresh-token.dto';


@Controller('auth')
@ApiTags('auth')
@UseFilters(CustomExceptionFilter)
export class AuthzController {
  private logger = new Logger('AuthzController');

  constructor(private readonly authzService: AuthzService,
    private readonly commonService: CommonService) { }

  /**
   * @param email
   * @param verificationcode
   * @returns User's email verification status 
   */
  @Get('/verify')
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiOperation({ summary: 'Verify user’s email', description: 'Verify user’s email' })
  async verifyEmail(@Query() query: EmailVerificationDto, @Res() res: Response): Promise<Response> {
    await this.authzService.verifyEmail(query);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.emaiVerified
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }

  /**
  * @param email
  * @returns User's verification email sent status
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
  *
  * @Body userInfo
  * @returns User's registration status and user details
  */
  @Post('/signup')
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
  @ApiOperation({ summary: 'Register new user to platform', description: 'Register new user to platform' })
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
  *
  * @Body userInfo
  * @returns User's registration status and user details
  */
   @Post('/username/signup')
   @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
   @ApiOperation({ summary: 'Register new user to platform', description: 'Register new user to platform' })
   async addUserDetailsUserNameBased(@Body() userInfo: AddUserDetailsUsernameBasedDto, @Res() res: Response): Promise<Response> {
     const userData = await this.authzService.addUserDetailsUsernameBased(userInfo);
       const finalResponse = {
         statusCode: HttpStatus.CREATED,
         message: ResponseMessages.user.success.create,
         data: userData
       };
     return res.status(HttpStatus.CREATED).json(finalResponse);
 
   }


  /**
  * @Body loginUserDto
  * @returns User's access token details
  */
  @Post('/signin')
  @ApiOperation({
    summary: 'Authenticate the user for the access',
    description: 'Authenticate the user for the access'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: AuthTokenResponse })
  @ApiBody({ type: LoginUserDto })
  async login(@Body() loginUserDto: LoginUserDto, @Res() res: Response): Promise<Response> {

    if (loginUserDto.email) {
      const userData = await this.authzService.login(loginUserDto.email, loginUserDto.password, loginUserDto.isPasskey);

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
  * @Body loginUserDto
  * @returns User's access token details
  */
    @Post('/username/signin')
    @ApiOperation({
      summary: 'Authenticate the user for the access',
      description: 'Authenticate the user for the access'
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: AuthTokenResponse })
    @ApiBody({ type: LoginUserNameDto })
    async usernameLogin(@Body() loginUserDto: LoginUserNameDto, @Res() res: Response): Promise<Response> {
  
      if (loginUserDto.username) {
        const userData = await this.authzService.usernameLogin(loginUserDto.username, loginUserDto.password, loginUserDto.isPasskey);
  
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


  @Post('/reset-password')
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset Password of the user'
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

  @Post('/forgot-password')
  @ApiOperation({
    summary: 'Forgot password',
    description: 'Forgot Password of the user'
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

  @Post('/password-reset/:email')
  @ApiOperation({
    summary: 'Reset password with token',
    description: 'Reset Password of the user using token'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async resetNewPassword(
    @Param('email') email: string,
    @Body() resetTokenPasswordDto: ResetTokenPasswordDto,
    @Res() res: Response): Promise<Response> {      
      resetTokenPasswordDto.email = email.trim();
      const userData = await this.authzService.resetNewPassword(resetTokenPasswordDto);
      const finalResponse: IResponseType = {
        statusCode: HttpStatus.OK,
        message: ResponseMessages.user.success.resetPassword,
        data: userData
      };

      return res.status(HttpStatus.OK).json(finalResponse);
   
  }

  @Post('/refresh-token')
  @ApiOperation({
    summary: 'Token from refresh token',
    description: 'Get a new token from a refresh token'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res() res: Response): Promise<Response> {      
      const tokenData = await this.authzService.refreshToken(refreshTokenDto.refreshToken);
      const finalResponse: IResponseType = {
        statusCode: HttpStatus.OK,
        message: ResponseMessages.user.success.refreshToken,
        data: tokenData
      };

      return res.status(HttpStatus.OK).json(finalResponse);
   
  }

}