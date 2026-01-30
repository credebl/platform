import { OpenId4VcVerificationPresentationState } from '@credebl/common/interfaces/oid4vp-verification';
import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
/* eslint-disable camelcase */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDefined,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
  Matches
} from 'class-validator';
import { Type } from 'class-transformer';
import { ResponseMode } from '@credebl/enum/enum';
import { SignerOption } from '@prisma/client';

/**
 * DTO for verification-presentation query parameters.
 * Use with @Query() in your controller and enable ValidationPipe globally or on the route.
 */
export class VerificationPresentationQueryDto {
  @ApiPropertyOptional({
    description: 'Public identifier of the verifier',
    example: 'verifier_0x123'
  })
  @IsOptional()
  @IsString()
  publicVerifierId?: string;

  @ApiPropertyOptional({
    description: 'Opaque payload state used by the client / verifier',
    example: 'payload-state-xyz'
  })
  @IsOptional()
  @IsString()
  payloadState?: string;

  @ApiPropertyOptional({
    description: 'Presentation state',
    enum: OpenId4VcVerificationPresentationState,
    example: OpenId4VcVerificationPresentationState.RequestCreated
  })
  @IsOptional()
  @IsEnum(OpenId4VcVerificationPresentationState)
  state?: OpenId4VcVerificationPresentationState;

  @ApiPropertyOptional({
    description: 'Authorization request URI (if present)',
    example: 'https://auth.example.com/request/abc123'
  })
  @IsOptional()
  @IsUrl()
  authorizationRequestUri?: string;

  @ApiPropertyOptional({
    description: 'Nonce associated with the presentation',
    example: 'n-0S6_WzA2Mj'
  })
  @IsOptional()
  @IsString()
  nonce?: string;

  @ApiPropertyOptional({
    description: 'Optional id to target a specific presentation/resource',
    example: 'presentation-id-987'
  })
  @IsOptional()
  @IsString()
  id?: string;
}

/**
 * ----------- PEX DTOs -----------
 */

export class PexFieldConstraintDto {
  @ApiProperty({ example: 'full_name', description: 'Field identifier' })
  @IsDefined()
  @IsString()
  id: string;

  @ApiProperty({
    example: ["$['full_name']"],
    description: 'JSONPath location(s) of the requested claim field',
    isArray: true,
    type: String
  })
  @IsDefined()
  @IsArray()
  @IsString({ each: true })
  path: string[];

  @ApiPropertyOptional({ example: "Request holder's full name" })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  intent_to_retain?: boolean;
}

export class PexConstraintDto {
  @ApiPropertyOptional({ example: 'required', description: 'Limit disclosure policy' })
  @IsOptional()
  @IsString()
  limit_disclosure?: string;

  @ApiProperty({
    type: [PexFieldConstraintDto],
    description: 'List of requested claim fields',
    example: [
      {
        id: 'full_name',
        path: ["$['full_name']"],
        purpose: "Request holder's full name",
        intent_to_retain: true
      },
      {
        id: 'birth_date',
        path: ["$['birth_date']"],
        purpose: "Request holder's birth date",
        intent_to_retain: true
      }
    ]
  })
  @IsDefined()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PexFieldConstraintDto)
  fields: PexFieldConstraintDto[];
}

export class PexInputDescriptorDto {
  @ApiProperty({ example: 'BirthCertificate-vc+sd-jwt' })
  @IsDefined()
  @IsString()
  id: string;

  @ApiPropertyOptional({ example: 'Birth Certificate (vc+sd-jwt)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: { 'vc+sd-jwt': {} },
    description: 'Supported credential format'
  })
  @IsDefined()
  format: Record<string, unknown>;

  @ApiProperty({ type: PexConstraintDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => PexConstraintDto)
  constraints: PexConstraintDto;
}

export class PexDefinitionDto {
  @ApiProperty({ example: 'BirthCertificate-verification' })
  @IsDefined()
  @IsString()
  id: string;

  @ApiPropertyOptional({
    example: 'Present your full name and birth date to verify the BirthCertificate offer'
  })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiProperty({
    type: [PexInputDescriptorDto],
    description: 'Input descriptors specifying credential requirements'
  })
  @IsDefined()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PexInputDescriptorDto)
  input_descriptors: PexInputDescriptorDto[];
}

export class PresentationExchangeDto {
  @ApiProperty({ type: PexDefinitionDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => PexDefinitionDto)
  definition: PexDefinitionDto;
}

/**
 * ----------- DCQL DTOs -----------
 */

export class DcqlClaimDto {
  @ApiProperty({
    example: ['full_name'],
    description: 'Claim path(s) requested from the credential'
  })
  @IsDefined()
  @IsArray()
  @IsString({ each: true })
  path: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  intent_to_retain?: boolean;
}

export class DcqlCredentialDto {
  @ApiProperty({ example: 'birthcertificate-dc_sd_jwt' })
  @IsDefined()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'id must only contain alphanumeric characters, underscores, and hyphens (dots are not allowed)'
  })
  id: string;

  @ApiProperty({ example: 'dc+sd-jwt' })
  @IsDefined()
  @IsString()
  format: string;

  @ApiPropertyOptional({ example: { vct: 'urn:example:vc+sd-jwt' } })
  @IsOptional()
  meta?: Record<string, unknown>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  require_cryptographic_holder_binding?: boolean;

  @ApiProperty({
    type: [DcqlClaimDto],
    description: 'List of claims requested from the credential'
  })
  @IsDefined()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DcqlClaimDto)
  claims: DcqlClaimDto[];
}

export class DcqlQueryDto {
  @ApiPropertyOptional({ example: 'all' })
  @IsOptional()
  @IsString()
  combine?: string;

  @ApiProperty({
    type: [DcqlCredentialDto],
    description: 'List of credential queries'
  })
  @IsDefined()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DcqlCredentialDto)
  credentials: DcqlCredentialDto[];
}

export class DcqlDto {
  //@ApiProperty({ type: DcqlQueryDto })
  @IsDefined()
  //@ValidateNested()
  //@Type(() => DcqlQueryDto)
  query: unknown;
}

/**
 * ----------- ROOT DTO -----------
 */
/**
 * Class-level validator: exactly one of the specified properties must be present.
 */
@ValidatorConstraint({ name: 'OnlyOneOf', async: false })
export class OnlyOneOfConstraint implements ValidatorConstraintInterface {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validate(_: any, args: ValidationArguments): Promise<boolean> | boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const object = args.object as Record<string, any>;
    const properties = args.constraints as string[];
    let present = 0;
    for (const p of properties) {
      if (object[p] !== undefined && null !== object[p]) {
        present++;
      }
    }
    return 1 === present;
  }

  defaultMessage(args: ValidationArguments): string {
    const properties = args.constraints as string[];
    return `Exactly one of [${properties.join(', ')}] must be provided`;
  }
}

export class PresentationRequestDto {
  @ApiPropertyOptional({
    example: {
      method: 'DID'
    },
    description: 'Signer option type'
  })
  @IsOptional()
  requestSigner?: {
    method: SignerOption;
  };

  @ApiPropertyOptional({
    type: PresentationExchangeDto,
    description: 'PEX-based presentation exchange definition'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PresentationExchangeDto)
  presentationExchange?: PresentationExchangeDto;

  @ApiPropertyOptional({
    type: DcqlDto,
    description: 'DCQL-based presentation query definition'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DcqlDto)
  dcql?: DcqlDto;

  @ApiProperty({
    example: ResponseMode.DIRECT_POST_JWT,
    description: 'Response mode for the verifier',
    enum: ResponseMode
  })
  @IsDefined()
  @IsEnum(ResponseMode)
  responseMode: ResponseMode;
  //TODO: check e2e flow and add ResponseMode based restrictions
  @IsOptional()
  expectedOrigins: string[];

  /**
   * Dummy property used to run a class-level validation ensuring mutual exclusivity.
   * This property is not serialized into requests/responses but is required so `class-validator`
   * executes the validator with access to the whole object.
   */
  @ApiHideProperty()
  @ApiPropertyOptional({
    description: 'Internal: ensures exactly one of dcql or presentationExchange is present'
  })
  @Validate(OnlyOneOfConstraint, ['dcql', 'presentationExchange'])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _oneOfCheck?: any;
}
