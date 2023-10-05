import { PrismaService } from "@credebl/prisma-service";
import { Injectable, Logger } from "@nestjs/common";
import { ledgers } from "@prisma/client";


@Injectable()
export class LedgerRepository {
    private readonly logger = new Logger('LedgerRepository');

    constructor(
        private prisma: PrismaService
    ) { }

    async getAllLedgers(): Promise<ledgers[]> {
        try {
            return this.prisma.ledgers.findMany();
        } catch (error) {
            this.logger.error(`Error in getAllLedgers: ${error}`);
            throw error;
        }
    }
}