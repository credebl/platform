import { Controller, Get, HttpStatus, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import IResponse from '@credebl/common/interfaces/response.interface';
import { OrgRoles } from 'libs/org-roles/enums';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { HealthService } from './health.service';

@Controller('platform/health')
@ApiTags('platform')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('/')
  @ApiOperation({
    summary: 'Platform service health',
    description:
      'Aggregated health of every microservice: the HTTP /health/ready probe (HEALTH_TARGETS) and a NATS ping through the service message loop. Cached for 5 seconds.'
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.PLATFORM_ADMIN)
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async getPlatformHealth(@Res() res: Response): Promise<Response> {
    const data = await this.healthService.getPlatformHealth();
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Platform health fetched successfully',
      data
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }
}
