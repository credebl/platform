import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetDidsDto {
  @ApiPropertyOptional({ description: 'Include archived DIDs in the list', default: false })
  @IsOptional()
  @Transform(({ value }) => {
    const normalized = 'string' === typeof value ? value.trim().toLowerCase() : value;
    if ('true' === normalized) {
      return true;
    }
    return 'false' === normalized ? false : value;
  })
  @IsBoolean({ message: 'includeArchived must be true or false.' })
  includeArchived?: boolean = false;
}
