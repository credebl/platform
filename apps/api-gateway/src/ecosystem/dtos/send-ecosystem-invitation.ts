import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SendEcosystemCreateDto {
  @ApiProperty({ example: 'awqx@yopmail.com' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString({ message: 'Email should be a string' })
  @Transform(({ value }) => value?.trim())
  email: string;

  userId: string;
}


export class inviteMemberToEcosystemDto {
  @ApiProperty({ example: '6e672a9c-64f0-4d98-b312-f578f633800b' })
  @IsUUID()
  @IsNotEmpty({ message: 'OrgId is required' })
  @IsString({ message: 'OrgId should be a string' })
  @Transform(({ value }) => value?.trim())
  orgId: string;
}
