import { IResponse } from '@credebl/common/interfaces/response.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Controller, Logger, Post, Body, UseGuards, HttpStatus, Res, Get, Param, UseFilters, Query, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiForbiddenResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { User } from '../authz/decorators/user.decorator';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ConnectionService } from './connection.service';
import { ConnectionDto, CreateConnectionDto, ReceiveInvitationDto, ReceiveInvitationUrlDto } from './dtos/connection.dto';
import { IUserRequestInterface } from './interfaces';
import { Response } from 'express';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { OrgRoles } from 'libs/org-roles/enums';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { GetAllConnectionsDto } from './dtos/get-all-connections.dto';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { IConnectionSearchCriteria } from '../interfaces/IConnectionSearch.interface';
import { SortFields } from 'apps/connection/src/enum/connection.enum';
import { ClientProxy } from '@nestjs/microservices';

@UseFilters(CustomExceptionFilter)
@Controller()
@ApiTags('connections')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
export class ConnectionController {

    private readonly logger = new Logger('Connection');
    constructor(private readonly connectionService: ConnectionService,
        @Inject('NATS_CLIENT') private readonly connectionServiceProxy: ClientProxy
    ) { }

    /**
        * Get connection details by connectionId
        * @param connectionId
        * @param orgId
        * @returns connection details by connection Id
    */
    @Get('orgs/:orgId/connections/:connectionId')
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER)
    @ApiOperation({
        summary: `Get connections by connection Id`,
        description: `Get connections by connection Id`
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    async getConnectionsById(
        @User() user: IUserRequest,
        @Param('connectionId') connectionId: string,
        @Param('orgId') orgId: string,
        @Res() res: Response
    ): Promise<Response> {
        const connectionsDetails = await this.connectionService.getConnectionsById(user, connectionId, orgId);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.connection.success.fetchConnection,
            data: connectionsDetails
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    /**
    * Description: Get all connections
    * @param user
    * @param orgId
    * 
    */
    @Get('/orgs/:orgId/connections')
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER)
    @ApiOperation({
        summary: `Fetch all connections by orgId`,
        description: `Fetch all connections by orgId`
    })
    @ApiQuery({
        name: 'sortField',
        enum: SortFields,
        required: false
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    async getConnections(
        @Query() getAllConnectionsDto: GetAllConnectionsDto,
        @User() user: IUserRequest,
        @Param('orgId') orgId: string,
        @Res() res: Response
    ): Promise<Response> {

        const { pageSize, searchByText, pageNumber, sortField, sortBy } = getAllConnectionsDto;
        const connectionSearchCriteria: IConnectionSearchCriteria = {
            pageNumber,
            searchByText,
            pageSize,
            sortField,
            sortBy
        };
        const connectionDetails = await this.connectionService.getConnections(connectionSearchCriteria, user, orgId);

        const finalResponse: IResponse = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.connection.success.fetch,
            data: connectionDetails
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    /**
        * Create out-of-band connection legacy invitation
        * @param connectionDto 
        * @param res 
        * @returns Created out-of-band connection invitation url
    */
    @Post('/orgs/:orgId/connections')
    @ApiOperation({ summary: 'Create outbound out-of-band connection (Legacy Invitation)', description: 'Create outbound out-of-band connection (Legacy Invitation)' })
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER)
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
    async createLegacyConnectionInvitation(
        @Param('orgId') orgId: string,
        @Body() connectionDto: CreateConnectionDto,
        @User() reqUser: IUserRequestInterface,
        @Res() res: Response
    ): Promise<Response> {

        connectionDto.orgId = orgId;
        const connectionData = await this.connectionService.createLegacyConnectionInvitation(connectionDto, reqUser);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.connection.success.create,
            data: connectionData
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);

    }

    @Post('/orgs/:orgId/receive-invitation-url')
    @ApiOperation({ summary: 'Receive Invitation URL', description: 'Receive Invitation URL' })
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
    async receiveInvitationUrl(
        @Param('orgId') orgId: string,
        @Body() receiveInvitationUrl: ReceiveInvitationUrlDto,
        @User() user: IUserRequestInterface,
        @Res() res: Response
    ): Promise<Response> {

        const connectionData = await this.connectionService.receiveInvitationUrl(receiveInvitationUrl, orgId, user);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.connection.success.receivenvitation,
            data: connectionData
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }

    @Post('/orgs/:orgId/receive-invitation')
    @ApiOperation({ summary: 'Receive Invitation', description: 'Receive Invitation' })
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
    async receiveInvitation(
        @Param('orgId') orgId: string,
        @Body() receiveInvitation: ReceiveInvitationDto,
        @User() user: IUserRequestInterface,
        @Res() res: Response
    ): Promise<Response> {

        const connectionData = await this.connectionService.receiveInvitation(receiveInvitation, orgId, user);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.connection.success.receivenvitation,
            data: connectionData
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }

    /**
   * Catch connection webhook responses.
   * @Body connectionDto
   * @param orgId
   * @returns Callback URL for connection and created connections details
   */
    @Post('wh/:orgId/connections/')
    @ApiExcludeEndpoint()
    @ApiOperation({
        summary: 'Catch connection webhook responses',
        description: 'Callback URL for connection'
    })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
    async getConnectionWebhook(
        @Body() connectionDto: ConnectionDto,
        @Param('orgId') orgId: string,
        @Res() res: Response
    ): Promise<Response> {
        this.logger.debug(`connectionDto ::: ${JSON.stringify(connectionDto)} ${orgId}`);

        // const webhookUrl = await this.connectionService._getWebhookUrl(connectionDto.contextCorrelationId);

        // if (webhookUrl) {
        //   try {
        //     await this.connectionService._postWebhookResponse(webhookUrl, { data: connectionDto });
        // } catch (error) {
        //     throw new RpcException(error.response ? error.response : error);
        // }
        const connectionData = await this.connectionService.getConnectionWebhook(connectionDto, orgId);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.connection.success.create,
            data: connectionData
        };

        return res.status(HttpStatus.CREATED).json(finalResponse);
    }
}     
