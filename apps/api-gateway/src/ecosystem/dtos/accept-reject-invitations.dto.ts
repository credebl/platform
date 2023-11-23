import { IsEnum, IsNotEmpty, IsString, MaxLength, MinLength} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Invitation } from '@credebl/enum/enum';
import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

export class AcceptRejectEcosystemInvitationDto {
    
    ecosystemId: string;
    invitationId: string;
    orgId: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'organization name is required.' })
    @MinLength(2, { message: 'organization name must be at least 2 characters.' })
    @MaxLength(50, { message: 'organization name must be at most 50 characters.' })
    @IsString({ message: 'organization name must be in string format.' })
    orgName: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'organization did is required.' })
    @IsString({ message: 'organization did must be in string format.' })
    orgDid: string;

    @ApiProperty({
        enum: [Invitation.ACCEPTED, Invitation.REJECTED]
    })
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'Please provide valid status' })
    @IsEnum(Invitation)
    status: Invitation.ACCEPTED | Invitation.REJECTED;

    userId?: string;


}