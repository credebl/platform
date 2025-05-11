import { ApiProperty } from '@nestjs/swagger';

export class EndorseTransactionDto {
  @ApiProperty()
  transactionId: string;
}
