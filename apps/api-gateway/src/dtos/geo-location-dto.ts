import { ApiExtraModels, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

@ApiExtraModels()
export class GeoLocationDto {
  @ApiPropertyOptional({ example: 101 })
  @IsOptional()
  @IsNotEmpty({ message: 'country is required' })
  @IsNumber({}, { message: 'countryId must be a number' })
  countryId?: number;

  @ApiPropertyOptional({ example: 4008 })
  @IsOptional()
  @IsNotEmpty({ message: 'state is required' })
  @IsNumber({}, { message: 'stateId must be a number' })
  stateId?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNotEmpty({ message: 'city is required' })
  @IsNumber({}, { message: 'cityId must be a number' })
  cityId?: number;
}
