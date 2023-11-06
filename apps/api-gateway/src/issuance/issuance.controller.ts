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
  UseInterceptors,
  UploadedFile
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
import { CommonService } from '@credebl/common/common.service';
import { Response } from 'express';
import IResponseType from '@credebl/common/interfaces/response.interface';
import { IssuanceService } from './issuance.service';
import { IssuanceDto, IssueCredentialDto, OutOfBandCredentialDto, PreviewFileDetails } from './dtos/issuance.dto';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { User } from '../authz/decorators/user.decorator';
import { ResponseMessages } from '@credebl/common/response-messages';
import { IssueCredential } from './enums/Issuance.enum';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRoles } from 'libs/org-roles/enums';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { ImageServiceService } from '@credebl/image-service';
import { FileExportResponse, RequestPayload } from './interfaces';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerCSVOptions } from '../config/multer.config';
import { extname } from 'path';
import * as fs from 'fs';

@Controller()
@UseFilters(CustomExceptionFilter)
@ApiTags('credentials')
@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })

export class IssuanceController {
  constructor(
    private readonly issueCredentialService: IssuanceService,
    private readonly imageServiceService: ImageServiceService,
    private readonly commonService: CommonService

  ) { }
  private readonly logger = new Logger('IssuanceController');
  private readonly PAGE: number = 1;

  @Get('/issuance/oob/qr')
  @ApiOperation({ summary: 'Out-Of-Band issuance QR', description: 'Out-Of-Band issuance QR' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @ApiExcludeEndpoint()
  @ApiQuery(
    { name: 'base64Image', required: true }
  )
  async getQrCode(@Query('base64Image') base64Image: string, @Res() res: Response): Promise<Response> {

    const getImageBuffer = await this.imageServiceService.getBase64Image(base64Image);
    res.setHeader('Content-Type', 'image/png');
    return res.send(getImageBuffer);
  }

  /**
    * Description: Get all issued credentials
    * @param user
    * @param threadId
    * @param connectionId
    * @param state
    * @param orgId
    * 
    */
  @Get('/orgs/:orgId/credentials')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: `Get all issued credentials for a specific organization`,
    description: `Get all issued credentials for a specific organization`
  })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @ApiQuery(
    { name: 'threadId', required: false }
  )
  @ApiQuery(
    { name: 'connectionId', required: false }
  )
  @ApiQuery(
    { name: 'state', enum: IssueCredential, required: false }
  )
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER, OrgRoles.HOLDER)
  async getIssueCredentials(
    @User() user: IUserRequest,
    @Query('threadId') threadId: string,
    @Query('connectionId') connectionId: string,
    @Query('state') state: string,
    @Param('orgId') orgId: string,
    @Res() res: Response
  ): Promise<Response> {

    const getCredentialDetails = await this.issueCredentialService.getIssueCredentials(user, threadId, connectionId, state, orgId);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.issuance.success.fetch,
      data: getCredentialDetails.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
 * Description: Get all issued credentials
 * @param user
 * @param credentialRecordId
 * @param orgId
 * 
 */
  @Get('/orgs/:orgId/credentials/:credentialRecordId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: `Get credential by credentialRecordId`,
    description: `Get credential credentialRecordId`
  })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER, OrgRoles.HOLDER)
  async getIssueCredentialsbyCredentialRecordId(
    @User() user: IUserRequest,
    @Param('credentialRecordId') credentialRecordId: string,
    @Param('orgId') orgId: string,

    @Res() res: Response
  ): Promise<Response> {

    const getCredentialDetails = await this.issueCredentialService.getIssueCredentialsbyCredentialRecordId(user, credentialRecordId, orgId);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.issuance.success.fetch,
      data: getCredentialDetails.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('/orgs/:orgId/:credentialDefinitionId/download')
  @ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
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
      const exportedData: FileExportResponse = await this.issueCredentialService.exportSchemaToCSV(credentialDefinitionId);
      return res.header('Content-Disposition', `attachment; filename="${exportedData.fileName}.csv"`).status(200).send(exportedData.fileContent);
    } catch (error) {
    }

  }


  @Post('/orgs/:orgId/bulk/upload')
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload file for bulk issuance',
    description: 'Upload file for bulk issuance.'
  })
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto
  })
  @ApiForbiddenResponse({
    status: 403,
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
          // 👈 this property
          type: 'string',
          format: 'binary'
        }
      }
    },
    required: true
  })
  @UseInterceptors(FileInterceptor('file', multerCSVOptions))
  async importAndPreviewDataForIssuance(
    @Query('credDefId') credentialDefinitionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Param('orgId') orgId: string,
    @Res() res: Response
  ): Promise<object> {
    if (file) {
      this.logger.log(`file:${file.path}`);
      this.logger.log(`Uploaded file : ${file.filename}`);
      const timestamp = Math.floor(Date.now() / 1000);
      const ext = extname(file.filename);
      const newFilename = `${file.filename}-${timestamp}${ext}`;

      fs.rename(
        `${process.env.PWD}/uploadedFiles/import/${file.filename}`,
        `${process.env.PWD}/uploadedFiles/import/${newFilename}`,
        async (err: any) => {
          if (err) {
            throw err;
          }
        }
      );

      const reqPayload: RequestPayload = {
        credDefId: credentialDefinitionId,
        filePath: `${process.env.PWD}/uploadedFiles/import/${newFilename}`,
        fileName: newFilename
      };
      const importCsvDetails = await this.issueCredentialService.importCsv(
        reqPayload
      );
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
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto
  })
  @ApiForbiddenResponse({
    status: 403,
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
    const perviewCSVDetails = await this.issueCredentialService.previewCSVDetails(
      requestId,
      orgId,
      previewFileDetails
    );
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
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @ApiUnauthorizedResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto
  })
  @ApiForbiddenResponse({
    status: 403,
    description: 'Forbidden',
    type: ForbiddenErrorDto
  })
  @ApiOperation({
    summary: 'bulk issue credential',
    description: 'bulk issue credential'
  })
  async issueBulkCredentials(@Param('requestId') requestId: string, @Param('orgId') orgId: string,  @Res() res: Response): Promise<Response> {
    const bulkIssunaceDetails = await this.issueCredentialService.issueBulkCredential(requestId, orgId);
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
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  async sendCredential(
    @User() user: IUserRequest,
    @Param('orgId') orgId: string,
    @Body() issueCredentialDto: IssueCredentialDto,
    @Res() res: Response
  ): Promise<Response> {

    issueCredentialDto.orgId = orgId;
    const attrData = issueCredentialDto.attributes;

    attrData.forEach((data) => {
      if ('' === data['name'].trim()) {
        throw new BadRequestException(`Name must be required`);
      } else if ('' === data['value'].trim()) {
        throw new BadRequestException(`Value must be required at position of ${data['name']}`);
      }
    });
 
    const getCredentialDetails = await this.issueCredentialService.sendCredentialCreateOffer(
      issueCredentialDto,
      user
    );

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
    summary: `Create out-of-band credential offer`,
    description: `Create out-of-band credential offer`
  })
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER)
  async outOfBandCredentialOffer(
    @User() user: IUserRequest,
    @Body() outOfBandCredentialDto: OutOfBandCredentialDto,
    @Param('orgId') orgId: string,
    @Res() res: Response
  ): Promise<Response> {

    outOfBandCredentialDto.orgId = orgId;
    const getCredentialDetails = await this.issueCredentialService.outOfBandCredentialOffer(user, outOfBandCredentialDto);

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
    this.logger.debug(`issueCredentialDto ::: ${JSON.stringify(issueCredentialDto)}`);
    
   
    const getCredentialDetails = await this.issueCredentialService.getIssueCredentialWebhook(issueCredentialDto, id);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.issuance.success.create,
      data: getCredentialDetails.response
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);

  }

  
}
