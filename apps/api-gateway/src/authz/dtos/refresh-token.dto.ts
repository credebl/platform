import { IsNotEmpty } from 'class-validator'

import { trim } from '@credebl/common/cast.helper'
import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'

export class RefreshTokenDto {
  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'refreshToken is required.' })
  refreshToken: string
}
