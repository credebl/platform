/* eslint-disable default-param-last */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable camelcase */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  Res,
  Param,
  UseFilters,
  BadRequestException,
  ParseUUIDPipe,
  Get,
  Query,
  Put,
  Delete
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiQuery
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { Response } from 'express';
import { IResponse } from '@credebl/common/interfaces/response.interface';
import { User } from '../authz/decorators/user.decorator';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRoles } from 'libs/org-roles/enums';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
/* eslint-disable @typescript-eslint/no-unused-vars */
import { user } from '@prisma/client';
import { Oid4vcVerificationService } from './oid4vc-verification.service';
import { CreateVerifierDto, UpdateVerifierDto } from './dtos/oid4vc-verifier.dto';
import { VerificationSessionQueryDto } from './dtos/oid4vc-verifier-session.dto';
@Controller()
@UseFilters(CustomExceptionFilter)
@ApiTags('OID4VP')
@ApiUnauthorizedResponse({ description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ description: 'Forbidden', type: ForbiddenErrorDto })
export class Oid4vcVerificationController {
  constructor(private readonly oid4vcVerificationService: Oid4vcVerificationService) {}
  /**
   * Create issuer against a org(tenant)
   * @param orgId The ID of the organization
   * @param user The user making the request
   * @param res The response object
   * @returns The status of the deletion operation
   */

  @Post('/orgs/:orgId/oid4vp/verifier')
  @ApiOperation({
    summary: 'Create OID4VP verifier',
    description: 'Creates a new OID4VP verifier for the specified organization.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Verifier created successfully.', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async oidcIssuerCreate(
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
    @Body() createVerifier: CreateVerifierDto,
    @Res() res: Response
  ): Promise<Response> {
    const createVerifierRes = await this.oid4vcVerificationService.oid4vpCreateVerifier(createVerifier, orgId, user);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.oid4vp.success.create,
      data: createVerifierRes
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Create issuer against a org(tenant)
   * @param orgId The ID of the organization
   * @param verifierId The ID of the Verifier
   * @param user The user making the request
   * @param res The response object
   * @returns The status of the verifier update operation
   */
  @Put('/orgs/:orgId/oid4vp/verifier/:verifierId')
  @ApiOperation({
    summary: 'Update OID4VP verifier',
    description: 'Updates OID4VP verifier for the specified organization.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Verifier updated successfully.', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async oidcIssuerUpdate(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Param('verifierId')
    verifierId: string,
    @User() user: user,
    @Body() updateVerifier: UpdateVerifierDto,
    @Res() res: Response
  ): Promise<Response> {
    console.log('This is updateVerifier', JSON.stringify(updateVerifier, null, 2));
    const createVerifierRes = await this.oid4vcVerificationService.oid4vpUpdateVerifier(
      updateVerifier,
      orgId,
      verifierId,
      user
    );
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.oid4vp.success.update,
      data: createVerifierRes
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Get('/orgs/:orgId/oid4vp/verifier')
  @ApiOperation({
    summary: 'Get OID4VP verifier details',
    description: 'Retrieves details of a specific OID4VP verifier by its ID for the specified organization.'
  })
  @ApiQuery({
    name: 'verifierId',
    required: false,
    type: String,
    description: 'UUID of the verifier (optional)'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Verifier details retrieved successfully.', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async getVerifierDetails(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Res() res: Response,
    @Query(
      'verifierId',
      new ParseUUIDPipe({
        version: '4',
        optional: true,
        exceptionFactory: (): Error => {
          throw new BadRequestException('Invalid verifier ID');
        }
      })
    )
    verifierId?: string
  ): Promise<Response> {
    const verifierDetails = await this.oid4vcVerificationService.oid4vpGetVerifier(orgId, verifierId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oid4vp.success.fetch,
      data: verifierDetails
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Delete('/orgs/:orgId/oid4vp/verifier')
  @ApiOperation({
    summary: 'Delete OID4VP verifier details',
    description: 'Delete a specific OID4VP verifier by its ID for the specified organization.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Verifier deleted successfully.', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async deleteVerifierDetails(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Res() res: Response,
    @Query(
      'verifierId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException('Invalid verifier ID');
        }
      })
    )
    verifierId: string
  ): Promise<Response> {
    const verifierDetails = await this.oid4vcVerificationService.oid4vpDeleteVerifier(orgId, verifierId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oid4vp.success.fetch,
      data: verifierDetails
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('/orgs/:orgId/oid4vp/verifier-session')
  @ApiOperation({
    summary: 'Get OID4VP verifier session details',
    description:
      'Retrieves details of all OID4VP verifier sessions or a single session by its ID for the specified organization.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verifier details retrieved successfully.',
    type: ApiResponseDto
  })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async getVerificationSession(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Query() query: VerificationSessionQueryDto,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const { id, state, publicVerifierId } = query;

      const result = await this.oid4vcVerificationService.oid4vpGetVerifierSession(orgId, query);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Verifier details retrieved successfully.',
        data: result
      });
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch verifier session.');
    }
  }

  @Get('/orgs/:orgId/oid4vp/verifier-session-response')
  @ApiOperation({
    summary: 'Get OID4VP verifier session response details',
    description:
      'Retrieves details of OID4VP verifier sessions response by its verification session ID for the specified organization.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verifier session response details retrieved successfully.',
    type: ApiResponseDto
  })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async getVerificationSessionResponse(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Query(
      'verificationSessionId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException('Invalid verificationSessionId ID');
        }
      })
    )
    verificationSessionId: string,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const result = await this.oid4vcVerificationService.getVerificationSessionResponse(orgId, verificationSessionId);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Verifier session response details retrieved successfully.',
        data: result
      });
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch verifier session response details.');
    }
  }
}
