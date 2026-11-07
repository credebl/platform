import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export const DID_RESOLVE_SOURCES = ['local', 'network'] as const;
export type DidResolveSource = (typeof DID_RESOLVE_SOURCES)[number];

export class ResolveDidDto {
  @ApiPropertyOptional({
    enum: DID_RESOLVE_SOURCES,
    default: 'local',
    description: 'local answers from the agent record, network resolves the DID over the network'
  })
  @IsOptional()
  @Transform(({ value }) => ('string' === typeof value ? value.trim().toLowerCase() : value))
  @IsIn(DID_RESOLVE_SOURCES, { message: 'source must be local or network.' })
  source?: DidResolveSource = 'local';
}
