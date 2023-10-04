import { ApiBearerAuth, ApiForbiddenResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Controller, UseFilters, Put, Param, UseGuards } from '@nestjs/common';
import { EcosystemService } from './ecosystem.service';
import { Post, Get } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { Res } from '@nestjs/common';
import { CreateEcosystemDto } from './dtos/create-ecosystem-dto';
import IResponseType from '@credebl/common/interfaces/response.interface';
import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { ResponseMessages } from '@credebl/common/response-messages';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { EditEcosystemDto } from './dtos/edit-ecosystem-dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../authz/decorators/user.decorator';
import { BulkEcosystemInvitationDto } from './dtos/send-invitation.dto';


@UseFilters(CustomExceptionFilter)
@Controller('ecosystem')
@ApiTags('ecosystem')
@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
export class EcosystemController {
  constructor(
    private readonly ecosystemService: EcosystemService
  ) { }


  @Get('/')
  @ApiOperation({ summary: 'Get all ecosystem', description: 'Get all existing ecosystem' })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getEcosystem(@Res() res: Response): Promise<Response>  {
    const ecosystemList = await this.ecosystemService.getAllEcosystem();
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.fetch,
      data: ecosystemList.response
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Post('/')
  @ApiOperation({ summary: 'Create a new ecosystem', description: 'Create an ecosystem' })
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async createNewEcosystem(@Body() createOrgDto: CreateEcosystemDto, @Res() res: Response): Promise<Response> {
    await this.ecosystemService.createEcosystem(createOrgDto);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.create
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }


  /**
   * 
   * @param bulkInvitationDto 
   * @param ecosystemId 
   * @param user 
   * @param res 
   * @returns Ecosystem invitation send details
   */
  @Post('/:ecosystemId/invitations')
  @ApiOperation({
    summary: 'Send ecosystem invitation',
    description: 'Send ecosystem invitation'
  })
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async createInvitation(@Body() bulkInvitationDto: BulkEcosystemInvitationDto, @Param('ecosystemId') ecosystemId: string, @User() user: user, @Res() res: Response): Promise<Response> {

    bulkInvitationDto.ecosystemId = ecosystemId;
    await this.ecosystemService.createInvitation(bulkInvitationDto, String(user.id));

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.createInvitation
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);

  }


  @Put('/:ecosystemId/')
  @ApiOperation({ summary: 'Edit ecosystem', description: 'Edit existing ecosystem' })
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async editEcosystem(@Body() editEcosystemDto: EditEcosystemDto, @Param('ecosystemId') ecosystemId: string, @Res() res: Response): Promise<Response> {
    await this.ecosystemService.editEcosystem(editEcosystemDto, ecosystemId);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.update
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

}