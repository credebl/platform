import { trim } from '@credebl/common/cast.helper';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class WebhookResponseDto {
   
@ApiProperty()
@Transform(({ value }) => trim(value))
@IsNotEmpty({ message: 'webhookUrl is required.' })
@IsString({ message: 'webhookUrl must be in string format.' })
webhookUrl: string;

@ApiProperty()
@Transform(({ value }) => trim(value))
@IsNotEmpty({ message: 'data is required.' })
@IsObject({ message: 'data must be an object' })
data:object;
}