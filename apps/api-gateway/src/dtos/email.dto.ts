import { ApiProperty } from '@nestjs/swagger';

export class EmailDto {
    @ApiProperty()
    emailFrom: string;

    @ApiProperty()
    emailTo: string;

    @ApiProperty()
    emailSubject: string;

    @ApiProperty()
    emailText: string;
  
    @ApiProperty()
    emailHtml: string;
}