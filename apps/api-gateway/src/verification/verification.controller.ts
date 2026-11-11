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
import {
  Controller,
  Logger,
  Post,
  Body,
  Get,
  Query,
  HttpStatus,
  Res,
  UseGuards,
  Param,
  UseFilters,
  BadRequestException,
  ParseUUIDPipe,
  Delete,
  Version
} from '@nestjs/common';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { SendProofRequestPayload, RequestProofDtoV1, RequestProofDtoV2 } from './dto/request-proof.dto';
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
import { User } from '../authz/decorators/user.decorator';
import { GetAllProofRequestsDto } from './dto/get-all-proof-requests.dto';
import { IProofRequestSearchCriteria } from './interfaces/verification.interface';
import { API_Version, ProofRequestType, SortFields } from './enum/verification.enum';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { user } from '@prisma/client';
import { TrimStringParamPipe } from '@credebl/common/cast.helper';
import { Validator } from '@credebl/common/validator';

@UseFilters(CustomExceptionFilter)
@Controller()
@ApiTags('verifications')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  private readonly logger = new Logger('VerificationController');

  /**
   * Get verified proof details
   * @param proofId The ID of the proof
   * @param orgId The ID of the organization
   * @returns Verified proof details
   */
  @Get('/orgs/:orgId/verified-proofs/:proofId')
  @ApiOperation({
    summary: 'Get verified proof details',
    description: 'Retrieve the details of a verified proof for a specific organization.'
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
   * @param proofId The ID of the proof
   * @param orgId The ID of the organization
   * @returns Proof presentation details by proofId
   */
  @Get('/orgs/:orgId/proofs/:proofId')
  @ApiOperation({
    summary: 'Get proof presentation by proof Id',
    description: 'Retrieve the details of a proof presentation by its proof ID for a specific organization.'
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
    @Param(
      'proofId',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.verification.error.invalidProofId);
        }
      })
    )
    proofId: string,
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string
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
   * Get proof presentation details by issuerId
   * @param proofId The ID of the proof
   * @param issuerId The ID of the issuer
   * @returns Proof presentation details by issuerId
   */
  @Get('/orgs/proofs')
  @ApiOperation({
    summary: 'Get verified proof presentation details by issuer Id',
    description: 'Retrieve the details of a proof presentation by its issuer Id'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getProofPresentationByIssuerId(
    @Res() res: Response,
    @User() user: IUserRequest,
    @Query('issuerId') issuerId: string
  ): Promise<Response> {
    const verifiedProofDetails = await this.verificationService.getPresentationDetailsByIssuerId(issuerId, user);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.verification.success.fetch,
      data: verifiedProofDetails
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Get all proof presentations
   * @param user The user making the request
   * @param orgId The ID of the organization
   * @returns All proof presentations details
   */
  @Get('/orgs/:orgId/proofs')
  @ApiOperation({
    summary: 'Get all proof presentations by orgId',
    description: 'Retrieve all proof presentations for a the organization. Supports pagination and sorting.'
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
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(`Invalid format for orgId`);
        }
      })
    )
    orgId: string
  ): Promise<Response> {
    const { pageSize, search, pageNumber, sortField, sortBy } = getAllProofRequests;
    const proofRequestsSearchCriteria: IProofRequestSearchCriteria = {
      pageNumber,
      search,
      pageSize,
      sortField,
      sortBy
    };

    const proofPresentationDetails = await this.verificationService.getProofPresentations(
      proofRequestsSearchCriteria,
      user,
      orgId
    );
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.verification.success.fetch,
      data: proofPresentationDetails
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Send proof request
   * @param orgId The ID of the organization
   * @returns Requested proof presentation details
   */
  @Post('/orgs/:orgId/proofs')
  @ApiOperation({
    summary: 'Sends a proof request',
    description: 'Send a proof request to a specific organization.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
  @ApiBody({ type: RequestProofDtoV1 })
  @ApiQuery({
    name: 'requestType',
    enum: ProofRequestType
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.VERIFIER)
  async sendPresentationRequest(
    @Res() res: Response,
    @User() user: IUserRequest,
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(`Invalid format for orgId`);
        }
      })
    )
    orgId: string,
    @Body() requestProof: RequestProofDtoV1,
    @Query('requestType') requestType: ProofRequestType = ProofRequestType.INDY
  ): Promise<Response> {
    if (requestType === ProofRequestType.INDY && !requestProof.proofFormats) {
      throw new BadRequestException(`type: ${requestType} requires proofFormats`);
    }

    if (requestType === ProofRequestType.PRESENTATIONEXCHANGE && !requestProof.presentationDefinition) {
      throw new BadRequestException(`type: ${requestType} requires presentationDefinition`);
    }

    if (requestType === ProofRequestType.INDY) {
      Validator.validateIndyProofAttributes(requestProof.proofFormats.indy.attributes);
    }
    const version = API_Version.version_neutral;
    requestProof.version = version;
    requestProof.orgId = orgId;
    requestProof.type = requestType;
    const proofData = await this.verificationService.sendProofRequest(requestProof, user);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.verification.success.send,
      data: proofData
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Send proof request v1
   * @param orgId The ID of the organization
   * @returns Requested proof presentation details
   */
  @Version('2')
  @Post('/orgs/:orgId/proofs')
  @ApiOperation({
    summary: 'Sends a proof request',
    description: 'Send a proof request on multiple connections for a the organization.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
  @ApiBody({ type: RequestProofDtoV2 })
  @ApiQuery({
    name: 'requestType',
    enum: ProofRequestType
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.VERIFIER)
  async sendPresentationRequestV1(
    @Res() res: Response,
    @User() user: IUserRequest,
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(`Invalid format for orgId`);
        }
      })
    )
    orgId: string,
    @Body() requestProof: RequestProofDtoV2,
    @Query('requestType') requestTypeV1: ProofRequestType = ProofRequestType.INDY
  ): Promise<Response> {
    if (requestTypeV1 === ProofRequestType.INDY && !requestProof.proofFormats) {
      throw new BadRequestException(`type: ${requestTypeV1} requires proofFormats`);
    }

    if (requestTypeV1 === ProofRequestType.PRESENTATIONEXCHANGE && !requestProof.presentationDefinition) {
      throw new BadRequestException(`type: ${requestTypeV1} requires presentationDefinition`);
    }

    if (requestTypeV1 === ProofRequestType.INDY) {
      Validator.validateIndyProofAttributes(requestProof.proofFormats.indy.attributes);
    }

    const version = API_Version.VERSION_1;
    requestProof.version = version;
    requestProof.orgId = orgId;
    requestProof.type = requestTypeV1;
    const proofData = await this.verificationService.sendProofRequest(requestProof, user);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.verification.success.send,
      data: proofData
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Verify proof presentation
   * @param proofId The ID of the proof
   * @param orgId The ID of the organization
   * @returns Verified proof presentation details
   */
  @Post('/orgs/:orgId/proofs/:proofId/verify')
  @ApiOperation({
    summary: 'Verify presentation',
    description: 'Verify the proof presentation for a the organization.'
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
    const verifyData = await this.verificationService.verifyPresentation(proofId, orgId, user);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.verification.success.verified,
      data: verifyData
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Out-Of-Band Proof Presentation
   * @param orgId The ID of the organization
   * @returns Out-of-band requested proof presentation details
   */
  @Post('/orgs/:orgId/proofs/oob')
  @ApiOperation({
    summary: 'Sends a out-of-band proof request',
    description: 'Send an out-of-band proof request for a specific organization.'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
  @ApiBody({ type: SendProofRequestPayload })
  @ApiQuery({
    name: 'requestType',
    enum: ProofRequestType
  })
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.VERIFIER)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async sendOutOfBandPresentationRequest(
    @Res() res: Response,
    @User() user: IUserRequest,
    @Body() outOfBandRequestProof: SendProofRequestPayload,
    @Param('orgId') orgId: string,
    @Query('requestType') requestType: ProofRequestType = ProofRequestType.INDY
  ): Promise<Response> {
    user.orgId = orgId;
    outOfBandRequestProof.type = requestType;
    const result = await this.verificationService.sendOutOfBandPresentationRequest(outOfBandRequestProof, user);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.verification.success.send,
      data: result
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Receive webhook proof presentation
   * @param orgId The ID of the organization
   * @returns Proof presentation details
   */
  @Post('wh/:orgId/proofs')
  @ApiOperation({
    summary: 'Receive webhook proof presentation',
    description: 'Handle proof presentations for a specified organization via a webhook.'
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
    proofPresentationPayload.type = 'Verification';

    if (orgId && 'default' === proofPresentationPayload.contextCorrelationId) {
      proofPresentationPayload.orgId = orgId;
    }

    const webhookProofPresentation = await this.verificationService
      .webhookProofPresentation(orgId, proofPresentationPayload)
      .catch((error) => {
        this.logger.debug(`error in saving verification webhook ::: ${JSON.stringify(error)}`);
      });
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.verification.success.create,
      data: webhookProofPresentation
    };

    const webhookUrl = await this.verificationService
      ._getWebhookUrl(proofPresentationPayload?.contextCorrelationId, orgId)
      .catch((error) => {
        this.logger.debug(`error in getting webhook url ::: ${JSON.stringify(error)}`);
      });

    if (webhookUrl) {
      await this.verificationService
        ._postWebhookResponse(webhookUrl, { data: proofPresentationPayload })
        .catch((error) => {
          this.logger.debug(`error in posting webhook response to webhook url ::: ${JSON.stringify(error)}`);
        });
    }
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Delete verification record
   * @param orgId The ID of the organization
   * @param user The user making the request
   * @param res The response object
   * @returns Success message
   */
  @Delete('/orgs/:orgId/verification-records')
  @ApiOperation({
    summary: 'Delete verification record',
    description:
      'Delete all verification records associated with a specific organization by its orgId. This operation is restricted to users with the OWNER role.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async deleteVerificationRecordsByOrgId(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    await this.verificationService.deleteVerificationRecords(orgId, user);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.verification.success.deleteVerificationRecord
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }
}
