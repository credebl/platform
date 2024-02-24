import { trim } from '@credebl/common/cast.helper';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

class ValidResponses {
    @ApiProperty({ example: 'what is your name' })
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

    @ApiProperty({ example: [{ 'text': 'xyz'}] })
    @IsNotEmpty({ message: 'Please provide valid responses' })
    @IsArray({ message: 'Responses should be array' })
    @ValidateNested({ each: true })
    @Type(() => ValidResponses)
    validResponses: ValidResponses[];

    @ApiProperty({ example: [{ 'question': 'what is your name'}] })
    @IsNotEmpty({ message: 'question is required' })
    @IsString({ message: 'question must be a string' })
    @IsNotEmpty({ message: 'please provide valid question' })
    question: string;

    orgId: string;
    connectionId: string;
    tenantId: string;
}
