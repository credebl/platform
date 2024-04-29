/* eslint-disable default-param-last */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  Res,
  Query,
  Get,
  Param,
  UseFilters,
  Header,
  UploadedFile,
  UseInterceptors,
  Logger,
  BadRequestException,
  NotFoundException,
  ParseUUIDPipe
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
import { FileExportResponse, IIssuedCredentialSearchParams, IssueCredentialType, RequestPayload } from './interfaces';
import { AwsService } from '@credebl/aws';
import { FileInterceptor } from '@nestjs/platform-express';
import { v4 as uuidv4 } from 'uuid';
import { RpcException } from '@nestjs/microservices';
/* eslint-disable @typescript-eslint/no-unused-vars */
import { user } from '@prisma/client';
import { IGetAllIssuedCredentialsDto } from './dtos/get-all-issued-credentials.dto';
import { IssueCredentialDto } from './dtos/multi-connection.dto';

@Controller()
@UseFilters(CustomExceptionFilter)
@ApiTags('credentials')
@ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
export class IssuanceController {
  constructor(
    private readonly issueCredentialService: IssuanceService,
    private readonly awsService: AwsService
  ) { }
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
  @ApiQuery({
    name: 'pageNumber',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false
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
    const { pageSize, search, pageNumber, sortField, sortBy } = getAllIssuedCredentials;
    const issuedCredentialsSearchCriteria: IIssuedCredentialSearchParams = {
      pageNumber,
      search,
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
          fileName: fileDetails['fileName'] || file?.filename || file?.originalname
        };

        const importCsvDetails = await this.issueCredentialService.importCsv(reqPayload);
        const finalResponse: IResponseType = {
          statusCode: HttpStatus.CREATED,
          message: ResponseMessages.issuance.success.importCSV,
          data: importCsvDetails.response
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
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
    const previewCSVDetails = await this.issueCredentialService.previewCSVDetails(requestId, orgId, previewFileDetails);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.issuance.success.previewCSV,
      data: previewCSVDetails
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

  async issueBulkCredentials(
    @Param('requestId') requestId: string,
    @Param('orgId') orgId: string,
    @Res() res: Response,
    @Body() clientDetails: ClientDetails,
    @User() user: user,
    @Query('credDefId') credentialDefinitionId?: string,
    @Body() fileDetails?: object,
    @UploadedFile() file?: Express.Multer.File
  ): Promise<Response> {

    clientDetails.userId = user.id;
    let reqPayload: RequestPayload;

    if (file && clientDetails?.isSelectiveIssuance) {
      const fileKey: string = uuidv4();
      try {
        await this.awsService.uploadCsvFile(fileKey, file.buffer);
      } catch (error) {
        throw new RpcException(error.response ? error.response : error);
      }

      reqPayload = {
        credDefId: credentialDefinitionId,
        fileKey,
        fileName: fileDetails['fileName'] || file?.filename || file?.originalname
      };
    }
      const bulkIssuanceDetails = await this.issueCredentialService.issueBulkCredential(requestId, orgId, clientDetails, reqPayload);

      const finalResponse: IResponse = {
        statusCode: HttpStatus.CREATED,
        message: ResponseMessages.issuance.success.bulkIssuance,
        data: bulkIssuanceDetails
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
    const bulkIssuanceDetails = await this.issueCredentialService.retryBulkCredential(
      fileId,
      orgId,
      clientDetails.clientId
    );
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.issuance.success.bulkIssuance,
      data: bulkIssuanceDetails.response
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

 /**
  * @param user 
  * @param orgId 
  * @param issueCredentialDto 
  * @param res 
  * @returns Issuer creates a credential offer and sends it to the holder
  */
  @Post('/orgs/:orgId/credentials/offer')
  @ApiBearerAuth()
  @ApiOperation({
    summary: `Issuer create a credential offer`,
    description: `Issuer creates a credential offer and sends it to the holder`
  })
  @ApiQuery({
    name:'credentialType',
    enum: IssueCredentialType
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER)
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
  async sendCredential(
    @User() user: IUserRequest,
    @Param('orgId', new ParseUUIDPipe({exceptionFactory: (): Error => { throw new BadRequestException(`Invalid format for orgId`); }})) orgId: string,
    @Query('credentialType') credentialType: IssueCredentialType = IssueCredentialType.INDY,
    @Body() issueCredentialDto: IssueCredentialDto,
    @Res() res: Response
  ): Promise<Response> {
    issueCredentialDto.orgId = orgId;
    issueCredentialDto.credentialType = credentialType;

    const credOffer = issueCredentialDto?.credentialData || [];
    if (IssueCredentialType.INDY !== credentialType &&  IssueCredentialType.JSONLD !== credentialType) {
      throw new NotFoundException(ResponseMessages.issuance.error.invalidCredentialType);
}
    if (issueCredentialDto.credentialType === IssueCredentialType.JSONLD   && credOffer.every(offer => (!offer?.credential || 0 === Object.keys(offer?.credential).length))) {
      throw new BadRequestException(ResponseMessages.issuance.error.credentialNotPresent);
    }

    if (issueCredentialDto.credentialType   ===  IssueCredentialType.JSONLD && credOffer.every(offer => (!offer?.options || 0 === Object.keys(offer?.options).length))) {
      throw new BadRequestException(ResponseMessages.issuance.error.optionsNotPresent);
    }

    const getCredentialDetails = await this.issueCredentialService.sendCredentialCreateOffer(issueCredentialDto, user);
    
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.issuance.success.create,
      data: getCredentialDetails
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * 
   * @param user 
   * @param outOfBandCredentialDto 
   * @param orgId 
   * @param res 
   * @returns Issuer creates a out-of-band credential offers and sends them to holders via emails
   */
  @Post('/orgs/:orgId/credentials/oob/email')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: `Creates a out-of-band credential offer and sends them via emails`,
    description: `Issuer creates a out-of-band credential offers and sends them to holders via emails`
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER)
  @ApiQuery({
    name:'credentialType',
    enum: IssueCredentialType
  })
  async outOfBandCredentialOffer(
    @User() user: IUserRequest,
    @Body() outOfBandCredentialDto: OOBCredentialDtoWithEmail,
    @Query('credentialType') credentialType: IssueCredentialType = IssueCredentialType.INDY,
    @Param('orgId') orgId: string,
    @Res() res: Response
  ): Promise<Response> {
    outOfBandCredentialDto.orgId = orgId;
    outOfBandCredentialDto.credentialType = credentialType;
    const credOffer = outOfBandCredentialDto?.credentialOffer || [];
    if (IssueCredentialType.INDY !== credentialType &&  IssueCredentialType.JSONLD !== credentialType) {
      throw new NotFoundException(ResponseMessages.issuance.error.invalidCredentialType);
}
    if (outOfBandCredentialDto.credentialType === IssueCredentialType.JSONLD   && credOffer.every(offer => (!offer?.credential || 0 === Object.keys(offer?.credential).length))) {
      throw new BadRequestException(ResponseMessages.issuance.error.credentialNotPresent);
    }

    if (outOfBandCredentialDto.credentialType   ===  IssueCredentialType.JSONLD && credOffer.every(offer => (!offer?.options || 0 === Object.keys(offer?.options).length))) {
      throw new BadRequestException(ResponseMessages.issuance.error.optionsNotPresent);
    }
    const getCredentialDetails = await this.issueCredentialService.outOfBandCredentialOffer(
      user,
      outOfBandCredentialDto
    );

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.issuance.success.createOOB,
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
    @ApiQuery({
      name:'credentialType',
      enum: IssueCredentialType
    })
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER)
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
    async createOOBCredentialOffer(
      @Query('credentialType') credentialType: IssueCredentialType = IssueCredentialType.INDY,
      @Param('orgId') orgId: string,
      @Body() issueCredentialDto: OOBIssueCredentialDto,
      @Res() res: Response
    ): Promise<Response> {
      issueCredentialDto.orgId = orgId;
      issueCredentialDto.credentialType = credentialType;
      const getCredentialDetails = await this.issueCredentialService.sendCredentialOutOfBand(issueCredentialDto);
      const finalResponse: IResponseType = {
        statusCode: HttpStatus.CREATED,
        message: ResponseMessages.issuance.success.create,
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
issueCredentialDto.type = 'Issuance';
     
      const getCredentialDetails = await this.issueCredentialService.getIssueCredentialWebhook(issueCredentialDto, id).catch(error => {
        this.logger.debug(`error in saving issuance webhook ::: ${JSON.stringify(error)}`);
      });
      const finalResponse: IResponseType = {
        statusCode: HttpStatus.CREATED,
        message: ResponseMessages.issuance.success.create,
        data: getCredentialDetails
      };    
      const  webhookUrl = await this.issueCredentialService._getWebhookUrl(issueCredentialDto.contextCorrelationId).catch(error => {
        this.logger.debug(`error in getting webhook url ::: ${JSON.stringify(error)}`);
      });
      if (webhookUrl) {
        
          await this.issueCredentialService._postWebhookResponse(webhookUrl, {data:issueCredentialDto}).catch(error => {
            this.logger.debug(`error in posting webhook  response to webhook url ::: ${JSON.stringify(error)}`);
          });
      
    }
    return res.status(HttpStatus.CREATED).json(finalResponse);
    }   
}
