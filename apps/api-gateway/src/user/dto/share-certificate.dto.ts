import { IsArray, IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

class AttributeValue {

    @IsString()
    @IsNotEmpty({ message: 'name is required.' })
    name: string;

    @IsString()
    @IsNotEmpty({ message: 'winner' })
    userType: string;
}

export class CreateUserCertificateDto {

   schemaId: string;

    @ApiProperty({
        'example': [
            {
                name: 'John Doe',
                userType: 'winner'
            }
        ]
    })
    @IsArray({ message: 'attributes must be an array' })
    @IsNotEmpty({ message: 'please provide valid attributes' })
    attributes: AttributeValue[];
}
