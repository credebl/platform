/* eslint-disable camelcase */
import { ApiProperty } from '@nestjs/swagger';

export class CompleteConnectionDto {
  @ApiProperty()
  connection_id: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  my_did: string;

  @ApiProperty()
  their_did: string;

  @ApiProperty()
  their_label: string;

  @ApiProperty()
  initiator: string;

  @ApiProperty()
  invitation_key: string;

  @ApiProperty()
  routing_state: string;

  @ApiProperty()
  accept: string;

  @ApiProperty()
  invitation_mode: string;

  @ApiProperty()
  updated_at: string;

  @ApiProperty()
  created_at: string;
}
