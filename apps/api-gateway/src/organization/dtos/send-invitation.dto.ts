import { trim } from '@credebl/common/cast.helper'
import { ApiExtraModels, ApiProperty } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { IsArray, IsEmail, IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator'

@ApiExtraModels()
export class SendInvitationDto {
  @ApiProperty({ example: 'awqx@yopmail.com' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString({ message: 'Email should be a string' })
  @Transform(({ value }) => trim(value))
  email: string

  @ApiProperty({ example: ['1a7eac11-ff05-40d7-8351-4d7467687cad'] })
  @IsNotEmpty({ message: 'Please provide valid orgRoleId' })
  @IsArray()
  @IsUUID('4', { each: true, message: 'Invalid format of orgRoleId' })
  orgRoleId: string[]
}

@ApiExtraModels()
export class BulkSendInvitationDto {
  @ApiProperty({
    example: [
      {
        email: 'awqx@yopmail.com',
        orgRoleId: ['1a7eac11-ff05-40d7-8351-4d7467687cad'],
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SendInvitationDto)
  invitations: SendInvitationDto[]

  orgId: string
}
