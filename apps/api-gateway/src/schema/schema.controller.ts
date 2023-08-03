import { Controller, Logger, Post, Body, HttpStatus, UseGuards, Get, Query, BadRequestException, Res } from '@nestjs/common';
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse, ApiQuery } from '@nestjs/swagger';
import { SchemaService } from './schema.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import IResponseType from '@credebl/common/interfaces/response.interface';
import { Response } from 'express';
import { User } from '../authz/decorators/user.decorator';
import { ICredDeffSchemaSearchInterface, ISchemaSearchInterface } from '../interfaces/ISchemaSearch.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { GetAllSchemaDto, GetCredentialDefinitionBySchemaIdDto } from './dtos/get-all-schema.dto';
import { OrgRoles } from 'libs/org-roles/enums';
import { Roles } from '../authz/decorators/roles.decorator';
import { IUserRequestInterface } from './interfaces';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { CreateSchemaDto } from '../dtos/create-schema.dto';

@Controller('schemas')
@ApiTags('schemas')
@Roles(OrgRoles.OWNER, OrgRoles.SUPER_ADMIN, OrgRoles.ADMIN, OrgRoles.ISSUER)
@UseGuards(AuthGuard('jwt'), OrgRolesGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
export class SchemaController {
  constructor(private readonly appService: SchemaService
  ) { }
  private readonly logger = new Logger('SchemaController');

  @Post('/')
  @ApiOperation({
    summary: 'Sends a schema to the ledger',
    description: 'Create and sends a schema to the ledger.'
  })
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  async createSchema(@Res() res: Response, @Body() schema: CreateSchemaDto, @User() user: IUserRequestInterface): Promise<object> {
    schema.attributes.forEach((attribute) => {
      if (0 === attribute.length) {
        throw new BadRequestException('Attribute must not be empty');
      } else if ('' === attribute.trim()) {
        throw new BadRequestException('Attributes should not contain space');
      }
    });
    const schemaDetails = await this.appService.createSchema(schema, user, schema.orgId);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: 'Schema created successfully',
      data: schemaDetails.response
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Get('/')
  @ApiOperation({
    summary: 'Get all schemas',
    description: 'Get all schemas.'
  })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  async getSchemas(
    @Query() getAllSchemaDto: GetAllSchemaDto,
    @Res() res: Response,
    @User() user: IUserRequestInterface
  ): Promise<object> {
    const { orgId, pageSize, searchByText, pageNumber, sorting, sortByValue } = getAllSchemaDto;
    const schemaSearchCriteria: ISchemaSearchInterface = {
      pageNumber,
      searchByText,
      pageSize,
      sorting,
      sortByValue
    };
    const schemasResponse = await this.appService.getSchemas(schemaSearchCriteria, user, orgId);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.schema.success.fetch,
      data: schemasResponse.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('/id')
  @ApiOperation({
    summary: 'Get an existing schema by schemaId',
    description: 'Get an existing schema by schemaId'
  })
  @ApiQuery(
    { name: 'schemaId', required: true }
  )

  @ApiQuery(
    { name: 'orgId', required: true }
  )
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  async getSchemaById(
    @Query('schemaId') schemaId: string,
    @Query('orgId') orgId: number,
    @Res() res: Response): Promise<object> {
    if (!schemaId) {
      throw new BadRequestException(ResponseMessages.schema.error.invalidSchemaId);
    }
    const schemaDetails = await this.appService.getSchemaById(schemaId, orgId);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.schema.success.fetch,
      data: schemaDetails.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('/credential-definitions')
  @ApiOperation({
    summary: 'Get an existing credential definition list by schemaId',
    description: 'Get an existing credential definition list by schemaId'
  })
  @ApiQuery(
    { name: 'schemaId', required: true }
  )
  @ApiQuery(
    { name: 'orgId', required: true }
  )
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  async getcredDeffListBySchemaId(
    @Query('schemaId') schemaId: string,
    @Query() GetCredentialDefinitionBySchemaIdDto: GetCredentialDefinitionBySchemaIdDto,
    @Res() res: Response,
    @User() user: IUserRequestInterface): Promise<object> {
      if (!schemaId) {
        throw new BadRequestException(ResponseMessages.schema.error.invalidSchemaId);
      }
      const { orgId, pageSize, pageNumber, sorting, sortByValue } = GetCredentialDefinitionBySchemaIdDto;
      const schemaSearchCriteria: ICredDeffSchemaSearchInterface = {
        pageNumber,
        pageSize,
        sorting,
        sortByValue
      };
      const credentialDefinitionList = await this.appService.getcredDeffListBySchemaId(schemaId, schemaSearchCriteria, user, orgId);
      const finalResponse: IResponseType = {
        statusCode: HttpStatus.OK,
        message: ResponseMessages.schema.success.fetch,
        data: credentialDefinitionList.response
      };
      return res.status(HttpStatus.OK).json(finalResponse);
  }
}
