/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import {
  Controller,
  Post,
  Body,
  Logger,
  UseGuards,
  BadRequestException,
  HttpStatus,
  Res,
  Get,
  Param,
  UseFilters,
  ParseUUIDPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth
 
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';

import { Response } from 'express';
import  { IResponse } from '@credebl/common/interfaces/response.interface';
import { WebhookService } from './webhook.service';
import {
  RegisterWebhookDto
} from './dtos/register-webhook-dto';
import { ResponseMessages } from '@credebl/common/response-messages';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { OrgRoles } from 'libs/org-roles/enums';
import { Roles } from '../authz/decorators/roles.decorator';

@UseFilters(CustomExceptionFilter)
@Controller('webhooks')
@ApiTags('webhooks')
@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService

  ) {}
  private readonly logger = new Logger('WebhookController');
  private readonly PAGE: number = 1;

  
@Post('/orgs/:orgId/register')
@ApiOperation({
summary: 'Register Webhook',
description: 'Register a webhook url'
})
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), OrgRolesGuard)
@Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
@ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
async registerWebhook(@Param('orgId', new ParseUUIDPipe({exceptionFactory: (): Error => { throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId); }})) orgId: string, @Body() registerWebhookDto: RegisterWebhookDto,
@Res() res: Response): Promise<Response> {
registerWebhookDto.orgId = orgId;

const webhookRegisterDetails = await this.webhookService.registerWebhook(registerWebhookDto);

const finalResponse: IResponse = {
  statusCode: HttpStatus.CREATED,
  message: ResponseMessages.agent.success.webhookUrlRegister,
  data: webhookRegisterDetails
};

return res.status(HttpStatus.CREATED).json(finalResponse);
}


@Get('/orgs/:tenantId/webhookurl')
  @ApiOperation({
    summary: 'Get the webhookurl details',
    description: 'Get the webhookurl details'
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Roles(OrgRoles.OWNER, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.ADMIN)
  async getWebhookUrl(
    @Param('tenantId') tenantId: string,
    @Res() res: Response
  ): Promise<Response> {
  
    // eslint-disable-next-line no-param-reassign
    tenantId = tenantId.trim();
    if (!tenantId.length) {
      throw new BadRequestException(ResponseMessages.agent.error.requiredTenantId);
    }

    const webhookUrlData = await this.webhookService.getWebhookUrl(tenantId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.agent.success.getWebhookUrl,
      data: webhookUrlData
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }


}
