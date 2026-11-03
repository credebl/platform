import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsISO8601, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Notification events a wallet can send to the issuer's notification endpoint (OID4VCI 1.0, section 11)
 */
export const OID4VCI_NOTIFICATION_EVENTS = ['credential_accepted', 'credential_failure', 'credential_deleted'] as const;
export type Oid4vciNotificationEvent = (typeof OID4VCI_NOTIFICATION_EVENTS)[number];

export class CredentialOfferPayloadDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  // eslint-disable-next-line camelcase
  credential_configuration_ids!: string[];
}

export class IssuanceMetadataDto {
  @ApiProperty()
  @IsString()
  issuerDid!: string;

  @ApiProperty({ type: [Object] })
  @IsArray()
  credentials!: Record<string, unknown>[];
}

/**
 * A wallet notification received by the issuer agent. Sent on its own webhook, next to the issuance session;
 * it does not change the session state.
 */
export class Oid4vciWalletNotificationDto {
  @ApiProperty()
  @IsString()
  notificationId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  credentialConfigurationId?: string;

  @ApiProperty({ enum: OID4VCI_NOTIFICATION_EVENTS })
  @IsIn(OID4VCI_NOTIFICATION_EVENTS)
  event!: Oid4vciNotificationEvent;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventDescription?: string;

  @ApiProperty()
  @IsISO8601()
  receivedAt!: string;
}

export class OidcIssueCredentialDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  credentialOfferId!: string;

  @ApiProperty({ type: [Object] })
  @IsArray()
  issuedCredentials!: Record<string, unknown>[];

  @ApiProperty({ type: CredentialOfferPayloadDto })
  @IsObject()
  credentialOfferPayload!: CredentialOfferPayloadDto;

  @ApiProperty()
  @IsString()
  state!: string;

  @ApiProperty()
  @IsString()
  createdAt!: string;

  @ApiProperty()
  @IsString()
  updatedAt!: string;

  @ApiProperty()
  @IsString()
  contextCorrelationId!: string;

  @ApiProperty()
  @IsString()
  issuerId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  orgId: string;

  /**
   * Present only when this webhook reports a wallet notification
   */
  @ApiPropertyOptional({ type: Oid4vciWalletNotificationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => Oid4vciWalletNotificationDto)
  notification?: Oid4vciWalletNotificationDto;

  /**
   * Notification history of the session, as stored by the agent: one entry per `notification_id`, with its events
   */
  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  notifications?: Record<string, unknown>[];
}

/**
 * Utility: return only credential_configuration_ids from a webhook payload
 */
export function extractCredentialConfigurationIds(payload: Partial<OidcIssueCredentialDto>): string[] {
  const cfg = payload?.credentialOfferPayload?.credential_configuration_ids;
  return Array.isArray(cfg) ? cfg : [];
}
