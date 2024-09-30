import { PrismaService } from '@credebl/prisma-service';
import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line camelcase
import { ledgers } from '@prisma/client';
import { LedgerDetails } from '../interfaces/ledgers.interface';
import { INetworkUrl } from '@credebl/common/interfaces/schema.interface';
import { ISchemasList, ISchemasResult } from '../schema/interfaces/schema.interface';


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
            return this.prisma.ledgers.findFirstOrThrow({
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

    async handleGetSchemas(data: {schemaArray: string[], search: string, pageSize: number, pageNumber: number}): Promise<ISchemasList> {
        try {
          const { schemaArray, search, pageSize, pageNumber } = data;
    
          const schemasResult: ISchemasResult[] = await this.prisma.schema.findMany({
            where: {
              schemaLedgerId: {
                in: schemaArray
              },
              OR: [
                { version: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { schemaLedgerId: { contains: search, mode: 'insensitive' } }
              ]
            },
            take: pageSize,
            skip: (pageNumber - 1) * pageSize,
            orderBy: {
              createDateTime: 'desc'
            }
          });
    
          // Get the total count of schemas that match the query
          const schemasCount = await this.prisma.schema.count({
            where: {
              schemaLedgerId: {
                in: schemaArray
              },
              OR: [
                { version: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { schemaLedgerId: { contains: search, mode: 'insensitive' } }
              ]
            }
          });
    
          // Return the schemas and the total count
          return {
            schemasCount,
            schemasResult
          };
          
        } catch (error) {
          this.logger.error(`Error handling 'get-schemas' request: ${JSON.stringify(error)}`);
          throw error;
        }
      }

      
}