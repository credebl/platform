import { trim } from '@credebl/common/cast.helper';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl} from 'class-validator';

export class RegisterWebhookDto {

orgId: string;

@ApiProperty()
@Transform(({ value }) => trim(value))
@IsNotEmpty({ message: 'webhookUrl is required.' })
@IsString({ message: 'webhookUrl must be in string format.' })
@IsUrl(undefined, {message:'URL is not valid'})
webhookUrl: string;
}