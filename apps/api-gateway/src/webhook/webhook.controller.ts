import type { IResponse } from '@credebl/common/interfaces/response.interface'
import { ResponseMessages } from '@credebl/common/response-messages'
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler'
import type { Response } from 'express'
import { OrgRoles } from 'libs/org-roles/enums'
import { Roles } from '../authz/decorators/roles.decorator'
import { OrgRolesGuard } from '../authz/guards/org-roles.guard'
import { ApiResponseDto } from '../dtos/apiResponse.dto'
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto'
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto'
import type { GetWebhookDto } from './dtos/get-webhoook-dto'
import type { RegisterWebhookDto } from './dtos/register-webhook-dto'
import type { WebhookService } from './webhook.service'

@UseFilters(CustomExceptionFilter)
@Controller('webhooks')
@ApiTags('webhooks')
@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}
  private readonly logger = new Logger('WebhookController')
  private readonly PAGE: number = 1

  /**
   * Register a webhook URL for an organization
   * @param orgId The ID of the organization
   * @param registerWebhookDto The webhook registration details
   * @param res The response object
   * @returns The registered webhook details
   */
  @Post('/orgs/:orgId/register')
  @ApiOperation({
    summary: 'Register Webhook',
    description: 'Register a webhook URL for an organization.',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Webhook URL registered successfully', type: ApiResponseDto })
  async registerWebhook(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId)
        },
      })
    )
    orgId: string,
    @Body() registerWebhookDto: RegisterWebhookDto,
    @Res() res: Response
  ): Promise<Response> {
    registerWebhookDto.orgId = orgId

    const webhookRegisterDetails = await this.webhookService.registerWebhook(registerWebhookDto)

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.agent.success.webhookUrlRegister,
      data: webhookRegisterDetails,
    }

    return res.status(HttpStatus.CREATED).json(finalResponse)
  }

  /**
   * Get the webhook URL details for an organization
   * @param getWebhook The webhook query parameters
   * @param res The response object
   * @returns The webhook URL details
   */
  @Get('/orgs/webhookurl')
  @ApiOperation({
    summary: 'Get Webhook URL Details',
    description: 'Retrieve the details of the webhook URL for an organization.',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Roles(OrgRoles.OWNER, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.ADMIN)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook URL details retrieved successfully',
    type: ApiResponseDto,
  })
  async getWebhookUrl(@Query() getWebhook: GetWebhookDto, @Res() res: Response): Promise<Response> {
    const webhookUrlData = await this.webhookService.getWebhookUrl(getWebhook)

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.agent.success.getWebhookUrl,
      data: webhookUrlData,
    }

    return res.status(HttpStatus.OK).json(finalResponse)
  }
}
