import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty, IsObject} from 'class-validator';


export class SendProofRequest {    
    @ApiProperty({ 'example': '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
    @IsString({message:'connection id must be string'}) 
    @IsNotEmpty({message:'please provide valid connection Id'})
    connectionId: string;

    @ApiProperty({
        'example': [
{
            attributeName: 'attributeName',
            condition: '>=',
            value: 'predicates',
            credDefId: '',
            credentialName:''
        }
]
    })
    @IsArray({message:'attributes must be in array'}) 
    @IsObject({each:true})
    @IsNotEmpty({message:'please provide valid attributes'}) 
    attributes: object[];
}