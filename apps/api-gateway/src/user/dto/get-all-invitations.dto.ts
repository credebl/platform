import { IsOptional, IsString} from 'class-validator';


import { ApiPropertyOptional } from '@nestjs/swagger';
import { Invitation } from '@credebl/enum/enum';
import { PaginationDto } from '@credebl/common/dtos/pagination.dto';

export class GetAllInvitationsDto extends PaginationDto {
    @ApiPropertyOptional({ required: false })
    @IsOptional()
    @IsString()
    status = Invitation.PENDING;

}
