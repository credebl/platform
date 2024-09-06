import { PrismaService } from '@credebl/prisma-service';
import { Injectable, Logger } from '@nestjs/common';
import { ledgers } from '@prisma/client';
import { LedgerDetails } from '../interfaces/ledgers.interface';
import { INetworkUrl } from '@credebl/common/interfaces/schema.interface';


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

    async getNetworkUrl(indyNamespace: string): Promise<INetworkUrl> {

        try {
            return this.prisma.ledgers.findFirst({
              where: {
                indyNamespace                
              },
              select: {
                networkUrl: true
              }
            });
        } catch (error) {
            this.logger.error(`Error in getNetworkUrl: ${error}`);
            throw error;
        }
    }

    async getNetworkById(ledgerId: string): Promise<LedgerDetails> {

        try {
            return this.prisma.ledgers.findFirst({
                where: {
                    id: ledgerId
                },
                select: {
                    id: true,
                    name: true,
                    indyNamespace: true,
                    networkUrl: true
                }
            });
        } catch (error) {
            this.logger.error(`Error in getNetworkById: ${error}`);
            throw error;
        }
    }
}