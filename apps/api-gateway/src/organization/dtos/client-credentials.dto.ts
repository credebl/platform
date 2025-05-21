import { ApiExtraModels, ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

import { trim } from '@credebl/common/cast.helper'
import { Transform } from 'class-transformer'

@ApiExtraModels()
export class ClientCredentialsDto {
  clientId: string

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'clientSecret is required.' })
  @IsString({ message: 'clientSecret must be in string format.' })
  clientSecret: string
}
