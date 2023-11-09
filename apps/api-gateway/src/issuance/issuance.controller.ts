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
  UseFilters
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiQuery,
  ApiExcludeEndpoint
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { CommonService } from '@credebl/common/common.service';
import { Response } from 'express';
import IResponseType from '@credebl/common/interfaces/response.interface';
import { IssuanceService } from './issuance.service';
import { IssuanceDto, IssueCredentialDto, OutOfBandCredentialDto } from './dtos/issuance.dto';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { User } from '../authz/decorators/user.decorator';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRoles } from 'libs/org-roles/enums';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { ImageServiceService } from '@credebl/image-service';
@Controller()
@UseFilters(CustomExceptionFilter)
@ApiTags('credentials')
@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
export class IssuanceController {
  constructor(
    private readonly issueCredentialService: IssuanceService,
    private readonly imageServiceService: ImageServiceService,
    private readonly awsService: AwsService,
    private readonly commonService: CommonService
  ) {}
  private readonly logger = new Logger('IssuanceController');
  private readonly PAGE: number = 1;

  /**
   * Description: Get all issued credentials
   * @param user
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
    @ApiQuery({
      name: 'pageNumber',
      type: Number,
      required: false
    })
    @ApiQuery({
      name: 'searchByText',
      type: String,
      required: false
    })
    @ApiQuery({
      name: 'pageSize',
      type: Number,
      required: false
    })
    @ApiQuery({
      name: 'sortByValue',
      type: String,
      required: false
    })
    @ApiQuery({
      name: 'sorting',
      type: String,
      required: false
    })
    
    @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER, OrgRoles.HOLDER)
    async getIssueCredentials(
      @Query() getAllIssuedCredentials: GetAllIssuedCredentialsDto,
      @User() user: IUserRequest,
      @Param('orgId') orgId: string,
      @Res() res: Response
    ): Promise<Response> {

      const { pageSize, searchByText, pageNumber, sorting, sortByValue } = getAllIssuedCredentials;
      const issuedCredentialsSearchCriteria: IIssuedCredentialSearchinterface = {
          pageNumber,
          searchByText,
          pageSize,
          sorting,
          sortByValue
        };

      const getCredentialDetails = await this.issueCredentialService.getIssueCredentials(issuedCredentialsSearchCriteria, user, orgId);

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
