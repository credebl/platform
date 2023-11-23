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
import { Controller, Logger, Post, Body, Get, Query, HttpStatus, Res, UseGuards, Param, UseFilters, BadRequestException } from '@nestjs/common';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { OutOfBandRequestProof, RequestProof } from './dto/request-proof.dto';
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
import { ImageServiceService } from '@credebl/image-service';
import { User } from '../authz/decorators/user.decorator';

@UseFilters(CustomExceptionFilter)
@Controller()
@ApiTags('verifications')
export class VerificationController {
    constructor(
        private readonly verificationService: VerificationService,
        private readonly imageServiceService: ImageServiceService
    ) { }

    private readonly logger = new Logger('VerificationController');

    @Get('/verification/oob/qr')
    @ApiOperation({ summary: 'Out-Of-Band issuance QR', description: 'Out-Of-Band issuance QR' })
    @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
    @ApiExcludeEndpoint()
    @ApiQuery(
        { name: 'base64Image', required: true }
      )
    async getOgPofile(@Query('base64Image') base64Image: string, @Res() res: Response): Promise<Response> {

        const getImageBuffer = await this.imageServiceService.getBase64Image(base64Image);
        res.setHeader('Content-Type', 'image/png');
        return res.send(getImageBuffer);
    }

    @Get('/orgs/:orgId/proofs/:proofId/form')
    @ApiOperation({
        summary: `Get a proof form data`,
        description: `Get a proof form data`
    })
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER, OrgRoles.HOLDER)
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
    async getProofFormData(
        @Res() res: Response,
        @User() user: IUserRequest,
        @Param('proofId') id: string,
        @Param('orgId') orgId: string
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
     * Get proof presentation by id
     * @param user 
     * @param id 
     * @param orgId 
     * @returns Get proof presentation details
     */
    @Get('/orgs/:orgId/proofs/:proofId')
    @ApiOperation({
        summary: `Get all proof presentation by proof Id`,
        description: `Get all proof presentation by proof Id`
    })
    @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER, OrgRoles.HOLDER)
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    @ApiBearerAuth()
    async getProofPresentationById(
        @Res() res: Response,
        @User() user: IUserRequest,
        @Param('proofId') id: string,
        @Param('orgId') orgId: string
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
    * Get all proof presentations
    * @param user 
    * @param orgId 
    * @returns Get all proof presentation
    */
    @Get('/orgs/:orgId/proofs')
    @ApiOperation({
        summary: `Get all proof presentations`,
        description: `Get all proof presentations`
    })
    @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
    @ApiQuery(
        { name: 'threadId', required: false }
    )
    @ApiBearerAuth()
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER, OrgRoles.HOLDER)
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    async getProofPresentations(
        @Res() res: Response,
        @User() user: IUserRequest,
        @Param('orgId') orgId: string,
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
     * Request proof presentation
     * @param user 
     * @param requestProof 
     * @returns Get requested proof presentation details
     */
    @Post('/orgs/:orgId/proofs')
    @ApiOperation({
        summary: `Sends a proof request`,
        description: `Sends a proof request`
    })
    @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
    @ApiBody({ type: RequestProof })
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.VERIFIER)
    async sendPresentationRequest(
        @Res() res: Response,
        @User() user: IUserRequest,
        @Param('orgId') orgId: string,
        @Body() requestProof: RequestProof
    ): Promise<object> {

        for (const attrData of requestProof.attributes) {
            await this.validateAttribute(attrData);
        }

        requestProof.orgId = orgId;
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
    @Post('/orgs/:orgId/proofs/:proofId/verify')
    @ApiOperation({
        summary: `Verify presentation`,
        description: `Verify presentation`
    })
    @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.VERIFIER)
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    async verifyPresentation(
        @Res() res: Response,
        @User() user: IUserRequest,
        @Param('proofId') id: string,
        @Param('orgId') orgId: string
    ): Promise<object> {
        const verifyPresentation = await this.verificationService.verifyPresentation(id, orgId, user);
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.verification.success.verified,
            data: verifyPresentation.response
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }

    /**
     * Out-Of-Band Proof Presentation
     * @param user 
     * @param outOfBandRequestProof 
     * @returns Get out-of-band requested proof presentation details
     */
    @Post('/orgs/:orgId/proofs/oob')
    @ApiOperation({
        summary: `Sends a out-of-band proof request`,
        description: `Sends a out-of-band proof request`
    })
    @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
    @ApiBody({ type: OutOfBandRequestProof })
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.VERIFIER)
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    async sendOutOfBandPresentationRequest(
        @Res() res: Response,
        @User() user: IUserRequest,
        @Body() outOfBandRequestProof: OutOfBandRequestProof,
        @Param('orgId') orgId: string
    ): Promise<object> {

        for (const attrData of outOfBandRequestProof.attributes) {
            await this.validateAttribute(attrData);
        }

        outOfBandRequestProof.orgId = orgId;
        const sendProofRequest = await this.verificationService.sendOutOfBandPresentationRequest(outOfBandRequestProof, user);
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.verification.success.fetch,
            data: sendProofRequest.response
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }

    @Post('wh/:id/proofs')
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
        this.logger.debug(`proofPresentationPayload ::: ${JSON.stringify(proofPresentationPayload)}`);
        const webhookProofPresentation = await this.verificationService.webhookProofPresentation(id, proofPresentationPayload);
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.verification.success.fetch,
            data: webhookProofPresentation.response
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }

    async validateAttribute(
        attrData: object
    ): Promise<void> {

        if (!attrData['attributeName']) {
            throw new BadRequestException('attributeName must be required');
        } else if (!attrData['schemaId']) {
            throw new BadRequestException('schemaId must be required');
        }

        if (undefined !== attrData['credDefId'] && '' === attrData['credDefId'].trim()) {
            throw new BadRequestException('credDefId cannot be empty');
        }

        if (undefined !== attrData['condition'] && '' === attrData['condition'].trim()) {
            throw new BadRequestException('condition cannot be empty');
        }

        if (undefined !== attrData['value'] && '' === attrData['value'].trim()) {
            throw new BadRequestException('value cannot be empty');
        }
    }
}

