import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { trim } from '@credebl/common/cast.helper';

@ApiExtraModels()
export class SendInvitationDto {

    @ApiProperty({ example: 'awqx@getnada.com' })
    @IsEmail()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'Please provide valid email' })
    @IsString({ message: 'email should be string' })
    email: string;

    @ApiProperty({ example: [2, 1, 3] })
    @IsNotEmpty({ message: 'Please provide valid orgRoleId' })
    @IsArray()
    orgRoleId: string[];

}

@ApiExtraModels()
export class BulkSendInvitationDto {

    @ApiProperty({ type: [SendInvitationDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SendInvitationDto)
    invitations: SendInvitationDto[];
    orgId: string;
}