import { Controller, Get, HttpStatus, Logger, Query, Res, UseFilters } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { GetAllSchemaByPlatformDto } from '../schema/dtos/get-all-schema.dto';
import { IUserRequestInterface } from '../interfaces/IUserRequestInterface';
import { User } from '../authz/decorators/user.decorator';
import { Response } from 'express';
import { ISchemaSearchInterface } from '../interfaces/ISchemaSearch.interface';
import IResponseType from '@credebl/common/interfaces/response.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';

@ApiBearerAuth()
@Controller()
@UseFilters(CustomExceptionFilter)
export class PlatformController {
    constructor(private readonly platformService: PlatformService) { }

    private readonly logger = new Logger('PlatformController');

    @Get('/platform/schemas')
    @ApiTags('schemas')
    @ApiOperation({
        summary: 'Get all schemas from platform.',
        description: 'Get all schemas from platform.'
    })
    @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
    async getAllSchema(
        @Query() getAllSchemaDto: GetAllSchemaByPlatformDto,
        @Res() res: Response,
        @User() user: IUserRequestInterface
    ): Promise<object> {
        const { pageSize, searchByText, pageNumber, sorting, sortByValue } = getAllSchemaDto;
        const schemaSearchCriteria: ISchemaSearchInterface = {
            pageNumber,
            searchByText,
            pageSize,
            sorting,
            sortByValue
        };
        const schemasResponse = await this.platformService.getAllSchema(schemaSearchCriteria, user);

        const finalResponse: IResponseType = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.schema.success.fetch,
            data: schemasResponse.response
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }
}

