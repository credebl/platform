import { IsEnum, IsNotEmpty} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Invitation } from '@credebl/enum/enum';
import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

export class AcceptRejectEcosystemInvitationDto {
    
    ecosystemId: string;
    invitationId: string;
    orgId: string;

    @ApiProperty({
        enum: [Invitation.ACCEPTED, Invitation.REJECTED]
    })
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'Please provide valid status' })
    @IsEnum(Invitation)
    status: Invitation.ACCEPTED | Invitation.REJECTED;

    userId?: string;


}