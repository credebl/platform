import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class EnableEcosystemDto {
  @ApiProperty({
    example: true,
    description: 'Enable or disable ecosystem creation'
  })
  @IsBoolean()
  isEcosystemEnabled: boolean;
}
