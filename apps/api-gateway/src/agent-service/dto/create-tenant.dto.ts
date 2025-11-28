import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

export class CreateTenantDto {
  @ApiProperty()
  @MaxLength(25, { message: 'Maximum length for label must be 25 characters.' })
  @IsString({ message: 'label must be in string format.' })
  @Transform(({ value }) => trim(value))
  @MinLength(2, { message: 'Minimum length for label must be 2 characters.' })
  label: string;

  @ApiProperty({ example: 'ojIckSD2jqNzOqIrAGzL' })
  @IsOptional()
  @ApiPropertyOptional()
  @IsString({ message: 'clientSocketId must be in string format.' })
  clientSocketId?: string;

  @ApiProperty({ example: 'XzFjo1RTZ2h9UVFCnPUyaQ' })
  @IsOptional()
  @ApiPropertyOptional()
  @IsString({ message: 'did must be in string format.' })
  did?: string;

  orgId: string;
}
