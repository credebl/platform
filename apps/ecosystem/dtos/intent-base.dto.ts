import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { IsNotSQLInjection, trim } from '@credebl/common/cast.helper';

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class IntentBaseDto {
  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'Intent name is required.' })
  @MinLength(2, { message: 'Intent name must be at least 2 characters.' })
  @MaxLength(50, { message: 'Intent name must be at most 50 characters.' })
  @IsString({ message: 'Intent name must be in string format.' })
  @IsNotSQLInjection({ message: 'Incorrect pattern for Intent name.' })
  name: string;

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'Description is required.' })
  @MinLength(2, { message: 'Description must be at least 2 characters.' })
  @MaxLength(255, { message: 'Description must be at most 255 characters.' })
  @IsString({ message: 'Description must be in string format.' })
  @IsNotSQLInjection({ message: 'Incorrect pattern for description.' })
  description: string;
}
