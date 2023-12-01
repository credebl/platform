import { ApiProperty } from '@nestjs/swagger';

export class WalletDetailsDto {

    @ApiProperty()
    walletName: string;

    @ApiProperty()
    walletPassword: string;

    @ApiProperty()
    ledgerId: string;

    @ApiProperty()
    transactionApproval?: string;
    
}