import { IsArray, IsInt, IsNotEmpty  } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

interface featurePriceData {
    featureId: number,
    featurePrice: number
}
export class CreateFeaturePriceDto {

    @ApiProperty({ 'example': 1 })
    @IsNotEmpty({ message: 'Please provide network id.' })
    @IsInt({ message: 'Please provide valid network id.' })
    networkID: number;

    @ApiProperty({
        'example': [
{
            featureId: 1,
            featurePrice: 200
        },
        {
            featureId: 2,
            featurePrice: 400
        }
]
    })
    @IsNotEmpty({ message: 'Please provide featureId and price.' })
    @IsArray({ message: 'FeatureId and price should be in array format.' })
    featurePrice: featurePriceData[];
}
