import {
  IsString,
  IsBoolean,
  IsArray,
  IsOptional,
  IsNumber,
  IsObject,
  ValidateNested,
  IsUrl,
  IsISO8601
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class Thread {
  @IsString()
  @IsOptional()
  pthid: string;

  @IsString()
  @IsOptional()
  thid: string;
}

class Message {
  @IsString()
  @IsOptional()
  '@type': string;

  @IsString()
  @IsOptional()
  '@id': string;

  @ValidateNested()
  @IsOptional()
  @Type(() => Thread)
  '~thread': Thread;

  @IsString()
  @IsOptional()
  messageType: string;
}

class Data {
  @IsOptional()
  @IsString()
  base64?: string;

  @IsOptional()
  @IsString()
  json?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  links?: string[];

  @IsOptional()
  @IsObject()
  jws?: {
    header: object;
    signature: string;
    protected: string;
  };

  @IsOptional()
  @IsString()
  sha256?: string;
}

class AppendedAttachment {
  @IsString()
  @IsOptional()
  id: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  filename: string;

  @IsString()
  @IsOptional()
  mimeType: string;

  @IsISO8601()
  @IsOptional()
  lastmodTime: string;

  @IsNumber()
  @IsOptional()
  byteCount: number;

  @ValidateNested()
  @IsOptional()
  @Type(() => Data)
  data: Data;
}

export class CreateConnectionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  label: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  alias: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  multiUseInvitation: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  autoAcceptConnection: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  goalCode: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  goal: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  handshake: boolean;

  @ApiPropertyOptional({ example: ['https://didcomm.org/didexchange/1.x'] })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  handshakeProtocols: string[];

  @ApiPropertyOptional({
    example: [
      {
        '@type': 'string',
        '@id': 'string',
        '~thread': {
          pthid: 'string',
          thid: 'string'
        },
        messageType: 'string',
        additionalProp1: 'string',
        additionalProp2: 'string',
        additionalProp3: 'string'
      }
    ]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Message)
  messages: Message[];

  @ApiPropertyOptional({
    example: [
      {
        id: 'string',
        description: 'string',
        filename: 'string',
        mimeType: 'string',
        lastmodTime: '2024-07-19T13:24:42.255Z',
        byteCount: 0,
        data: {
          base64: 'string',
          json: 'string',
          links: ['string'],
          jws: {
            header: {},
            signature: 'string',
            protected: 'string'
          },
          sha256: 'string'
        }
      }
    ]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppendedAttachment)
  appendedAttachments: AppendedAttachment[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invitationDid: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipientKey: string;

  userId: string;
  email: string;
}
