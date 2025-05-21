import { IsEnum, IsNotEmpty, IsString } from 'class-validator'

import { trim } from '@credebl/common/cast.helper'
import { Invitation } from '@credebl/enum/enum'
import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'

export class AcceptRejectInvitationDto {
  invitationId: string

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Please provide valid orgId' })
  @IsString()
  orgId: string

  @ApiProperty({
    enum: [Invitation.ACCEPTED, Invitation.REJECTED],
  })
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'Please provide valid status' })
  @IsEnum(Invitation)
  status: Invitation.ACCEPTED | Invitation.REJECTED
}
