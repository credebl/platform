
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Invitation } from '@credebl/enum/enum';
import { PaginationDto } from '@credebl/common/dtos/pagination.dto';

export class GetAllSentEcosystemInvitationsDto extends PaginationDto {

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    status = Invitation.PENDING;
}
