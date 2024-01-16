import { Controller, Get, HttpStatus, Logger, Param, Query, Res, UseFilters, UseGuards } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { GetAllSchemaByPlatformDto } from '../schema/dtos/get-all-schema.dto';
import { IUserRequestInterface } from '../interfaces/IUserRequestInterface';
import { User } from '../authz/decorators/user.decorator';
import { Response } from 'express';
import { ISchemaSearchPayload } from '../interfaces/ISchemaSearch.interface';
import IResponseType from '@credebl/common/interfaces/response.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { AuthGuard } from '@nestjs/passport';

@ApiBearerAuth()
@Controller('platform')
@UseFilters(CustomExceptionFilter)
export class PlatformController {
    constructor(private readonly platformService: PlatformService) { }

    private readonly logger = new Logger('PlatformController');

    @Get('/schemas')
    @ApiTags('schemas')
    @ApiOperation({
        summary: 'Get all schemas from platform.',
        description: 'Get all schemas from platform.'
    })
    @UseGuards(AuthGuard('jwt'))
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    async getAllSchema(
        @Query() getAllSchemaDto: GetAllSchemaByPlatformDto,
        @Res() res: Response,
        @User() user: IUserRequestInterface
    ): Promise<object> {
        const { ledgerId, pageSize, searchByText, pageNumber, sorting, sortByValue } = getAllSchemaDto;
        const schemaSearchCriteria: ISchemaSearchPayload = {
            ledgerId,
            pageNumber,
            searchByText,
            pageSize,
            sortField: sorting,
            sortBy: sortByValue
        };
        const schemasResponse = await this.platformService.getAllSchema(schemaSearchCriteria, user);
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.schema.success.fetch,
            data: schemasResponse.response
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    @Get('/ledgers')
    @ApiTags('ledgers')
    @ApiOperation({
        summary: 'Get all ledgers from platform.',
        description: 'Get all ledgers from platform.'
    })
    @UseGuards(AuthGuard('jwt'))
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    async getAllLedgers(
        @Res() res: Response
    ): Promise<object> {
        const networksResponse = await this.platformService.getAllLedgers();

        const finalResponse: IResponseType = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.ledger.success.fetch,
            data: networksResponse.response
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    @Get('/network/url/:indyNamespace')
    @ApiTags('ledgers')
    @ApiOperation({
        summary: 'Get network url from platform.',
        description: 'Get network url from platform.'
    })
    @UseGuards(AuthGuard('jwt'))
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    async getNetwrkUrl(
        @Param('indyNamespace') indyNamespace: string, 
        @Res() res: Response
    ): Promise<object> {
        const networksResponse = await this.platformService.getNetworkUrl(indyNamespace);

        const finalResponse: IResponseType = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.ledger.success.fetch,
            data: networksResponse.response
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }
}

