import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

@ApiExtraModels()

export class StoreObjectDto {

  @ApiProperty({
    description: 'The data to be stored'
  })
  data: object;
}