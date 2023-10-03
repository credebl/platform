import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
import { ecosystem } from '@prisma/client';
// eslint-disable-next-line camelcase
@Injectable()
export class EcosystemRepository {

    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: Logger
    ) { }

    /**
     * Description: Get getAgentEndPoint by orgId
     * @param createEcosystemDto 
     * @returns Get getAgentEndPoint details
     */
    // eslint-disable-next-line camelcase
    async createNewEcosystem(createEcosystemDto):Promise<ecosystem> {
        try {
            const transaction = await this.prisma.$transaction(async (prisma) => {
                const { name, description, userId } = createEcosystemDto;
                const createdEcosystem = await prisma.ecosystem.create({
                    data: {
                        name,
                        description,
                        tags: 'test'
                    }
                });
                let ecosystemUser;
                if (createdEcosystem) {
                    ecosystemUser = await prisma.ecosystem_users.create({
                        data: {
                            userId: String(userId),
                            ecosystemId: createdEcosystem.id
                        }
                    });
                }

                if (ecosystemUser) {
                    ecosystemUser = await prisma.ecosystem_orgs.create({
                        data: {
                            orgId: String(userId),
                            status: 'ACTIVE',
                            ecosystemId: createdEcosystem.id,
                            ecosystemRoleId: 1
                        }
                    });
                }
                return createdEcosystem;
            });

            return transaction;
        } catch (error) {
            this.logger.error(`Error in create ecosystem transaction: ${error.message}`);
            throw error;
        }
    }

    /**
   * Description: Edit ecosystem by Id
   * @param editEcosystemDto 
   * @returns ecosystem details
   */
    // eslint-disable-next-line camelcase
    async updateEcosystemById(createEcosystemDto, ecosystemId):Promise<ecosystem> {
        try {
            const {name, description} = createEcosystemDto;
            const editEcosystem = await this.prisma.ecosystem.update({
                where: { id: ecosystemId },
                data: {
                    name,
                    description,
                    tags: 'updated test'
                }
            });
            return editEcosystem;
        } catch (error) {
            this.logger.error(`Error in edit ecosystem transaction: ${error.message}`);
            throw error;
        }
    }

     /**
   * Description: Edit ecosystem by Id
   *
   * @returns Get all ecosystem details
   */
    // eslint-disable-next-line camelcase
    async getAllEcosystemDetails() :Promise<ecosystem[]> {
        try {
            const ecosystemDetails = await this.prisma.ecosystem.findMany({
            });
            return ecosystemDetails;
        } catch (error) {
            this.logger.error(`Error in edit ecosystem transaction: ${error.message}`);
            throw error;
        }
    }


}