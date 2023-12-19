import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

@ApiExtraModels()
export class EcosystemInvitationDto {

    @ApiProperty({ example: 'awqx@getnada.com' })
    @IsEmail({}, { message: 'Please provide a valid email' })
    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email should be a string' })
    @Transform(({ value }) =>  'string' === typeof value ? value.trim() : value)
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