import { Controller, Post, Body, UseGuards, HttpStatus, Res, Param, UseFilters, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { Response } from 'express';
import { IResponse } from '@credebl/common/interfaces/response.interface';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRoles } from 'libs/org-roles/enums';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { Oid4vcHolderService } from './oid4vc-holder.service';
import {
  OidcAcceptProofRequestDto,
  OidcRequestCredentialDto,
  OidcResolveCredentialOfferDto,
  OidcResolveProofRequestDto
} from './dtos/oid4vc-holder.dto';

@Controller('orgs/:orgId/oid4vc/holder')
@UseFilters(CustomExceptionFilter)
@ApiTags('OID4VC-Holder')
@ApiUnauthorizedResponse({ description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ description: 'Forbidden', type: ForbiddenErrorDto })
export class Oid4vcHolderController {
  private readonly logger = new Logger('Oid4vcHolderController');
  constructor(private readonly oid4vcHolderService: Oid4vcHolderService) {}

  @Post('resolve-credential-offer')
  @ApiOperation({
    summary: 'Resolve OID4VC Credential Offer',
    description: 'Resolves an OID4VC credential offer for the specified organization.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Credential offer resolved successfully.', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async oidcHolderResolveCredentialOffer(
    @Param('orgId') orgId: string,
    @Body() resolveDto: OidcResolveCredentialOfferDto,
    @Res() res: Response
  ): Promise<Response> {
    const data = await this.oid4vcHolderService.oidcHolderResolveCredentialOffer(orgId, resolveDto);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Credential offer resolved successfully.',
      data
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Post('request-credential')
  @ApiOperation({
    summary: 'Request OID4VC Credential',
    description: 'Requests and stores an OID4VC credential for the specified organization.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Credential requested successfully.', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async oidcHolderRequestCredential(
    @Param('orgId') orgId: string,
    @Body() requestDto: OidcRequestCredentialDto,
    @Res() res: Response
  ): Promise<Response> {
    const data = await this.oid4vcHolderService.oidcHolderRequestCredential(orgId, requestDto);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Credential requested successfully.',
      data
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Post('resolve-proof-request')
  @ApiOperation({
    summary: 'Resolve OID4VC Proof Request',
    description: 'Resolves an OID4VC proof request for the specified organization.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Proof request resolved successfully.', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async oidcHolderResolveProofRequest(
    @Param('orgId') orgId: string,
    @Body() resolveDto: OidcResolveProofRequestDto,
    @Res() res: Response
  ): Promise<Response> {
    const data = await this.oid4vcHolderService.oidcHolderResolveProofRequest(orgId, resolveDto);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Proof request resolved successfully.',
      data
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Post('accept-proof-request')
  @ApiOperation({
    summary: 'Accept OID4VC Proof Request',
    description: 'Accepts an OID4VC proof request for the specified organization.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Proof request accepted successfully.', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async oidcHolderAcceptProofRequest(
    @Param('orgId') orgId: string,
    @Body() acceptDto: OidcAcceptProofRequestDto,
    @Res() res: Response
  ): Promise<Response> {
    const data = await this.oid4vcHolderService.oidcHolderAcceptProofRequest(orgId, acceptDto);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Proof request accepted successfully.',
      data
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }
}
