import { ApiProperty } from '@nestjs/swagger';

export class OrgDidRegisterDto {
  @ApiProperty({ required: true })
  orgName: string;

  @ApiProperty({ required: true })
  orgDescription: string;

  @ApiProperty()
  logo: string;

  @ApiProperty({ required: true })
  orgDid: string;

  @ApiProperty({ required: true })
  agentEndpoint: string;

  @ApiProperty({ required: true })
  email: string;
}
