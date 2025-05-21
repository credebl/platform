import { ApiProperty } from '@nestjs/swagger'

export class ApiResponseDto {
  @ApiProperty({ example: 'Success' })
  message: string

  @ApiProperty()
  success: boolean

  @ApiProperty()
  data?: unknown

  @ApiProperty({ example: 200 })
  code?: number
}
