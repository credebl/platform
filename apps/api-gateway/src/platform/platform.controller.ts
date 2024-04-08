import { Controller, Get, HttpStatus, Logger, Param, Query, Res, UseFilters, UseGuards } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { GetAllSchemaByPlatformDto } from '../schema/dtos/get-all-schema.dto';
import { IUserRequestInterface } from '../interfaces/IUserRequestInterface';
import { User } from '../authz/decorators/user.decorator';
import { Response } from 'express';
import { ISchemaSearchPayload } from '../interfaces/ISchemaSearch.interface';
import { IResponse } from '@credebl/common/interfaces/response.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { AuthGuard } from '@nestjs/passport';
import * as QRCode from 'qrcode';
import { SortFields } from 'apps/ledger/src/schema/enum/schema.enum';


@Controller('')
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
    @ApiQuery({
        name: 'sortField',
        enum: SortFields,
        required: false
      })    
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    async getAllSchema(
        @Query() getAllSchemaDto: GetAllSchemaByPlatformDto,
        @Res() res: Response,
        @User() user: IUserRequestInterface
    ): Promise<Response> {
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
        const finalResponse: IResponse = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.schema.success.fetch,
            data: schemasResponse
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    @Get('/platform/ledgers')
    @ApiTags('ledgers')
    @ApiOperation({
        summary: 'Get all ledgers from platform.',
        description: 'Get all ledgers from platform.'
    })
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    async getAllLedgers(
        @Res() res: Response
    ): Promise<object> {
        const networksResponse = await this.platformService.getAllLedgers();

        const finalResponse: IResponse = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.ledger.success.fetch,
            data: networksResponse
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    @Get('/platform/network/url/:indyNamespace')
    @ApiTags('ledgers')
    @ApiOperation({
        summary: 'Get network url from platform.',
        description: 'Get network url from platform.'
    })
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    async getNetwrkUrl(
        @Param('indyNamespace') indyNamespace: string,
        @Res() res: Response
    ): Promise<Response> {
        const networksResponse = await this.platformService.getNetworkUrl(indyNamespace);

        const finalResponse: IResponse = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.ledger.success.fetchNetworkUrl,
            data: networksResponse
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    @Get('/invitation/:referenceId')
    @ApiOperation({
        summary: `Get shortening url by referenceId`,
        description: `Get shortening url by referenceId`
    })
    @ApiExcludeEndpoint()
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    async getShorteningUrlById(
        @Param('referenceId') referenceId: string,
        @Res() res: Response
    ): Promise<Response> {
        const shorteningUrlDetails = await this.platformService.getShorteningUrlById(referenceId);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.shorteningUrl.success.getshorteningUrl,
            data: shorteningUrlDetails
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    @Get('/invitation/qr-code/:referenceId')
    @ApiOperation({
        summary: `Get QR by referenceId`,
        description: `Get QR by referenceId`
    })
    @ApiExcludeEndpoint()
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    async getQrCode(
        @Param('referenceId') referenceId: string,
        @Res() res: Response
    ): Promise<void> {
        const url = `${process.env.API_GATEWAY_PROTOCOL}://${process.env.API_ENDPOINT}/invitation/${referenceId}`;
        // Generate QR code as a buffer
        const qrCodeBuffer = await QRCode.toBuffer(url);

        // Set response type to image/png
        res.type('image/png');

        // Send the QR code buffer as the response
        res.send(qrCodeBuffer);
    }
}

