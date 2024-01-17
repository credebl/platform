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
import { OutOfBandRequestProof, RequestProofDto } from './dto/request-proof.dto';
import { VerificationService } from './verification.service';
import IResponseType, { IResponse } from '@credebl/common/interfaces/response.interface';
import { Response } from 'express';
import { ResponseMessages } from '@credebl/common/response-messages';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRoles } from 'libs/org-roles/enums';
import { AuthGuard } from '@nestjs/passport';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { WebhookPresentationProofDto } from './dto/webhook-proof.dto';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { ImageServiceService } from '@credebl/image-service';
import { User } from '../authz/decorators/user.decorator';
import { GetAllProofRequestsDto } from './dto/get-all-proof-requests.dto';
import { IProofRequestSearchCriteria } from './interfaces/verification.interface';
import { SortFields } from './enum/verification.enum';

@UseFilters(CustomExceptionFilter)
@Controller()
@ApiTags('verifications')
export class VerificationController {
    constructor(
        private readonly verificationService: VerificationService,
        private readonly imageServiceService: ImageServiceService
    ) { }

    private readonly logger = new Logger('VerificationController');

    /**
     * 
     * @param proofId 
     * @param orgId 
     * @returns Verified proof details
     */
    @Get('/orgs/:orgId/verified-proofs/:proofId')
    @ApiOperation({
        summary: `Get verified proof details`,
        description: `Get verified proof details`
    })
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER, OrgRoles.HOLDER)
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    @ApiBearerAuth()
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
    async getVerifiedProofDetails(
        @Res() res: Response,
        @User() user: IUserRequest,
        @Param('proofId') proofId: string,
        @Param('orgId') orgId: string
    ): Promise<Response> {
        const sendProofRequest = await this.verificationService.getVerifiedProofDetails(proofId, orgId, user);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.verification.success.verifiedProofDetails,
            data: sendProofRequest
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    /**
     * Get proof presentation details by proofId
     * @param proofId 
     * @param orgId 
     * @returns Proof presentation details by proofId
     */
    @Get('/orgs/:orgId/proofs/:proofId')
    @ApiOperation({
        summary: `Get proof presentation by proof Id`,
        description: `Get proof presentation by proof Id`
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER, OrgRoles.HOLDER)
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    @ApiBearerAuth()
    async getProofPresentationById(
        @Res() res: Response,
        @User() user: IUserRequest,
        @Param('proofId') proofId: string,
        @Param('orgId') orgId: string
    ): Promise<Response> {
        const getProofPresentationById = await this.verificationService.getProofPresentationById(proofId, orgId, user);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.verification.success.fetch,
            data: getProofPresentationById
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    /**
    * Get all proof presentations
    * @param user 
    * @param orgId 
    * @returns All proof presentations details
    */
    @Get('/orgs/:orgId/proofs')
    @ApiOperation({
        summary: `Get all proof presentations by orgId`,
        description: `Get all proof presentations by orgId`
    })
    @ApiQuery({
        name: 'sortField',
        enum: SortFields,
        required: false
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
    @ApiBearerAuth()
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER, OrgRoles.HOLDER)
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    async getProofPresentations(
        @Query() getAllProofRequests: GetAllProofRequestsDto,
        @Res() res: Response,
        @User() user: IUserRequest,
        @Param('orgId') orgId: string
    ): Promise<Response> {
        const { pageSize, searchByText, pageNumber, sortField, sortBy } = getAllProofRequests;
        const proofRequestsSearchCriteria: IProofRequestSearchCriteria = {
            pageNumber,
            searchByText,
            pageSize,
            sortField,
            sortBy
        };

        const proofPresentationDetails = await this.verificationService.getProofPresentations(proofRequestsSearchCriteria, user, orgId);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.verification.success.fetch,
            data: proofPresentationDetails
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    /**
     * Send proof request
     * @param orgId
     * @returns Requested proof presentation details
     */
    @Post('/orgs/:orgId/proofs')
    @ApiOperation({
        summary: `Sends a proof request`,
        description: `Sends a proof request`
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
    @ApiBody({ type: RequestProofDto })
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.VERIFIER)
    async sendPresentationRequest(
        @Res() res: Response,
        @User() user: IUserRequest,
        @Param('orgId') orgId: string,
        @Body() requestProof: RequestProofDto
    ): Promise<Response> {

        for (const attrData of requestProof.attributes) {
            await this.validateAttribute(attrData);
        }

        requestProof.orgId = orgId;
        await this.verificationService.sendProofRequest(requestProof, user);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.verification.success.send
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }

    /**
     * Verify proof presentation
     * @param proofId 
     * @param orgId 
     * @returns Verified proof presentation details
     */
    @Post('/orgs/:orgId/proofs/:proofId/verify')
    @ApiOperation({
        summary: `Verify presentation`,
        description: `Verify presentation`
    })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.VERIFIER)
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    async verifyPresentation(
        @Res() res: Response,
        @User() user: IUserRequest,
        @Param('proofId') proofId: string,
        @Param('orgId') orgId: string
    ): Promise<Response> {
        await this.verificationService.verifyPresentation(proofId, orgId, user);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.verification.success.verified
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }

    /**
     * Out-Of-Band Proof Presentation
     * @param orgId 
     * @returns Out-of-band requested proof presentation details
     */
    @Post('/orgs/:orgId/proofs/oob')
    @ApiOperation({
        summary: `Sends a out-of-band proof request`,
        description: `Sends a out-of-band proof request`
    })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
    @ApiBody({ type: OutOfBandRequestProof })
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.VERIFIER)
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    async sendOutOfBandPresentationRequest(
        @Res() res: Response,
        @User() user: IUserRequest,
        @Body() outOfBandRequestProof: OutOfBandRequestProof,
        @Param('orgId') orgId: string
    ): Promise<Response> {

        for (const attrData of outOfBandRequestProof.attributes) {
            await this.validateAttribute(attrData);
        }

        outOfBandRequestProof.orgId = orgId;
        await this.verificationService.sendOutOfBandPresentationRequest(outOfBandRequestProof, user);
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.verification.success.send
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }

    /**
     * 
     * @param orgId 
     * @returns Proof presentation details
     */
    @Post('wh/:orgId/proofs')
    @ApiOperation({
        summary: `Receive webhook proof presentation`,
        description: `Handle proof presentations for a specified organization via a webhook`
    })
    @ApiExcludeEndpoint()
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
    @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
    @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
    async webhookProofPresentation(
        @Param('orgId') orgId: string,
        @Body() proofPresentationPayload: WebhookPresentationProofDto,
        @Res() res: Response
    ): Promise<Response> {
        this.logger.debug(`proofPresentationPayload ::: ${JSON.stringify(proofPresentationPayload)}`);
        //     const  webhookUrl = await this.verificationService._getWebhookUrl(proofPresentationPayload.contextCorrelationId);
        // if (webhookUrl) {
        //     try {
        //         await this.verificationService._postWebhookResponse(webhookUrl, {data:proofPresentationPayload});
        //   } catch (error) {
        //       throw new RpcException(error.response ? error.response : error);
        //   }
        const webhookProofPresentation = await this.verificationService.webhookProofPresentation(orgId, proofPresentationPayload);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.verification.success.create,
            data: webhookProofPresentation
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

        if (undefined !== attrData['schemaId'] && '' === attrData['schemaId'].trim()) {
            throw new BadRequestException('schemaId cannot be empty');
        }

        if (!attrData['credDefId']) {
            throw new BadRequestException('credDefId must be required');
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

        if (attrData['condition']) {
            if (isNaN(attrData['value'])) {
                throw new BadRequestException('value must be an integer');
            }
        }
    }
}

