import {
  BadRequestException,
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
import { AddUserDetails } from '../user/dto/add-user.dto';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';


@Controller('auth')
@ApiTags('auth')
@UseFilters(CustomExceptionFilter)
export class AuthzController {
  private logger = new Logger('AuthzController');

  constructor(private readonly authzService: AuthzService,
    private readonly commonService: CommonService) { }

  /**
   *
   * @param query
   * @param res
   * @returns User email verified
   */
  @Get('/verify')
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
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
  *
  * @param email
  * @param res
  * @returns Email sent success
  */
  @Post('/verification-mail')
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  @ApiOperation({ summary: 'Send verification email', description: 'Send verification email to new user' })
  async create(@Body() userEmailVerificationDto: UserEmailVerificationDto, @Res() res: Response): Promise<Response> {
    await this.authzService.sendVerificationMail(userEmailVerificationDto);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.user.success.sendVerificationCode
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
  *
  * @param email
  * @param userInfo
  * @param res
  * @returns Add new user
  */
  @Post('/signup')
  @ApiOperation({ summary: 'Register new user to platform', description: 'Register new user to platform' })
  async addUserDetails(@Body() userInfo: AddUserDetails, @Res() res: Response): Promise<Response> {
    let finalResponse;
    let userDetails;

    if (false === userInfo.isPasskey) {

      const decryptedPassword = this.commonService.decryptPassword(userInfo.password);
      if (8 <= decryptedPassword.length && 50 >= decryptedPassword.length) {
        this.commonService.passwordValidation(decryptedPassword);
        userInfo.password = decryptedPassword;
        userDetails = await this.authzService.addUserDetails(userInfo);
        finalResponse = {
          statusCode: HttpStatus.CREATED,
          message: ResponseMessages.user.success.create,
          data: userDetails.response
        };
      } else {
        throw new BadRequestException('Password name must be between 8 to 50 Characters');
      }
    } else {

      userDetails = await this.authzService.addUserDetails(userInfo);
      finalResponse = {
        statusCode: HttpStatus.CREATED,
        message: ResponseMessages.user.success.create,
        data: userDetails.response
      };
    }
    return res.status(HttpStatus.CREATED).json(finalResponse);

  }

  /**
  * 
  * @param loginUserDto 
  * @param res 
  * @returns User access token details
  */
  @Post('/signin')
  @ApiOperation({
    summary: 'Authenticate the user for the access',
    description: 'Authenticate the user for the access'
  })
  @ApiResponse({ status: 200, description: 'Success', type: AuthTokenResponse })
  @ApiBody({ type: LoginUserDto })
  async login(@Body() loginUserDto: LoginUserDto, @Res() res: Response): Promise<Response> {

    if (loginUserDto.email) {
      let decryptedPassword;
      if (loginUserDto.password) {
        decryptedPassword = this.commonService.decryptPassword(loginUserDto.password);
      }
      const userData = await this.authzService.login(loginUserDto.email, decryptedPassword, loginUserDto.isPasskey);
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

}