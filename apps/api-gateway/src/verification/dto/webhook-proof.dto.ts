import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

interface IWebhookPresentationProof {
    threadId: string;
    state: string;
    connectionId
}

export class WebhookPresentationProofDto {

    @ApiPropertyOptional()
    @IsOptional()
    metadata: object;

    @ApiPropertyOptional()
    @IsOptional()
    _tags: IWebhookPresentationProof;

    @ApiPropertyOptional()
    @IsOptional()
    id: string;

    @ApiPropertyOptional()
    @IsOptional()
    createdAt: string;

    @ApiPropertyOptional()
    @IsOptional()
    protocolVersion: string;

    @ApiPropertyOptional()
    @IsOptional()
    state: string;

    @ApiPropertyOptional()
    @IsOptional()
    connectionId: string;

    @ApiPropertyOptional()
    @IsOptional()
    threadId: string;

    @ApiPropertyOptional()
    @IsOptional()
    presentationId: string;

    @ApiPropertyOptional()
    @IsOptional()
    autoAcceptProof: string;

    @ApiPropertyOptional()
    @IsOptional()
    updatedAt: string;

    @ApiPropertyOptional()
    @IsOptional()
    isVerified: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    contextCorrelationId: string;
}