import { ApiProperty } from '@nestjs/swagger';

export class ConnectionDto {

    @ApiProperty()
    // tslint:disable-next-line: variable-name
    connection_id: string;

    @ApiProperty()
    state: string;

    @ApiProperty()
    // tslint:disable-next-line: variable-name
    my_did: string;

    @ApiProperty()
    // tslint:disable-next-line: variable-name
    their_did: string;

    @ApiProperty()
    // tslint:disable-next-line: variable-name
    their_label: string;

    @ApiProperty()
    initiator: string;

    @ApiProperty()
    // tslint:disable-next-line: variable-name
    invitation_key: string;

    @ApiProperty()
    // tslint:disable-next-line: variable-name
    routing_state: string;

    @ApiProperty()
    accept: string;

    @ApiProperty()
    // tslint:disable-next-line: variable-name
    invitation_mode: string;

    @ApiProperty()
    // tslint:disable-next-line: variable-name
    updated_at: string;

    @ApiProperty()
    // tslint:disable-next-line: variable-name
    created_at: string;
}