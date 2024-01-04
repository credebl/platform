import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

@ApiExtraModels()
export class deleteEcosystemInvitationsDto {
  @ApiProperty({ example: 'awqx@getnada.com' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString({ message: 'Email should be a string' })
  @Transform(({ value }) => trim(value))
  email: string;

    ecosystemId: string;
    invitationId: string;
    orgId: string; 
  }
  