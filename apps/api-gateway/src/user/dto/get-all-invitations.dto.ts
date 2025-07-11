import { IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Invitation } from '@credebl/common';
import { PaginationDto } from '@credebl/common';

export class GetAllInvitationsDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status = Invitation.PENDING;
}
