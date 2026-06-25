import { ApiExtraModels, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

@ApiExtraModels()
export class GetWebhookDto {

    @ApiProperty({example: '2a041d6e-d24c-4ed9-b011-1cfc371a8b8e'})
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'Please provide the valid orgID' })
    @IsString({ message: 'Organization id must be in string format.' })
    orgId: string;

    @ApiPropertyOptional({example: '3a041d6e-d24c-4ed9-b011-1cfc371a8b8e'})
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsUUID('4', { message: 'Please provide valid tenantId' })
    @IsString({ message: 'Tenant id must be in string format.' })
    tenantId?: string;
}