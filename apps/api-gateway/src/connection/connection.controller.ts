import IResponseType from '@credebl/common/interfaces/response.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Controller, Logger, Post, Body, UseGuards, HttpStatus, Res, Get, Param, Query, UseFilters } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiForbiddenResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { User } from '../authz/decorators/user.decorator';
import { AuthTokenResponse } from '../authz/dtos/auth-token-res.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ConnectionService } from './connection.service';
import { ConnectionDto, CreateConnectionDto } from './dtos/connection.dto';
import { IUserRequestInterface } from './interfaces';
import { Response } from 'express';
import { Connections } from './enums/connections.enum';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { OrgRoles } from 'libs/org-roles/enums';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';

@UseFilters(CustomExceptionFilter)
@Controller()
@ApiTags('connections')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
export class ConnectionController {

    private readonly logger = new Logger('Connection');
    constructor(private readonly connectionService: ConnectionService
    ) { }

    /**
        * Description: Get connection by connectionId
        * @param user
        * @param connectionId
        * @param orgId
        * 
    */
    @Get('orgs/:orgId/connections/:connectionId')
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER)
    @ApiOperation({
        summary: `Get connections by connection Id`,
        description: `Get connections by connection Id`
    })
    @ApiResponse({ status: 200, description: 'Success', type: AuthTokenResponse })
    async getConnectionsById(
        @User() user: IUserRequest,
        @Param('connectionId') connectionId: string,
        @Param('orgId') orgId: number,
        @Res() res: Response
    ): Promise<Response> {
        const connectionsDetails = await this.connectionService.getConnectionsById(user, connectionId, orgId);

        const finalResponse: IResponseType = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.connection.success.fetch,
            data: connectionsDetails.response
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    /**
    * Description: Get all connections
    * @param user
    * @param threadId
    * @param connectionId
    * @param state
    * @param orgId
    * 
    */
    @Get('/orgs/:orgId/connections')
    @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
    @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER)
    @ApiOperation({
        summary: `Fetch all connection details`,
        description: `Fetch all connection details`
    })
    @ApiResponse({ status: 200, description: 'Success', type: AuthTokenResponse })
    @ApiQuery(
        { name: 'outOfBandId', required: false }
    )
    @ApiQuery(
        { name: 'alias', required: false }
    )
    @ApiQuery(
        { name: 'state', enum: Connections, required: false }
    )
    @ApiQuery(
        { name: 'myDid', required: false }
    )
    @ApiQuery(
        { name: 'theirDid', required: false }
    )
    @ApiQuery(
        { name: 'theirLabel', required: false }
    )
    async getConnections(
        @User() user: IUserRequest,
        @Query('outOfBandId') outOfBandId: string,
        @Query('alias') alias: string,
        @Query('state') state: string,
        @Query('myDid') myDid: string,
        @Query('theirDid') theirDid: string,
        @Query('theirLabel') theirLabel: string,
        @Param('orgId') orgId: number,
        @Res() res: Response
    ): Promise<Response> {

        // eslint-disable-next-line no-param-reassign
        state = state || undefined;
        const connectionDetails = await this.connectionService.getConnections(user, outOfBandId, alias, state, myDid, theirDid, theirLabel, orgId);

        const finalResponse: IResponseType = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.connection.success.fetch,
            data: connectionDetails.response
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
    @ApiResponse({ status: 201, description: 'Success', type: AuthTokenResponse })
    async createLegacyConnectionInvitation(
        @Param('orgId') orgId: number,
        @Body() connectionDto: CreateConnectionDto,
        @User() reqUser: IUserRequestInterface,
        @Res() res: Response
    ): Promise<Response> {

        connectionDto.orgId = orgId;
        const connectionData = await this.connectionService.createLegacyConnectionInvitation(connectionDto, reqUser);
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.connection.success.create,
            data: connectionData.response
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);

    }

    /**
      * Catch connection webhook responses. 
      * @Body connectionDto
      * @param id 
      * @param res
      */

    @Post('wh/:id/connections/')
    @ApiExcludeEndpoint()
    @ApiOperation({
        summary: 'Catch connection webhook responses',
        description: 'Callback URL for connection'
    })
    @ApiResponse({ status: 200, description: 'Success', type: AuthTokenResponse })
    async getConnectionWebhook(
        @Body() connectionDto: ConnectionDto,
        @Param('id') id: number,
        @Res() res: Response
    ): Promise<object> {
        this.logger.debug(`connectionDto ::: ${JSON.stringify(connectionDto)}`);
        const connectionData = await this.connectionService.getConnectionWebhook(connectionDto, id);
        const finalResponse: IResponseType = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.connection.success.create,
            data: connectionData
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }
}
