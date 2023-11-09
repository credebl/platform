import { IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserCertificateDto {

    @ApiProperty()   
    credentialId: string;

    @ApiProperty()
    schemaId: string;

    @ApiProperty({
        'example': [
            {
                name: 'name',
                value: 'value'
            }
        ]
    })
    @IsObject({ message: 'attributes must be a valid object' })
    @IsNotEmpty({ message: 'please provide valid attributes' })
    attributes: object[];
}
