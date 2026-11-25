import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { trim } from '@credebl/common/cast.helper';

/**
 * A UI-only suggestion. The platform never adds `didUrl` to an OID4VC credential request on the user's behalf.
 */
export class SetHolderPrimaryDidDto {
  @ApiProperty({
    example: 'did:web:holder.example.com#key-1',
    description: 'DID URL that must exist in the supplied holder tenant'
  })
  @IsString({ message: 'didUrl must be a string' })
  @IsNotEmpty({ message: 'please provide a valid didUrl' })
  @Transform(({ value }) => trim(value))
  @Matches(/^did:[a-z0-9]+:\S+$/i, { message: 'didUrl must be a DID or DID URL' })
  @MaxLength(2048, { message: 'didUrl must be at most 2048 characters' })
  didUrl!: string;

  @ApiProperty({ example: 'tenant-uuid', description: 'Holder tenant that owns the DID' })
  @IsString({ message: 'holderTenantId must be a string' })
  @IsNotEmpty({ message: 'please provide a valid holderTenantId' })
  @Transform(({ value }) => trim(value))
  @MaxLength(500, { message: 'holderTenantId must be at most 500 characters' })
  holderTenantId!: string;
}
