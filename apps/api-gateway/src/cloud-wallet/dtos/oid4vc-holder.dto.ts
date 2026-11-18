import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength
} from 'class-validator';
import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

const OFFER_PATTERN = /^(openid-credential-offer:\/\/|https?:\/\/)/i;

export class ResolveOid4vcCredentialOfferDto {
  @ApiProperty({
    example:
      'openid-credential-offer://?credential_offer_uri=https%3A%2F%2Fissuer.example%2Foid4vci%2Fdgft%2Foffers%2F1bb1',
    description: 'The credential offer link from the QR code, or the https URI of the offer'
  })
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'credentialOffer must be a string' })
  @IsNotEmpty({ message: 'credentialOffer is required' })
  @MaxLength(4096, { message: 'credentialOffer must be at most 4096 characters' })
  @Matches(OFFER_PATTERN, { message: 'credentialOffer must be an openid-credential-offer:// link or an https URI' })
  credentialOffer: string;

  email?: string;

  userId?: string;
}

export class RequestOid4vcCredentialDto extends ResolveOid4vcCredentialOfferDto {
  @ApiPropertyOptional({
    example: '7550',
    description: 'Transaction code (PIN) the issuer gave the holder, when required'
  })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString({ message: 'txCode must be a string' })
  @MaxLength(64, { message: 'txCode must be at most 64 characters' })
  txCode?: string;

  @ApiPropertyOptional({
    example: ['Importer Exporter Code-sdjwt'],
    description: 'Credential configuration ids to request. Defaults to every credential in the offer.'
  })
  @IsOptional()
  @IsArray({ message: 'credentialsToRequest must be an array' })
  @ArrayMaxSize(20, { message: 'credentialsToRequest must have at most 20 entries' })
  @IsString({ each: true, message: 'each entry of credentialsToRequest must be a string' })
  credentialsToRequest?: string[];

  @ApiPropertyOptional({
    example: 'did:web:dgft.gov.in:iec:0512345678#key-1',
    description:
      'Bind the credentials to this DID of the wallet instead of a new key: a verification method id, or a DID to use its first authentication key. For example a did:web whose key was imported from the DSC certificate of the holder.'
  })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString({ message: 'holderDidUrl must be a string' })
  @Matches(/^did:[a-z0-9]+:\S+$/, { message: 'holderDidUrl must be a DID or a DID URL' })
  @MaxLength(2048, { message: 'holderDidUrl must be at most 2048 characters' })
  holderDidUrl?: string;

  @ApiPropertyOptional({
    enum: ['require', 'prefer'],
    default: 'require',
    description:
      'When the issuer cannot bind to holderDidUrl (DID method or key algorithm): require fails the request, prefer binds to a new key. Ignored without holderDidUrl.'
  })
  @IsOptional()
  @IsIn(['require', 'prefer'], { message: 'bindingPolicy must be require or prefer' })
  bindingPolicy?: 'require' | 'prefer';

  @ApiPropertyOptional({
    default: true,
    description: 'Tell the issuer whether each credential was stored (OID4VCI notifications)'
  })
  @IsOptional()
  @IsBoolean({ message: 'sendNotification must be a boolean' })
  sendNotification?: boolean;
}
