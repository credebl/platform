import { ApiBearerAuth, ApiForbiddenResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Controller, UseGuards, UseFilters } from '@nestjs/common';
import { EcosystemService } from './ecosystem.service';
import { Post } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { Res } from '@nestjs/common';
import { CreateEcosystemDto } from './dtos/create-organization-dto';
import IResponseType from '@credebl/common/interfaces/response.interface';
import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { AuthGuard } from '@nestjs/passport';
import { ResponseMessages } from '@credebl/common/response-messages';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';


@UseFilters(CustomExceptionFilter)
@Controller('ecosystem')
@ApiTags('ecosystem')
@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
export class EcosystemController {

  constructor(
    private readonly ecosystemService: EcosystemService
  ) { }


  @Post('/')
  @ApiOperation({ summary: 'Create a new ecosystem', description: 'Create an ecosystem' })
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async createOrganization(@Body() createOrgDto: CreateEcosystemDto, @Res() res: Response): Promise<Response> {
    await this.ecosystemService.createEcosystem(createOrgDto);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.create
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }
}