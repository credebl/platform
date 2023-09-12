import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Post,
  Query,
  Res,
  UnauthorizedException
} from '@nestjs/common';
import { AuthzService } from './authz.service';
// import { CommonService } from "@credebl/common";
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


@Controller('auth')
@ApiTags('auth')
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
  * @param loginUserDto 
  * @param res 
  * @returns User access token details
  */
  @Post('/login')
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
