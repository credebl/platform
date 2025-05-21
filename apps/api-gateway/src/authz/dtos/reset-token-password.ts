import { IsNotEmpty } from 'class-validator'

import { trim } from '@credebl/common/cast.helper'
import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'

export class ResetTokenPasswordDto {
  email: string

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'password is required.' })
  password: string

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'token is required.' })
  token: string
}
