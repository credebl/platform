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
  Param
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
import { IssuanceDto, IssueCredentialDto } from './dtos/issuance.dto';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { User } from '../authz/decorators/user.decorator';
import { ResponseMessages } from '@credebl/common/response-messages';
import { IssueCredential } from './enums/Issuance.enum';

@Controller()
@ApiTags('issuances')
@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })

export class IssuanceController {
  constructor(
    private readonly issueCredentialService: IssuanceService,
    private readonly commonService: CommonService

  ) { }
  private readonly logger = new Logger('IssuanceController');

  /**
   * Description: Issuer send credential to create offer
   * @param user
   * @param issueCredentialDto
   */
  @Post('issue-credentials/create-offer')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: `Send credential details to create-offer`,
    description: `Send credential details to create-offer`
  })
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  async sendCredential(
    @User() user: IUserRequest,
    @Body() issueCredentialDto: IssueCredentialDto,
    @Res() res: Response
  ): Promise<Response> {

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
    @Param('id') id: number,
    @Res() res: Response
  ): Promise<Response> {
    const getCredentialDetails = await this.issueCredentialService.getIssueCredentialWebhook(issueCredentialDto, id);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.issuance.success.create,
      data: getCredentialDetails.response
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);

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
  @Get('/issue-credentials')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: `Fetch all issued credentials`,
    description: `Fetch all issued credentials`
  })
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  @ApiQuery(
    { name: 'threadId', required: false }
  )
  @ApiQuery(
    { name: 'connectionId', required: false }
  )
  @ApiQuery(
    { name: 'state', enum: IssueCredential, required: false }
  )
  @ApiQuery(
    { name: 'orgId', required: true }
  )
  async getIssueCredentials(
    @User() user: IUserRequest,
    @Query('threadId') threadId: string,
    @Query('connectionId') connectionId: string,
    @Query('state') state: string,
    @Query('orgId') orgId: number,
    @Res() res: Response
  ): Promise<Response> {

    state = state || undefined;
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
  @Get('issue-credentials/:credentialRecordId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: `Fetch all issued credentials by credentialRecordId`,
    description: `Fetch all issued credentials by credentialRecordId`
  })
  @ApiQuery(
    { name: 'orgId', required: true }
  )
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  async getIssueCredentialsbyCredentialRecordId(
    @User() user: IUserRequest,
    @Param('credentialRecordId') credentialRecordId: string,
    @Query('orgId') orgId: number,

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

}
