import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

interface IWebhookPresentationProof {
    threadId: string;
    state: string;
    connectionId
}

export class WebhookPresentationProof {

    @ApiProperty()
    @IsOptional()
    metadata: object;

    @ApiProperty()
    @IsOptional()
    _tags: IWebhookPresentationProof;

    @ApiProperty()
    @IsOptional()
    id: string;

    @ApiProperty()
    @IsOptional()
    createdAt: string;

    @ApiProperty()
    @IsOptional()
    protocolVersion: string;

    @ApiProperty()
    @IsOptional()
    state: string;

    @ApiProperty()
    @IsOptional()
    connectionId: string;

    @ApiProperty()
    @IsOptional()
    threadId: string;

    @ApiProperty()
    @IsOptional()
    autoAcceptProof: string;

    @ApiProperty()
    @IsOptional()
    updatedAt: string;

    @ApiProperty()
    @IsOptional()
    isVerified: boolean;

    @ApiProperty()
    @IsOptional()
    contextCorrelationId: string;
}