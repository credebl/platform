import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { trim } from '@credebl/common/cast.helper';

@ApiExtraModels()
export class EcosystemInvitationDto {

    @ApiProperty({ example: 'acqx@getnada.com' })
    @IsEmail()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'Please provide valid email' })
    @IsString({ message: 'email should be string' })
    email: string;

}

@ApiExtraModels()
export class BulkEcosystemInvitationDto {

    @ApiProperty({ type: [EcosystemInvitationDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EcosystemInvitationDto)
    invitations: EcosystemInvitationDto[];
    ecosystemId: string;
}