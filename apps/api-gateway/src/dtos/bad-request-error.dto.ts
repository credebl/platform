import { HttpStatus } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class BadRequestErrorDto {
  @ApiProperty({ example: HttpStatus.BAD_REQUEST })
  statusCode: number

  @ApiProperty({ example: 'Please provide valid data' })
  message: string

  @ApiProperty({ example: 'Bad Request' })
  error: string
}
