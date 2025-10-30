import { OpenId4VcVerificationSessionState } from '@credebl/common/interfaces/oid4vp-verification';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';

/**
 * DTO for verification-session query parameters.
 * Use with @Query() in your controller and enable ValidationPipe globally or on the route.
 */
export class VerificationSessionQueryDto {
  @ApiPropertyOptional({
    description: 'Public identifier of the verifier',
    example: 'verifier_0x123',
  })
  @IsOptional()
  @IsString()
  publicVerifierId?: string;

  @ApiPropertyOptional({
    description: 'Opaque payload state used by the client / verifier',
    example: 'payload-state-xyz',
  })
  @IsOptional()
  @IsString()
  payloadState?: string;

  @ApiPropertyOptional({
    description: 'Session state',
    enum: OpenId4VcVerificationSessionState,
    example: OpenId4VcVerificationSessionState.RequestCreated,
  })
  @IsOptional()
  @IsEnum(OpenId4VcVerificationSessionState)
  state?: OpenId4VcVerificationSessionState;

  @ApiPropertyOptional({
    description: 'Authorization request URI (if present)',
    example: 'https://auth.example.com/request/abc123',
  })
  @IsOptional()
  @IsUrl()
  authorizationRequestUri?: string;

  @ApiPropertyOptional({
    description: 'Nonce associated with the session',
    example: 'n-0S6_WzA2Mj',
  })
  @IsOptional()
  @IsString()
  nonce?: string;

  @ApiPropertyOptional({
    description: 'Optional id to target a specific session/resource',
    example: 'session-id-987',
  })
  @IsOptional()
  @IsString()
  id?: string;
}
