import { IsArray, IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class SendInviteToOrgDto {
    
    @ApiProperty({ 'example': '[{"orgName":"xyz","orgEmail":"xyz@gmail.com","orgRole": 1}]' })
    @IsArray({ message: 'attributes must be an array' })
    // @IsString({ each: true })
    @IsNotEmpty({ message: 'please provide valid attributes' })
    emails : InvitationEmailIds[];
   
    @ApiProperty()
    @IsString({ message: 'description must be a string' })
    description :string;   
    
}

export class InvitationEmailIds {

  orgName : string;
  orgEmail : string;
  orgRole : string[];

}