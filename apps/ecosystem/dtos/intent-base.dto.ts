import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { IsNotSQLInjection, trim } from '@credebl/common/cast.helper';

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class IntentBaseDto {
  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @MinLength(2, { message: 'Intent name must be at least 2 characters.' })
  @MaxLength(50, { message: 'Intent name must be at most 50 characters.' })
  @IsString({ message: 'Intent name must be in string format.' })
  @IsNotEmpty({ message: 'Intent name is required.' })
  @IsNotSQLInjection({ message: 'Incorrect pattern for Intent name.' })
  name: string;

  @ApiProperty()
  @IsNotSQLInjection({ message: 'Incorrect pattern for description.' })
  @Transform(({ value }) => trim(value))
  @MaxLength(255, { message: 'Description must be at most 255 characters.' })
  @IsNotEmpty({ message: 'Description is required.' })
  @MinLength(2, { message: 'Description must be at least 2 characters.' })
  @IsString({ message: 'Description must be in string format.' })
  description: string;
}
