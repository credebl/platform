import { ApiExtraModels, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

@ApiExtraModels()
export class GetWebhookDto {

    @ApiPropertyOptional({example: '2a041d6e-d24c-4ed9-b011-1cfc371a8b8e'})
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'Organization id must be in string format.' })
    orgId?: string;

    @ApiPropertyOptional({example: '3a041d6e-d24c-4ed9-b011-1cfc371a8b8e'})
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'Tenant id must be in string format.' })
    tenantId?: string;
}