import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
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
import { LoginUserDto } from '../user/dto/login-user.dto';
import { AddUserDetailsDto } from '../user/dto/add-user.dto';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';


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
  * @returns User's registration status
  */
  @Post('/signup')
  @ApiOperation({ summary: 'Register new user to platform', description: 'Register new user to platform' })
  async addUserDetails(@Body() userInfo: AddUserDetailsDto, @Res() res: Response): Promise<Response> {
      await this.authzService.addUserDetails(userInfo);
      const finalResponse = {
        statusCode: HttpStatus.CREATED,
        message: ResponseMessages.user.success.create
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

}