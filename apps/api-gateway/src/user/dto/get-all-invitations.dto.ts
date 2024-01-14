import { IsOptional, IsString} from 'class-validator';


import { ApiProperty } from '@nestjs/swagger';
import { Invitation } from '@credebl/enum/enum';
import { PaginationDto } from '@credebl/common/dtos/pagination.dto';

export class GetAllInvitationsDto extends PaginationDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    status = Invitation.PENDING;

}
