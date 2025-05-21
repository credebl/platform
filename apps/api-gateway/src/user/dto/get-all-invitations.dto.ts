import { IsOptional, IsString } from 'class-validator'

import { PaginationDto } from '@credebl/common/dtos/pagination.dto'
import { Invitation } from '@credebl/enum/enum'
import { ApiProperty } from '@nestjs/swagger'

export class GetAllInvitationsDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status = Invitation.PENDING
}
