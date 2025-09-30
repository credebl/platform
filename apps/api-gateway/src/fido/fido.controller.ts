import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Request,
  Res,
  UseFilters
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiForbiddenResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { BadRequestErrorDto } from '../dtos/bad-request-error.dto';
import {
  GenerateAuthenticationDto,
  GenerateRegistrationDto,
  UpdateFidoUserDetailsDto,
  VerifyRegistrationDto,
  VerifyAuthenticationDto
} from '../dtos/fido-user.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { FidoService } from './fido.service';
import { ResponseMessages } from '@credebl/common/response-messages';
import IResponseType from '@credebl/common/interfaces/response.interface';
import { Response } from 'express';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRoles } from 'libs/org-roles/enums';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';

@UseFilters(CustomExceptionFilter)
@Controller('auth')
@ApiTags('fido')
@ApiUnauthorizedResponse({ description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ description: 'Forbidden', type: ForbiddenErrorDto })
@ApiBadRequestResponse({ description: 'Bad Request', type: BadRequestErrorDto })
export class FidoController {
  private logger = new Logger('FidoController');
  constructor(private readonly fidoService: FidoService) {}

  /**
   * Fetch fido user details
   * @param email The email of the user
   * @param res The response object
   * @returns User details
   */
  @Get('/passkey/:email')
  // TODO: Check if roles are required here?
  // @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.HOLDER, OrgRoles.ISSUER, OrgRoles.SUPER_ADMIN, OrgRoles.MEMBER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Fetch fido user details',
    description: 'Retrieve the details of a FIDO user by their email address.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ForbiddenErrorDto })
  @ApiBadRequestResponse({ description: 'Bad Request', type: BadRequestErrorDto })
  async fetchFidoUserDetails(@Request() req, @Param('email') email: string, @Res() res: Response): Promise<Response> {
    try {
      const fidoUserDetails = await this.fidoService.fetchFidoUserDetails(email.toLowerCase());
      const finalResponse: IResponseType = {
        statusCode: HttpStatus.OK,
        message: ResponseMessages.user.success.fetchUsers,
        data: fidoUserDetails.response
      };
      return res.status(HttpStatus.OK).json(finalResponse);
    } catch (error) {
      this.logger.error(`Error::${error}`);
      throw error;
    }
  }

  /**
   * Generate registration option
   * @param GenerateRegistrationDto The registration details
   * @param email The email of the user
   * @param res The response object
   * @returns Registration options
   */
  @Post('/passkey/generate-registration/:email')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Generate registration option',
    description: 'Generate registration options for a FIDO user.'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  async generateRegistrationOption(
    @Body() body: GenerateRegistrationDto,
    @Param('email') email: string,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const { deviceFlag } = body;
      const registrationOption = await this.fidoService.generateRegistrationOption(deviceFlag, email.toLowerCase());
      const finalResponse: IResponseType = {
        statusCode: HttpStatus.CREATED,
        message: ResponseMessages.fido.success.RegistrationOption,
        data: registrationOption.response
      };
      return res.status(HttpStatus.CREATED).json(finalResponse);
    } catch (error) {
      this.logger.error(`Error::${error}`);
      throw error;
    }
  }

  /**
   * Verify registration
   * @param verifyRegistrationDto The registration verification details
   * @param email The email of the user
   * @param res The response object
   * @returns Verification result
   */
  @Post('/passkey/verify-registration/:email')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Verify registration', description: 'Verify the registration of a FIDO user.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async verifyRegistration(
    @Request() req,
    @Body() verifyRegistrationDto: VerifyRegistrationDto,
    @Param('email') email: string,
    @Res() res: Response
  ): Promise<Response> {
    const verifyRegistration = await this.fidoService.verifyRegistration(verifyRegistrationDto, email.toLowerCase());
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.fido.success.verifyRegistration,
      data: verifyRegistration.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Generate authentication option
   * @param GenerateAuthenticationDto The authentication details
   * @param res The response object
   * @returns Authentication options
   */
  @Post('/passkey/authentication-options')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Generate authentication option',
    description: 'Generate authentication options for a FIDO user.'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  async generateAuthenticationOption(
    @Body() body: GenerateAuthenticationDto,
    @Request() req,
    @Res() res: Response
  ): Promise<Response> {
    const generateAuthentication = await this.fidoService.generateAuthenticationOption(body);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.fido.success.generateAuthenticationOption,
      data: generateAuthentication.response
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Verify authentication
   * @param verifyAuthenticationDto The authentication verification details
   * @param email The email of the user
   * @param res The response object
   * @returns Verification result
   */
  @Post('/passkey/verify-authentication/:email')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Verify authentication', description: 'Verify the authentication of a FIDO user.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async verifyAuthentication(
    @Request() req,
    @Body() verifyAuthenticationDto: VerifyAuthenticationDto,
    @Param('email') email: string,
    @Res() res: Response
  ): Promise<Response> {
    const verifyAuthentication = await this.fidoService.verifyAuthentication(
      verifyAuthenticationDto,
      email.toLowerCase()
    );
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.fido.success.login,
      data: verifyAuthentication.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Update fido user details
   * @param updateFidoUserDetailsDto The user details to be updated
   * @param credentialId The credential ID of the user
   * @param res The response object
   * @returns Updated user details
   */
  @Put('/passkey/user-details/:credentialId')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Update fido user details', description: 'Update the details of a FIDO user.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async updateFidoUser(
    @Request() req,
    @Body() updateFidoUserDetailsDto: UpdateFidoUserDetailsDto,
    @Param('credentialId') credentialId: string,
    @Res() res: Response
  ): Promise<Response> {
    const verifyRegistration = await this.fidoService.updateFidoUser(
      updateFidoUserDetailsDto,
      decodeURIComponent(credentialId)
    );
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.fido.success.updateUserDetails,
      data: verifyRegistration.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Update fido user device name
   * @param credentialId The credential ID of the user
   * @param deviceName The new device name
   * @param res The response object
   * @returns Updated device name
   */
  @Put('/passkey/:credentialId')
  @ApiBearerAuth()
  // TODO: Check if roles are required here?
  // @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.HOLDER, OrgRoles.ISSUER, OrgRoles.SUPER_ADMIN, OrgRoles.MEMBER)
  @ApiOperation({ summary: 'Update fido user device name', description: 'Update the device name of a FIDO user.' })
  @ApiQuery({ name: 'deviceName', required: true })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async updateFidoUserDeviceName(
    @Param('credentialId') credentialId: string,
    @Query('deviceName') deviceName: string,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const updateDeviceName = await this.fidoService.updateFidoUserDeviceName(credentialId, deviceName);
      const finalResponse: IResponseType = {
        statusCode: HttpStatus.OK,
        message: ResponseMessages.fido.success.updateDeviceName,
        data: updateDeviceName.response
      };
      return res.status(HttpStatus.OK).json(finalResponse);
    } catch (error) {
      this.logger.error(`Error::${error}`);
      throw error;
    }
  }

  /**
   * Delete fido user device
   * @param credentialId The credential ID of the user
   * @param res The response object
   * @returns Success message
   */
  @Delete('/passkey/:credentialId')
  @ApiBearerAuth()
  // TODO: Check if roles are required here?
  // @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.HOLDER, OrgRoles.ISSUER, OrgRoles.SUPER_ADMIN, OrgRoles.MEMBER)
  @ApiOperation({ summary: 'Delete fido user device', description: 'Delete a FIDO user device by its credential ID.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async deleteFidoUserDevice(@Param('credentialId') credentialId: string, @Res() res: Response): Promise<Response> {
    try {
      const deleteFidoUser = await this.fidoService.deleteFidoUserDevice(credentialId);
      const finalResponse: IResponseType = {
        statusCode: HttpStatus.OK,
        message: ResponseMessages.fido.success.deleteDevice,
        data: deleteFidoUser.response
      };
      return res.status(HttpStatus.OK).json(finalResponse);
    } catch (error) {
      this.logger.error(`Error::${error}`);
      throw error;
    }
  }
}
