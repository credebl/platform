import { trim } from '@credebl/common/cast.helper';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

class ValidResponses {
    @ApiProperty({ example: 'Emma' })
    @IsNotEmpty({ message: 'text is required' })
    @IsString({ message: 'text should be a string' })
    @Transform(({ value }) => trim(value))
    @Type(() => String)
    text: string;
}
export class QuestionDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'detail must be a string' })
    @IsNotEmpty({ message: 'please provide valid detail' })
    detail: string;

    @ApiProperty({ example: [{ 'text': 'Emma'}, { 'text': 'Kiva'}] })
    @IsNotEmpty({ message: 'Please provide valid responses' })
    @IsArray({ message: 'Responses should be array' })
    @ValidateNested({ each: true })
    @Type(() => ValidResponses)
    validResponses: ValidResponses[];

    @ApiProperty({ example:  'What is your name'})
    @IsNotEmpty({ message: 'question is required' })
    @IsString({ message: 'question must be a string' })
    @IsNotEmpty({ message: 'please provide valid question' })
    question: string;

    orgId: string;
    connectionId: string;
}

export class BasicMessageDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'content must be a string' })
    @IsNotEmpty({ message: 'please provide valid content' })
    content: string;

    orgId: string;
    connectionId: string;
}

export class QuestionAnswerWebhookDto {
    
   
        @ApiPropertyOptional()
        @IsOptional()
        id: string;
    
        @ApiPropertyOptional()
        @IsOptional()
        createdAt: string;
    
        @ApiPropertyOptional()
        @IsOptional()
        questionText: string;
    
        @ApiPropertyOptional()
        @IsOptional()
        questionDetail: string;
    
        @ApiPropertyOptional()
        @IsOptional()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validResponses:any;
    
        @ApiPropertyOptional()
        @IsOptional()
        connectionId: string;
    
        @ApiPropertyOptional()
        @IsOptional()
        role: string;
    
        @ApiPropertyOptional()
        @IsOptional()
        signatureRequired: boolean;
    
        @ApiPropertyOptional()
        @IsOptional()
        state: boolean;
    
        @ApiPropertyOptional()
        @IsOptional()
        threadId: string;
    
        @ApiPropertyOptional()
        @IsOptional()
        updatedAt: string;
    
        @ApiPropertyOptional()
        @IsOptional()
        contextCorrelationId: string;
    
        @ApiPropertyOptional()
        @IsOptional()
        type: string;
    
}