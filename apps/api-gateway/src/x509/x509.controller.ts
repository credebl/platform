import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Put,
  Param,
  UseGuards,
  UseFilters,
  Post,
  Body,
  Res,
  HttpStatus,
  Query,
  ParseUUIDPipe,
  BadRequestException
} from '@nestjs/common';

import IResponse from '@credebl/common/interfaces/response.interface';
import { Response } from 'express';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../authz/decorators/user.decorator';
import { user } from '@prisma/client';
import { ResponseMessages } from '@credebl/common/response-messages';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRoles } from 'libs/org-roles/enums';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';

import { TrimStringParamPipe } from '@credebl/common/cast.helper';
import { X509Service } from './x509.service';
import {
  X509CreateCertificateOptionsDto,
  X509ImportCertificateOptionsDto,
  X509SearchCriteriaDto
} from './dtos/x509.dto';
import { SortFields, x5cKeyType, x5cRecordStatus } from '@credebl/enum/enum';

@UseFilters(CustomExceptionFilter)
@Controller('x509')
@ApiTags('x509')
@ApiUnauthorizedResponse({ description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ description: 'Forbidden', type: ForbiddenErrorDto })
export class X509Controller {
  constructor(private readonly x509Service: X509Service) {}

  /**
   * Create a new x509
   * @param createDto The details of the x509 to be created
   * @returns Created x509 details
   */
  @Post('/:orgId')
  @ApiOperation({
    summary: 'Create a new X509',
    description: 'Create a new x509 with the provided details.'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiBearerAuth()
  async createX509(
    @Param(
      'orgId',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Body() createDto: X509CreateCertificateOptionsDto,
    @Res() res: Response,
    @User() reqUser: user
  ): Promise<Response> {
    const record = await this.x509Service.createX509(orgId, createDto, reqUser);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.x509.success.create,
      data: record
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Put('/:orgId/activate/:id')
  @ApiOperation({
    summary: 'Activate X509 certificate',
    description: 'Activate X509 certificate'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiBearerAuth()
  async activateX509(
    @Param(
      'orgId',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @User() reqUser: user
  ): Promise<Response> {
    const record = await this.x509Service.activateX509(orgId, id, reqUser);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.x509.success.activated,
      data: record
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Put('/:orgId/deactivate/:id')
  @ApiOperation({
    summary: 'Deactive X509 certificate',
    description: 'Deactive X509 certificate'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiBearerAuth()
  async deActivateX509(
    @Param(
      'orgId',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @User() reqUser: user
  ): Promise<Response> {
    const record = await this.x509Service.deActivateX509(orgId, id, reqUser);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.x509.success.deActivated,
      data: record
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('/:orgId')
  @ApiOperation({
    summary: 'Get all X509 certificate',
    description: 'Get all X509 certificate'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiBearerAuth()
  @ApiQuery({
    name: 'keyType',
    enum: x5cKeyType,
    required: false
  })
  @ApiQuery({
    name: 'status',
    enum: x5cRecordStatus,
    required: false
  })
  @ApiQuery({
    name: 'sortField',
    enum: SortFields,
    required: false
  })
  async getAllX509ByOrgId(
    @Query() x509SearchCriteriaDto: X509SearchCriteriaDto,
    @Param(
      'orgId',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Res() res: Response,
    @User() reqUser: user
  ): Promise<Response> {
    const record = await this.x509Service.getX509CertificatesByOrgId(orgId, x509SearchCriteriaDto, reqUser);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.x509.success.fetchAll,
      data: record
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('/:orgId/:id')
  @ApiOperation({
    summary: 'Get X509 certificate',
    description: 'Get X509 certificate'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiBearerAuth()
  async getX509Certificate(
    @Param(
      'orgId',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @User() reqUser: user
  ): Promise<Response> {
    const record = await this.x509Service.getX509Certificate(orgId, id, reqUser);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.x509.success.fetch,
      data: record
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Import a new x509
   * @param importDto The details of the x509 to be created
   * @returns Imported x509 certificate
   */
  @Post('/:orgId/import')
  @ApiOperation({
    summary: 'Import a new X509',
    description: 'Import a new x509 with the provided details.'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiBearerAuth()
  async importX509(
    @Param(
      'orgId',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Body() importDto: X509ImportCertificateOptionsDto,
    @Res() res: Response,
    @User() reqUser: user
  ): Promise<Response> {
    const record = await this.x509Service.importX509(orgId, importDto, reqUser);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.x509.success.import,
      data: record
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }
}
