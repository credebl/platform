/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
import {
    ApiBearerAuth,
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiBody,
    ApiQuery,
    ApiExcludeEndpoint
} from '@nestjs/swagger';
import { Controller, Logger, Post, Body, Get, Query, HttpStatus, Res, UseGuards, Param, UseFilters } from '@nestjs/common';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { OutOfBandRequestProof, RequestProof } from './dto/request-proof.dto';
import { GetUser } from '../authz/decorators/get-user.decorator';
import { VerificationService } from './verification.service';
import IResponseType from '@credebl/common/interfaces/response.interface';
import { Response } from 'express';
import { ResponseMessages } from '@credebl/common/response-messages';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRoles } from 'libs/org-roles/enums';
import { AuthGuard } from '@nestjs/passport';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { WebhookPresentationProof } from './dto/webhook-proof.dto';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';

@UseFilters(CustomExceptionFilter)
@ApiBearerAuth()
@Controller()
export class VerificationController {
    constructor(private readonly verificationService: VerificationService) { }

    private readonly logger = new Logger('VerificationController');

    @Get('/proofs/form-data')
    @ApiTags('verifications')
    @ApiOperation({
        summary: `Get a proof form data`,
        description: `Get a proof form data`
    })
    @ApiQuery(
        { name: 'id', required: true }
    )
    @ApiQuery(
        { name: 'orgId', required: true }
    )
    @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.VERIFIER)
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    async getProofFormData(
        @Res() res: Response,
        @GetUser() user: IUserRequest,
        @Query('id') id: string,
        @Query('orgId') orgId: number
    ): Promise<object> {
        const sendProofRequest = await this.verificationService.getProofFormData(id, orgId, user);
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.verification.success.proofFormData,
            data: sendProofRequest.response
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    /**
     * Get all proof presentations
     * @param user 
     * @param orgId 
     * @returns Get all proof presentation
     */
    @Get('/proofs')
    @ApiTags('verifications')
    @ApiOperation({
        summary: `Get all proof-presentation`,
        description: `Get all proof-presentation`
    })
    @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
    @ApiQuery(
        { name: 'orgId', required: true }
    )
    @ApiQuery(
        { name: 'threadId', required: false }
    )
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.VERIFIER)
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    async getProofPresentations(
        @Res() res: Response,
        @GetUser() user: IUserRequest,
        @Query('orgId') orgId: number,
        @Query('threadId') threadId: string
    ): Promise<object> {
        const proofPresentationDetails = await this.verificationService.getProofPresentations(orgId, threadId, user);
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.verification.success.fetch,
            data: proofPresentationDetails.response
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    /**
     * Get proof presentation by id
     * @param user 
     * @param id 
     * @param orgId 
     * @returns Get proof presentation details
     */
    @Get('/proofs/:id')
    @ApiTags('verifications')
    @ApiOperation({
        summary: `Get proof-presentation by Id`,
        description: `Get proof-presentation by Id`
    })
    @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
    @ApiQuery(
        { name: 'orgId', required: true }
    )
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.VERIFIER)
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    async getProofPresentationById(
        @Res() res: Response,
        @GetUser() user: IUserRequest,
        @Param('id') id: string,
        @Query('orgId') orgId: number
    ): Promise<object> {
        const getProofPresentationById = await this.verificationService.getProofPresentationById(id, orgId, user);
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.verification.success.fetch,
            data: getProofPresentationById.response
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    /**
     * Request proof presentation
     * @param user 
     * @param requestProof 
     * @returns Get requested proof presentation details
     */
    @Post('/proofs/request-proof')
    @ApiTags('verifications')
    @ApiOperation({
        summary: `Sends a proof request`,
        description: `Sends a proof request`
    })
    @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
    @ApiBody({ type: RequestProof })
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.VERIFIER)
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    async sendPresentationRequest(
        @Res() res: Response,
        @GetUser() user: IUserRequest,
        @Body() requestProof: RequestProof
    ): Promise<object> {
        const sendProofRequest = await this.verificationService.sendProofRequest(requestProof, user);
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.verification.success.send,
            data: sendProofRequest.response
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }

    /**
     * Verify proof presentation
     * @param user 
     * @param id 
     * @param orgId 
     * @returns Get verified proof presentation details
     */
    @Post('proofs/verify-presentation')
    @ApiTags('verifications')
    @ApiOperation({
        summary: `Verify presentation`,
        description: `Verify presentation`
    })
    @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
    @ApiQuery(
        { name: 'id', required: true }
    )
    @ApiQuery(
        { name: 'orgId', required: true }
    )
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.VERIFIER)
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    async verifyPresentation(
        @Res() res: Response,
        @GetUser() user: IUserRequest,
        @Query('id') id: string,
        @Query('orgId') orgId: number
    ): Promise<object> {
        const verifyPresentation = await this.verificationService.verifyPresentation(id, orgId, user);
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.verification.success.verified,
            data: verifyPresentation.response
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }

    @Post('wh/:id/proofs')
    @ApiTags('verifications')
    @ApiOperation({
        summary: `Webhook proof presentation`,
        description: `Webhook proof presentation`
    })
    @ApiExcludeEndpoint()
    @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
    async webhookProofPresentation(
        @Param('id') id: string,
        @Body() proofPresentationPayload: WebhookPresentationProof,
        @Res() res: Response
    ): Promise<object> {

        const webhookProofPresentation = await this.verificationService.webhookProofPresentation(id, proofPresentationPayload);
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.verification.success.fetch,
            data: webhookProofPresentation.response
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }

    /**
     * Out-Of-Band Proof Presentation
     * @param user 
     * @param outOfBandRequestProof 
     * @returns Get out-of-band requested proof presentation details
     */
    @Post('/proofs/create-request-oob')
    @ApiTags('verifications')
    @ApiOperation({
        summary: `Sends a out-of-band proof request`,
        description: `Sends a out-of-band proof request`
    })
    @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
    @ApiBody({ type: OutOfBandRequestProof })
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.VERIFIER)
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    async sendOutOfBandPresentationRequest(
        @Res() res: Response,
        @GetUser() user: IUserRequest,
        @Body() outOfBandRequestProof: OutOfBandRequestProof
    ): Promise<object> {
        const sendProofRequest = await this.verificationService.sendOutOfBandPresentationRequest(outOfBandRequestProof, user);
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.verification.success.fetch,
            data: sendProofRequest.response
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }
}

