import { CustomExceptionFilter } from '@credebl/common/exception-handler';
import { Body, Controller, HttpStatus, Logger, Patch, Post, Res, UseFilters } from '@nestjs/common';
import { ApiForbiddenResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { RegisterHolderCredentalsDto, RegisterOrgWebhhookEndpointDto, SendNotificationDto } from './dtos/notification.dto';
import { IResponse } from '@credebl/common/interfaces/response.interface';
import { Response } from 'express';
import { ResponseMessages } from '@credebl/common/response-messages';
import { NoificatonService } from './notification.service';


@Controller('notification')
@UseFilters(CustomExceptionFilter)
@ApiTags('notification')
@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
export class NotificationController {
    constructor(
        private readonly noificatonService: NoificatonService
    ) { }
    private readonly logger = new Logger('NotificationController');

    /**
     * Register organization webhook endpoint
     * @param registerOrgWebhhookEndpointDto 
     * @param res 
     * @returns Stored notification data
     */
    @Post('/register/webhook-endpoint')
    @ApiOperation({
        summary: `Register organization webhook endpoint for notification`,
        description: `Register organization webhook endpoint for notification`
    })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
    async registerOrgWebhookEndpoint(
        @Body() registerOrgWebhhookEndpointDto: RegisterOrgWebhhookEndpointDto,
        @Res() res: Response
    ): Promise<Response> {

        const registerUserEndpoint = await this.noificatonService.registerOrgWebhookEndpoint(
            registerOrgWebhhookEndpointDto
        );

        const finalResponse: IResponse = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.notification.success.register,
            data: registerUserEndpoint
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }

    /**
     * Send notification for holder
     * @param sendNotificationDto 
     * @param res 
     * @returns Get notification details
     */
    @Post('/')
    @ApiOperation({
        summary: `Send notification for holder`,
        description: `Send notification for holder`
    })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
    async sendNotification(
        @Body() sendNotificationDto: SendNotificationDto,
        @Res() res: Response
    ): Promise<Response> {

        const sendNotification = await this.noificatonService.sendNotification(
            sendNotificationDto
        );

        const finalResponse: IResponse = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.notification.success.sendNotification,
            data: sendNotification
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }

    /**
     * Update the holder specific fcmtoken, userkey by orgId 
     * @param registerHolder 
     * @param res 
     * @returns Updated notification data
     */
    @Patch('/holder-credentials')
    @ApiOperation({
        summary: `Register holder credentials for notification`,
        description: `Register holder credentials for notification`
    })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
    async registerHolderCredentals(
        @Body() registerHolderCredentals: RegisterHolderCredentalsDto,
        @Res() res: Response
    ): Promise<Response> {

        const registerUserEndpoint = await this.noificatonService.registerHolderCredentals(
            registerHolderCredentals
        );

        const finalResponse: IResponse = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.notification.success.register,
            data: registerUserEndpoint
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }
}