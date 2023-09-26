import IResponseType from '@credebl/common/interfaces/response.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Controller, UseGuards, HttpStatus, Res, Get, UseFilters } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { User } from '../authz/decorators/user.decorator';
import { AuthTokenResponse } from '../authz/dtos/auth-token-res.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { NotificationService } from './notification.service';
import { Response } from 'express';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';


@UseFilters(CustomExceptionFilter)
@Controller()
@ApiTags('notifications')
@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
export class NotificationController {
    constructor(private readonly notificationService: NotificationService
    ) {}
  
    /**
    * Description: Get all notification
    * @param user
    */
     @Get('/notification')
     @UseGuards(AuthGuard('jwt'))
     @ApiBearerAuth()
     @ApiOperation({
         summary: `Fetch all notifications`,
         description: `Fetch all notifications`
     })
     @ApiResponse({ status: 200, description: 'Success', type: AuthTokenResponse })
     async getConnections(
         @User() user: IUserRequest,
         @Res() res: Response
     ): Promise<Response> {
         const connectionDetails = await this.notificationService.getAllNotification(user);
 
         const finalResponse: IResponseType = {
             statusCode: HttpStatus.OK,
             message: ResponseMessages.notification.success.fetch,
             data: connectionDetails.response
         };
         return res.status(HttpStatus.OK).json(finalResponse);
     }
}
