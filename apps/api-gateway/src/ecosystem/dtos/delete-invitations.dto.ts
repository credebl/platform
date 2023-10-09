import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

@ApiExtraModels()
export class deleteEcosystemInvitationsDto {
    @ApiProperty({ example: 'acqx@getnada.com' })
    @IsEmail()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'Please provide valid email' })
    @IsString({ message: 'email should be string' })
    email: string;

    ecosystemId: string;
    invitationId: string;
    orgId: string; 
  }
  