import { Body, Controller, Delete, Get, HttpStatus, Logger, Param, Post, Put, Query, Request, Res, UseFilters } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiExcludeEndpoint, ApiForbiddenResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { BadRequestErrorDto } from '../dtos/bad-request-error.dto';
import { GenerateAuthenticationDto, GenerateRegistrationDto, UpdateFidoUserDetailsDto, VerifyRegistrationDto, VerifyAuthenticationDto } from '../dtos/fido-user.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { InternalServerErrorDto } from '../dtos/internal-server-error-res.dto';
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
@ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
@ApiBadRequestResponse({ status: 400, description: 'Bad Request', type: BadRequestErrorDto })
export class FidoController {
    private logger = new Logger('FidoController');
    constructor(private readonly fidoService: FidoService) { }

    /**
     *
     * @param userName
     * @param res
     * @returns User get success
     */
    @Get('/passkey/:email')
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.HOLDER, OrgRoles.ISSUER, OrgRoles.SUPER_ADMIN, OrgRoles.SUPER_ADMIN, OrgRoles.MEMBER)
    @ApiBearerAuth()
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        type: InternalServerErrorDto
    })

    @ApiOperation({ summary: 'Fetch fido user details' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
    @ApiBadRequestResponse({ status: 400, description: 'Bad Request', type: BadRequestErrorDto })
    async fetchFidoUserDetails(@Request() req, @Param('email') email: string, @Res() res: Response): Promise<Response> {
        try {
            const fidoUserDetails = await this.fidoService.fetchFidoUserDetails(req.params.email.toLowerCase());
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
     *
     * @param GenerateRegistrationDto
     * @param res
     * @returns Generate registration response
     */
    @Post('/passkey/generate-registration/:email')
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
    @ApiOperation({ summary: 'Generate registration option' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
    async generateRegistrationOption(@Body() body: GenerateRegistrationDto, @Param('email') email: string, @Res() res: Response): Promise<Response> {
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
        }
    }


 /**
   *
   * @param VerifyRegistrationDto
   * @param res
   * @returns User create success
   */
    @Post('/passkey/verify-registration/:email')
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    @ApiOperation({ summary: 'Verify registration' })
    async verifyRegistration(@Request() req, @Body() verifyRegistrationDto: VerifyRegistrationDto, @Param('email') email: string, @Res() res: Response): Promise<Response> {
        const verifyRegistration = await this.fidoService.verifyRegistration(verifyRegistrationDto, req.params.email.toLowerCase());
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.fido.success.verifyRegistration,
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
    @Post('/passkey/authentication-options')
    @ApiOperation({ summary: 'Generate authentication option' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
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
    @Post('/passkey/verify-authentication/:email')
    @ApiOperation({ summary: 'Verify authentication' })
    async verifyAuthentication(@Request() req, @Body() verifyAuthenticationDto: VerifyAuthenticationDto, @Param('email') email: string, @Res() res: Response): Promise<Response> {
        const verifyAuthentication = await this.fidoService.verifyAuthentication(verifyAuthenticationDto, req.params.email.toLowerCase());
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.fido.success.login,
            data: verifyAuthentication.response
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

/**
 *
 * @param updateFidoUserDetailsDto
 * @param res
 * @returns User update success
 */
    @Put('/passkey/user-details/:credentialId')
    @ApiExcludeEndpoint()
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    @ApiOperation({ summary: 'Update fido user details' })
    async updateFidoUser(@Request() req, @Body() updateFidoUserDetailsDto: UpdateFidoUserDetailsDto, @Param('credentialId') credentialId: string, @Res() res: Response): Promise<Response> {
        const verifyRegistration = await this.fidoService.updateFidoUser(updateFidoUserDetailsDto, decodeURIComponent(credentialId));
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.fido.success.updateUserDetails,
            data: verifyRegistration.response
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }
    

    @Put('/passkey/:credentialId')
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.HOLDER, OrgRoles.ISSUER, OrgRoles.SUPER_ADMIN, OrgRoles.SUPER_ADMIN, OrgRoles.MEMBER)
    @ApiBearerAuth()
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        type: InternalServerErrorDto
    })
    @ApiQuery(
        { name: 'deviceName', required: true }
    )
    @ApiOperation({ summary: 'Update fido user device name' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
    async updateFidoUserDeviceName(@Param('credentialId') credentialId: string, @Query('deviceName') deviceName: string, @Res() res: Response): Promise<Response> {
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

    @Delete('/passkey/:credentialId')
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
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
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
