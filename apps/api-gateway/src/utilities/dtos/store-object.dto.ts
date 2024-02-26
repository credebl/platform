import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';

// export type StoreObjectDto = InvitationDto;

// class ServiceDto {
//   @ApiProperty({
//     example: 'service-id'
//   })
//   @IsString()
//   @IsNotEmpty({ message: 'please provide valid id' })
//   id: string;

//   @ApiProperty({
//     example: 'http://example.com'
//   })
//   @IsString()
//   @IsNotEmpty({ message: 'please provide valid serviceEndpoint' })
//   @IsUrl({}, { message: 'Invalid serviceEndpoint format' })
//   serviceEndpoint: string;

//   @ApiProperty({
//     example: 'service-type'
//   })
//   @IsString()
//   @IsNotEmpty({ message: 'please provide valid type' })
//   type: string;

//   @ApiProperty({
//     example: ['key1', 'key2']
//   })
//   @IsString({ each: true })
//   recipientKeys: string[];

//   @ApiPropertyOptional({
//     example: ['key1', 'key2']
//   })
//   @IsOptional()
//   @IsString({ each: true })
//   routingKeys: string[];

//   @ApiPropertyOptional({
//     example: ['true']
//   })
//   @IsOptional()
//   @IsString({ each: true })
//   accept: string[];
// }

export class LegacyInvitationDto {

  @ApiProperty({
    example: 'your-type'
  })
  @IsString()
  @IsNotEmpty({ message: 'please provide valid @type' })
  '@type': string;

  @ApiPropertyOptional({
    example: 'your-id'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'please provide valid @id' })
  '@id': string;

  @ApiProperty({
    example: 'your-label'
  })
  @IsString()
  @IsNotEmpty({ message: 'please provide valid label' })
  label: string;

  @ApiPropertyOptional({
    example: 'http://example.com/image.jpg'
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'please provide valid imageUrl' })
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    example: ['key1', 'key2']
  })
  @IsString({ each: true })
  recipientKeys: string[];

  @ApiProperty({
    example: 'http://example.com'
  })
  @IsString()
  @IsNotEmpty({ message: 'please provide valid serviceEndpoint' })
  @IsUrl({}, { message: 'Invalid serviceEndpoint format' })
  serviceEndpoint: string;

  @ApiPropertyOptional({
    example: ['key1', 'key2']
  })
  @IsOptional()
  @IsString({ each: true })
  routingKeys: string[];
}

//   @ApiPropertyOptional({
//     example: 'your-goal-code'
//   })
//   @IsOptional()
//   @IsString()
//   @IsNotEmpty({ message: 'please provide valid goalCode' })
//   goalCode: string;

//   @ApiPropertyOptional({
//     example: 'your-goal'
//   })
//   @IsOptional()
//   @IsString()
//   @IsNotEmpty({ message: 'please provide valid goal' })
//   goal: string;

//   @ApiPropertyOptional({
//     example: ['accept1', 'accept2']
//   })
//   @IsOptional()
//   @IsString({ each: true })
//   accept: string[];

//   @ApiPropertyOptional({
//     example: ['protocol1', 'protocol2']
//   })
//   @IsOptional()
//   @IsString({ each: true })
//   // eslint-disable-next-line camelcase
//   handshake_protocols: string[];

//   @ApiProperty(
//   //   {
//   //   'example': [
//   //     {
//   //       id: 'service-id',
//   //       serviceEndpoint: 'http://example.com',
//   //       type: 'service-type',
//   //       recipientKeys: ['key1', 'key2'],
//   //       routingKeys: ['key1', 'key2'],
//   //       accept: ['true']
//   //     }
//   //   ]
//   // }
//   )
//   @ValidateNested({ each: true })
//   @Type(() => ServiceDto)
//   services: ServiceDto[];
// }

export class StoreObjectDto {
  @ApiProperty({
    'example': {
      '@type': 'your-type',
      '@id': 'your-id',
      label: 'your-label',
      imageUrl: 'http://example.com/image.jpg',
      recipientKeys: ['key1', 'key2'],
      serviceEndpoint: 'http://example.com',
      routingKeys: ['key1', 'key2']
    }
  })
  @ValidateNested()
  @Type(() => LegacyInvitationDto)
  data: LegacyInvitationDto;
}
