import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserLogoutDto {
  @ApiPropertyOptional({
    description: 'List of session IDs to log out',
    type: [String]
  })
  @IsOptional()
  @IsArray({ message: 'sessions must be an array' })
  @IsString({ each: true, message: 'each session Id must be a string' })
  @IsNotEmpty({ each: true, message: 'session Id must not be empty' })
  sessions?: string[];
}
