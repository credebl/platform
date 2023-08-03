import { ApiProperty } from '@nestjs/swagger';

export class CreateProofRequest {
    @ApiProperty({'example': 'comments'})
    comment: string;

    @ApiProperty({ 'example': 'WgWxqztrNooG92RXvxSTWv:3:CL:20:tag' })
    credDefId?: string;

    @ApiProperty({
        'example': [
{
            attributeName: 'attributeName',
            condition: '>=',
            value: 'predicates'
        }
]
    })
    attributes: object[];
}