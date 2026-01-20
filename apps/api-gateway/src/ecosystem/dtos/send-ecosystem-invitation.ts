import { IsEmail, IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Invitation } from '@credebl/enum/enum';
import { Transform } from 'class-transformer';

export class CreateEcosystemInvitationDto {
  @ApiProperty({ example: 'awqx@gmail.com' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString({ message: 'Email should be a string' })
  @Transform(({ value }) => value?.trim())
  email: string;
}

export class InviteMemberToEcosystemDto {
  @ApiProperty({ example: '6e672a9c-64f0-4d98-b312-f578f633800b' })
  @IsUUID()
  @IsNotEmpty({ message: 'OrgId is required' })
  @IsString({ message: 'OrgId should be a string' })
  @Transform(({ value }) => value?.trim())
  orgId: string;

  @ApiProperty({ example: '61ec22e3-9158-409d-874d-345ad2fc51e4' })
  @IsUUID()
  @IsNotEmpty({ message: 'ecosystemId is required' })
  @IsString({ message: 'ecosystemId should be a string' })
  @Transform(({ value }) => value?.trim())
  ecosystemId: string;
}

export class OrgIdParam {
  @IsUUID() // or @IsString()
  orgId: string;
}

export class UpdateEcosystemInvitationDto {
  @ApiProperty({ enum: Invitation, example: Invitation.ACCEPTED })
  @Transform(({ value }) => ('string' === typeof value ? value.toLowerCase() : value))
  @IsEnum(Invitation, { message: `Status must be one of: ${Object.values(Invitation).join(', ')}` })
  @IsNotEmpty({ message: 'Status is required' })
  status: Invitation;

  @ApiProperty({ example: '61ec22e3-9158-409d-874d-345ad2fc51e4' })
  @IsUUID()
  @IsNotEmpty({ message: 'ecosystemId is required' })
  @IsString({ message: 'ecosystemId should be a string' })
  @Transform(({ value }) => value?.trim())
  ecosystemId: string;
}
