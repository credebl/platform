/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import {
  Controller,
  Post,
  Body,
  Logger,
  UseGuards,
  BadRequestException,
  HttpStatus,
  Res,
  Query,
  Get,
  Param,
  UseFilters,
  Header,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiQuery,
  ApiExcludeEndpoint,
  ApiConsumes,
  ApiBody
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { Response } from 'express';
import IResponseType, { IResponse } from '@credebl/common/interfaces/response.interface';
import { IssuanceService } from './issuance.service';
import {
  ClientDetails,
  FileParameter,
  IssuanceDto,
  IssueCredentialDto,
  OOBCredentialDtoWithEmail,
  OOBIssueCredentialDto,
  PreviewFileDetails
} from './dtos/issuance.dto';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { User } from '../authz/decorators/user.decorator';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRoles } from 'libs/org-roles/enums';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { FileExportResponse, IIssuedCredentialSearchParams, RequestPayload } from './interfaces';
import { AwsService } from '@credebl/aws';
import { FileInterceptor } from '@nestjs/platform-express';
import { v4 as uuidv4 } from 'uuid';
import { RpcException } from '@nestjs/microservices';
/* eslint-disable @typescript-eslint/no-unused-vars */
import { user } from '@prisma/client';
import { IGetAllIssuedCredentialsDto } from './dtos/get-all-issued-credentials.dto';

@Controller()
@UseFilters(CustomExceptionFilter)
@ApiTags('credentials')
@ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
export class IssuanceController {
  constructor(
    private readonly issueCredentialService: IssuanceService,
    private readonly awsService: AwsService
  ) {}
  private readonly logger = new Logger('IssuanceController');

  /**
   * @param orgId
   * @returns List of issued credentials for a specific organization
   */

  @Get('/orgs/:orgId/credentials')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: `Get all issued credentials for a specific organization`,
    description: `Get all issued credentials for a specific organization`
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER, OrgRoles.HOLDER)
  async getIssueCredentials(
    @Query() getAllIssuedCredentials: IGetAllIssuedCredentialsDto,
    @User() user: IUserRequest,
    @Param('orgId') orgId: string,
    @Res() res: Response
  ): Promise<Response> {
    const { pageSize, searchByText, pageNumber, sortField, sortBy } = getAllIssuedCredentials;
    const issuedCredentialsSearchCriteria: IIssuedCredentialSearchParams = {
      pageNumber,
      searchByText,
      pageSize,
      sortField,
      sortBy
    };

    const getCredentialDetails = await this.issueCredentialService.getIssueCredentials(
      issuedCredentialsSearchCriteria,
      user,
      orgId
    );

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.issuance.success.fetch,
      data: getCredentialDetails
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * @param credentialRecordId
   * @param orgId
   * @returns Details of specific credential
   */

  @Get('/orgs/:orgId/credentials/:credentialRecordId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: `Fetch credentials by credentialRecordId`,
    description: `Fetch credentials credentialRecordId`
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER, OrgRoles.HOLDER)
  async getIssueCredentialsbyCredentialRecordId(
    @User() user: IUserRequest,
    @Param('credentialRecordId') credentialRecordId: string,
    @Param('orgId') orgId: string,
    @Res() res: Response
  ): Promise<Response> {
    const getCredentialDetails = await this.issueCredentialService.getIssueCredentialsbyCredentialRecordId(
      user,
      credentialRecordId,
      orgId
    );

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.issuance.success.fetch,
      data: getCredentialDetails.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('/orgs/:orgId/:credentialDefinitionId/download')
  @ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
  @Header('Content-Disposition', 'attachment; filename="schema.csv"')
  @Header('Content-Type', 'application/csv')
  @ApiOperation({
    summary: 'Download csv template for bulk-issuance',
    description: 'Download csv template for bulk-issuance'
  })
  async downloadBulkIssuanceCSVTemplate(
    @Param('credentialDefinitionId') credentialDefinitionId: string,
    @Param('orgId') orgId: string,
    @Res() res: Response
  ): Promise<object> {
    try {
      const exportedData: FileExportResponse = await this.issueCredentialService.exportSchemaToCSV(
        credentialDefinitionId
      );
      return res
        .header('Content-Disposition', `attachment; filename="${exportedData.fileName}.csv"`)
        .status(HttpStatus.OK)
        .send(exportedData.fileContent);
    } catch (error) { }
  }

  @Post('/orgs/:orgId/bulk/upload')
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload file for bulk issuance',
    description: 'Upload file for bulk issuance.'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto
  })
  @ApiForbiddenResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden',
    type: ForbiddenErrorDto
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      nullable: false,
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary'
        }
      }
    },
    required: true
  })
  @UseInterceptors(FileInterceptor('file'))
  async importAndPreviewDataForIssuance(
    @Query('credDefId') credentialDefinitionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() fileDetails: object,
    @Param('orgId') orgId: string,
    @Res() res: Response
  ): Promise<object> {
    try {
      if (file) {
        const fileKey: string = uuidv4();
        try {
          await this.awsService.uploadCsvFile(fileKey, file?.buffer);
        } catch (error) {
          throw new RpcException(error.response ? error.response : error);
        }

        const reqPayload: RequestPayload = {
          credDefId: credentialDefinitionId,
          fileKey,
          fileName: fileDetails['fileName'].split('.csv')[0]
        };

        const importCsvDetails = await this.issueCredentialService.importCsv(reqPayload);
        const finalResponse: IResponseType = {
          statusCode: HttpStatus.CREATED,
          message: ResponseMessages.issuance.success.importCSV,
          data: importCsvDetails.response
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
      }
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  @Get('/orgs/:orgId/:requestId/preview')
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto
  })
  @ApiForbiddenResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden',
    type: ForbiddenErrorDto
  })
  @ApiOperation({
    summary: 'file-preview',
    description: 'file-preview'
  })
  @ApiQuery({
    name: 'pageNumber',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'sortBy',
    type: String,
    required: false
  })
  @ApiQuery({
    name: 'sortValue',
    type: Number,
    required: false
  })
  async previewFileDataForIssuance(
    @Param('requestId') requestId: string,
    @Param('orgId') orgId: string,
    @Query() previewFileDetails: PreviewFileDetails,
    @Res() res: Response
  ): Promise<object> {
    const perviewCSVDetails = await this.issueCredentialService.previewCSVDetails(requestId, orgId, previewFileDetails);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.issuance.success.previewCSV,
      data: perviewCSVDetails
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Post('/orgs/:orgId/:requestId/bulk')
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto
  })
  @ApiForbiddenResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden',
    type: ForbiddenErrorDto
  })
  @ApiOperation({
    summary: 'bulk issue credential',
    description: 'bulk issue credential'
  })
  async issueBulkCredentials(
    @Param('requestId') requestId: string,
    @Param('orgId') orgId: string,
    @Res() res: Response,
    @Body() clientDetails: ClientDetails,
    @User() user: user
  ): Promise<Response> {
    clientDetails.userId = user.id;
    const bulkIssunaceDetails = await this.issueCredentialService.issueBulkCredential(requestId, orgId, clientDetails);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.issuance.success.bulkIssuance,
      data: bulkIssunaceDetails.response
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Get('/orgs/:orgId/bulk/files')
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto
  })
  @ApiForbiddenResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden',
    type: ForbiddenErrorDto
  })
  @ApiOperation({
    summary: 'Get the file list for bulk operation',
    description: 'Get all the file list for organization for bulk operation'
  })
  @ApiQuery({
    name: 'pageNumber',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'sortBy',
    type: String,
    required: false
  })
  @ApiQuery({
    name: 'sortValue',
    type: Number,
    required: false
  })
  async issuedFileDetails(
    @Param('orgId') orgId: string,
    @Query() fileParameter: FileParameter,
    @Res() res: Response
  ): Promise<object> {
    const issuedFileDetails = await this.issueCredentialService.issuedFileDetails(orgId, fileParameter);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.issuance.success.previewCSV,
      data: issuedFileDetails.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('/orgs/:orgId/:fileId/bulk/file-data')
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto
  })
  @ApiForbiddenResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden',
    type: ForbiddenErrorDto
  })
  @ApiOperation({
    summary: 'Get the file data',
    description: 'Get the file data by file id'
  })
  @ApiQuery({
    name: 'pageNumber',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'sortBy',
    type: String,
    required: false
  })
  @ApiQuery({
    name: 'sortValue',
    type: Number,
    required: false
  })
  async getFileDetailsByFileId(
    @Param('orgId') orgId: string,
    @Param('fileId') fileId: string,
    @Query() fileParameter: FileParameter,
    @Res() res: Response
  ): Promise<object> {
    const issuedFileDetails = await this.issueCredentialService.getFileDetailsByFileId(orgId, fileId, fileParameter);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.issuance.success.previewCSV,
      data: issuedFileDetails.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Post('/orgs/:orgId/:fileId/retry/bulk')
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto
  })
  @ApiForbiddenResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden',
    type: ForbiddenErrorDto
  })
  @ApiOperation({
    summary: 'Retry bulk issue credential',
    description: 'Retry bulk issue credential'
  })
  async retryBulkCredentials(
    @Param('fileId') fileId: string,
    @Param('orgId') orgId: string,
    @Res() res: Response,
    @Body() clientDetails: ClientDetails
  ): Promise<Response> {
    const bulkIssunaceDetails = await this.issueCredentialService.retryBulkCredential(
      fileId,
      orgId,
      clientDetails.clientId
    );
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.issuance.success.bulkIssuance,
      data: bulkIssunaceDetails.response
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Description: Issuer send credential to create offer
   * @param user
   * @param issueCredentialDto
   */
  @Post('/orgs/:orgId/credentials/offer')
  @ApiBearerAuth()
  @ApiOperation({
    summary: `Send credential details to create-offer`,
    description: `Send credential details to create-offer`
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER)
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  async sendCredential(
    @User() user: IUserRequest,
    @Param('orgId') orgId: string,
    @Body() issueCredentialDto: IssueCredentialDto,
    @Res() res: Response
  ): Promise<Response> {
    issueCredentialDto.orgId = orgId;

    const getCredentialDetails = await this.issueCredentialService.sendCredentialCreateOffer(issueCredentialDto, user);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.issuance.success.create,
      data: getCredentialDetails.response
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Description: credential issuance out-of-band
   * @param user
   * @param outOfBandCredentialDto
   * @param orgId
   * @param res
   * @returns
   */
  @Post('/orgs/:orgId/credentials/oob')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: `Send out-of-band credential offer via email`,
    description: `Sends an out-of-band credential offer on provided email`
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER)
  async outOfBandCredentialOffer(
    @User() user: IUserRequest,
    @Body() outOfBandCredentialDto: OOBCredentialDtoWithEmail,
    @Param('orgId') orgId: string,
    @Res() res: Response
  ): Promise<Response> {
    outOfBandCredentialDto.orgId = orgId;
    const credOffer = outOfBandCredentialDto?.credentialOffer || [];
    if (credOffer.every(item => Boolean(!item?.emailId || '' === item?.emailId.trim()))) {
      throw new BadRequestException(ResponseMessages.issuance.error.emailIdNotPresent);
    }

    if (credOffer.every(offer => (!offer?.attributes || 0 === offer?.attributes?.length ||
      !offer?.attributes?.every(item => item?.name)
    ))
    ) {
      throw new BadRequestException(ResponseMessages.issuance.error.attributesNotPresent);
    }

    const getCredentialDetails = await this.issueCredentialService.outOfBandCredentialOffer(
      user,
      outOfBandCredentialDto
    );

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.issuance.success.fetch,
      data: getCredentialDetails.response
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Description: webhook Save issued credential details
   * @param user
   * @param issueCredentialDto
   */
  @Post('wh/:id/credentials')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Catch issue credential webhook responses',
    description: 'Callback URL for issue credential'
  })
  async getIssueCredentialWebhook(
    @Body() issueCredentialDto: IssuanceDto,
    @Param('id') id: string,
    @Res() res: Response
  ): Promise<Response> {
    // const  webhookUrl = await this.issueCredentialService._getWebhookUrl(issueCredentialDto.contextCorrelationId);

    this.logger.debug(`issueCredentialDto ::: ${JSON.stringify(issueCredentialDto)}`);

    // if (webhookUrl) {
    //   try {
    //     await this.issueCredentialService._postWebhookResponse(webhookUrl, {data:issueCredentialDto});
    // } catch (error) {
    //     throw new RpcException(error.response ? error.response : error);
    // }

    const getCredentialDetails = await this.issueCredentialService.getIssueCredentialWebhook(issueCredentialDto, id);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.issuance.success.create,
      data: getCredentialDetails.response
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Description: Issuer create out-of-band credential
   * @param user
   * @param issueCredentialDto
   */
  @Post('/orgs/:orgId/credentials/oob/offer')
  @ApiBearerAuth()
  @ApiOperation({
    summary: `Create out-of-band credential offer`,
    description: `Creates an out-of-band credential offer`
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER)
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  async createOOBCredentialOffer(
    @Param('orgId') orgId: string,
    @Body() issueCredentialDto: OOBIssueCredentialDto,
    @Res() res: Response
  ): Promise<Response> {
    issueCredentialDto.orgId = orgId;
    const getCredentialDetails = await this.issueCredentialService.sendCredentialOutOfBand(issueCredentialDto);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.issuance.success.create,
      data: getCredentialDetails.response
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }
}
