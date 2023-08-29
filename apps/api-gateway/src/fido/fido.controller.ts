import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, Request, Res, UseFilters } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiForbiddenResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { BadRequestErrorDto } from '../dtos/bad-request-error.dto';
import { GenerateAuthenticationDto, GenerateRegistrationDto, UpdateFidoUserDetailsDto, VerifyRegistrationDto, VerifyAuthenticationDto } from '../dtos/fido-user.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { InternalServerErrorDto } from '../dtos/internal-server-error-res.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { FidoService } from './fido.service';
import { ResponseMessages } from '@credebl/common/response-messages';
import { HttpStatus } from '@nestjs/common';
import IResponseType from '@credebl/common/interfaces/response.interface';
import { Response } from 'express';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRoles } from 'libs/org-roles/enums';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';

@UseFilters(CustomExceptionFilter)
@Controller('fido')
@ApiTags('fido')
@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
@ApiBadRequestResponse({ status: 400, description: 'Bad Request', type: BadRequestErrorDto })
export class FidoController {
    private logger = new Logger('FidoController');
    constructor(private readonly fidoService: FidoService) { }
    /**
     *
     * @param GenerateRegistrationDto
     * @param res
     * @returns Generate registration response
     */
    @Post('/generate-registration-options')
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        type: InternalServerErrorDto
    })
    @ApiOperation({ summary: 'Generate registration option' })
    @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
    async generateRegistrationOption(@Body() body: GenerateRegistrationDto, @Res() res: Response): Promise<Response> {
        try {
            const { userName, deviceFlag } = body;
            const registrationOption = await this.fidoService.generateRegistrationOption(userName, deviceFlag);

            const finalResponse: IResponseType = {
                statusCode: HttpStatus.OK,
                message: ResponseMessages.fido.success.RegistrationOption,
                data: registrationOption.response
            };
            return res.status(HttpStatus.OK).json(finalResponse);
        } catch (error) {
            this.logger.error(`Error::${error}`);
            throw error;
        }
    }

    /**
   *
   * @param VerifyRegistrationDto
   * @param res
   * @returns User create success
   */
    @Post('/verify-registration/:userName')
    @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
    @ApiOperation({ summary: 'Verify registration' })
    async verifyRegistration(@Request() req, @Body() verifyRegistrationDto: VerifyRegistrationDto, @Param('userName') userName: string, @Res() res: Response): Promise<Response> {
        const verifyRegistration = await this.fidoService.verifyRegistration(verifyRegistrationDto, req.params.userName);
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.fido.success.verifyRegistration,
            data: verifyRegistration.response
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    /**
     *
     * @param updateFidoUserDetailsDto
     * @param res
     * @returns User update success
     */
    @Put('/user-update')
    @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
    @ApiOperation({ summary: 'Update fido user details' })
    async updateFidoUser(@Request() req, @Body() updateFidoUserDetailsDto: UpdateFidoUserDetailsDto, @Res() res: Response): Promise<Response> {
        const verifyRegistration = await this.fidoService.updateFidoUser(updateFidoUserDetailsDto);
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.fido.success.updateUserDetails,
            data: verifyRegistration.response
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    /**
     *
     * @param GenerateAuthenticationDto
     * @param res
     * @returns Generate authentication object
     */
    @Post('/generate-authentication-options')
    @ApiOperation({ summary: 'Generate authentication option' })
    @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
    async generateAuthenticationOption(@Body() body: GenerateAuthenticationDto, @Request() req, @Res() res: Response): Promise<Response> {

        const generateAuthentication = await this.fidoService.generateAuthenticationOption(body);
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.fido.success.generateAuthenticationOption,
            data: generateAuthentication.response
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    /**
   *
   * @param verifyAuthenticationDto
   * @param res
   * @returns Verify authentication object
   */
    @Post('/verify-authentication/:userName')
    @ApiOperation({ summary: 'Verify authentication' })
    async verifyAuthentication(@Request() req, @Body() verifyAuthenticationDto: VerifyAuthenticationDto, @Param('userName') userName: string, @Res() res: Response): Promise<Response> {
        const verifyAuthentication = await this.fidoService.verifyAuthentication(verifyAuthenticationDto, req.params.userName);

        const finalResponse: IResponseType = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.fido.success.login,
            data: verifyAuthentication.response
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    /**
   *
   * @param userName
   * @param res
   * @returns User get success
   */
    @Get('/user-details/:userName')
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.HOLDER, OrgRoles.ISSUER, OrgRoles.SUPER_ADMIN, OrgRoles.SUPER_ADMIN, OrgRoles.MEMBER)
    @ApiBearerAuth()
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        type: InternalServerErrorDto
    })

    @ApiOperation({ summary: 'Fetch fido user details' })
    @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
    @ApiBadRequestResponse({ status: 400, description: 'Bad Request', type: BadRequestErrorDto })
    async fetchFidoUserDetails(@Request() req, @Param('userName') userName: string, @Res() res: Response): Promise<Response> {
        try {
            const fidoUserDetails = await this.fidoService.fetchFidoUserDetails(req.params.userName);
            const finalResponse: IResponseType = {
                statusCode: HttpStatus.OK,
                message: ResponseMessages.user.success.login,
                data: fidoUserDetails.response
            };
            return res.status(HttpStatus.OK).json(finalResponse);

        } catch (error) {
            this.logger.error(`Error::${error}`);
            throw error;
        }
    }

    @Delete('/device')
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.HOLDER, OrgRoles.ISSUER, OrgRoles.SUPER_ADMIN, OrgRoles.SUPER_ADMIN, OrgRoles.MEMBER)
    @ApiBearerAuth()
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        type: InternalServerErrorDto
    })
    @ApiQuery(
        { name: 'credentialId', required: true }
    )
    @ApiOperation({ summary: 'Delete fido user device' })
    @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
    async deleteFidoUserDevice(@Query('credentialId') credentialId: string, @Res() res: Response): Promise<Response> {
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

    @Put('/device-name')
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.HOLDER, OrgRoles.ISSUER, OrgRoles.SUPER_ADMIN, OrgRoles.SUPER_ADMIN, OrgRoles.MEMBER)
    @ApiBearerAuth()
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        type: InternalServerErrorDto
    })
    @ApiQuery(
        { name: 'credentialId', required: true }
    )
    @ApiQuery(
        { name: 'deviceName', required: true }
    )
    @ApiOperation({ summary: 'Update fido user device name' })
    @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
    async updateFidoUserDeviceName(@Query('credentialId') credentialId: string, @Query('deviceName') deviceName: string, @Res() res: Response): Promise<Response> {
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

}
