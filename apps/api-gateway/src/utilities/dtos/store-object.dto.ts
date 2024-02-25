import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';

// export type StoreObjectDto = InvitationDto;

class ServiceDto {
  @ApiProperty({
    example: 'service-id'
  })
  @IsString()
  @IsNotEmpty({ message: 'please provide valid id' })
  id: string;

  @ApiProperty({
    example: 'http://example.com'
  })
  @IsString()
  @IsNotEmpty({ message: 'please provide valid serviceEndpoint' })
  @IsUrl({}, { message: 'Invalid serviceEndpoint format' })
  serviceEndpoint: string;

  @ApiProperty({
    example: 'service-type'
  })
  @IsString()
  @IsNotEmpty({ message: 'please provide valid type' })
  type: string;

  @ApiProperty({
    example: ['key1', 'key2']
  })
  @IsString({ each: true })
  recipientKeys: string[];

  @ApiPropertyOptional({
    example: ['key1', 'key2']
  })
  @IsOptional()
  @IsString({ each: true })
  routingKeys: string[];

  @ApiPropertyOptional({
    example: ['true']
  })
  @IsOptional()
  @IsString({ each: true })
  accept: string[];
}

export class InvitationDto {
  @ApiPropertyOptional({
    example: 'your-id'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'please provide valid @id' })
  '@id': string;

  @ApiProperty({
    example: 'your-type'
  })
  @IsString()
  @IsNotEmpty({ message: 'please provide valid @type' })
  '@type': string;

  @ApiProperty({
    example: 'your-label'
  })
  @IsString()
  @IsNotEmpty({ message: 'please provide valid label' })
  label: string;

  @ApiPropertyOptional({
    example: 'your-goal-code'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'please provide valid goalCode' })
  goalCode: string;

  @ApiPropertyOptional({
    example: 'your-goal'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'please provide valid goal' })
  goal: string;

  @ApiPropertyOptional({
    example: ['accept1', 'accept2']
  })
  @IsOptional()
  @IsString({ each: true })
  accept: string[];

  @ApiPropertyOptional({
    example: ['protocol1', 'protocol2']
  })
  @IsOptional()
  @IsString({ each: true })
  // eslint-disable-next-line camelcase
  handshake_protocols: string[];

  @ApiProperty(
  //   {
  //   'example': [
  //     {
  //       id: 'service-id',
  //       serviceEndpoint: 'http://example.com',
  //       type: 'service-type',
  //       recipientKeys: ['key1', 'key2'],
  //       routingKeys: ['key1', 'key2'],
  //       accept: ['true']
  //     }
  //   ]
  // }
  )
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services: ServiceDto[];

  @ApiPropertyOptional({
    example: 'http://example.com/image.jpg'
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'please provide valid imageUrl' })
  @IsString()
  imageUrl?: string;
}

export class StoreObjectDto {
  @ApiProperty({
    'example': {
      '@id': 'your-id',
      '@type': 'your-type',
      label: 'your-label',
      goalCode: 'your-goal-code',
      goal: 'your-goal',
      accept: ['accept1', 'accept2'],
      // eslint-disable-next-line camelcase
      handshake_protocols: ['protocol1', 'protocol2'],
      services: [
        {
          id: 'service-id',
          serviceEndpoint: 'http://example.com',
          type: 'service-type',
          recipientKeys: ['key1', 'key2'],
          routingKeys: ['key1', 'key2'],
          accept: ['true']
        }
        // Add more service objects as needed
      ],
      imageUrl: 'http://example.com/image.jpg'
    }
  })
  @ValidateNested()
  @Type(() => InvitationDto)
  data: InvitationDto;
}
