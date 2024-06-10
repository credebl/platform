import * as fs from 'fs';

import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CommonConstants } from '../../common/src/common.constant';

const prisma = new PrismaClient();
const logger = new Logger('Init seed DB');
let platformUserId = '';

const configData = fs.readFileSync(`${process.cwd()}/prisma/data/credebl-master-table.json`, 'utf8');
const createPlatformConfig = async (): Promise<void> => {
    try {
        const existPlatformAdmin = await prisma.platform_config.findMany();

        if (0 === existPlatformAdmin.length) {
            const { platformConfigData } = JSON.parse(configData);
            const platformConfig = await prisma.platform_config.create({
                data: platformConfigData
            });

            logger.log(platformConfig);
        } else {
            logger.log('Already seeding in platform config');
        }
    } catch (e) {
        logger.error('An error occurred seeding platformConfig:', e);
    }
};

const createOrgRoles = async (): Promise<void> => {
    try {
        const { orgRoleData } = JSON.parse(configData);
        const roleNames = orgRoleData.map(role => role.name);
        const existOrgRole = await prisma.org_roles.findMany({
            where: {
                name: {
                    in: roleNames
                }
            }
        });

        if (0 === existOrgRole.length) {
            const orgRoles = await prisma.org_roles.createMany({
                data: orgRoleData
            });

            logger.log(orgRoles);
        } else {
            logger.log('Already seeding in org role');
        }

    } catch (e) {
        logger.error('An error occurred seeding orgRoles:', e);
    }
};

const createAgentTypes = async (): Promise<void> => {
    try {
        const { agentTypeData } = JSON.parse(configData);

        const agentType = agentTypeData.map(agentType => agentType.agent);
        const existAgentType = await prisma.agents_type.findMany({
            where: {
                agent: {
                    in: agentType
                }
            }
        });

        if (0 === existAgentType.length) {
            const agentTypes = await prisma.agents_type.createMany({
                data: agentTypeData
            });

            logger.log(agentTypes);
        } else {
            logger.log('Already seeding in agent type');
        }


    } catch (e) {
        logger.error('An error occurred seeding agentTypes:', e);
    }
};

const createOrgAgentTypes = async (): Promise<void> => {
    try {
        const { orgAgentTypeData } = JSON.parse(configData);
        const orgAgentType = orgAgentTypeData.map(orgAgentType => orgAgentType.agent);
        const existAgentType = await prisma.org_agents_type.findMany({
            where: {
                agent: {
                    in: orgAgentType
                }
            }
        });

        if (0 === existAgentType.length) {
            const orgAgentTypes = await prisma.org_agents_type.createMany({
                data: orgAgentTypeData
            });

            logger.log(orgAgentTypes);
        } else {
            logger.log('Already seeding in org agent type');
        }


    } catch (e) {
        logger.error('An error occurred seeding orgAgentTypes:', e);
    }
};

const createPlatformUser = async (): Promise<void> => {
    try {
        const { platformAdminData } = JSON.parse(configData);
        platformAdminData.email = process.env.PLATFORM_ADMIN_EMAIL;
        platformAdminData.username = process.env.PLATFORM_ADMIN_EMAIL;

        const existPlatformAdminUser = await prisma.user.findMany({
            where: {
                email: platformAdminData.email
            }
        });

        if (0 === existPlatformAdminUser.length) {
            const platformUser = await prisma.user.create({
                data: platformAdminData
            });

            platformUserId = platformUser.id;

            logger.log(platformUser);
        } else {
            logger.log('Already seeding in user');
        }

    } catch (e) {
        logger.error('An error occurred seeding platformUser:', e);
    }
};


const createPlatformOrganization = async (): Promise<void> => {
    try {
        const { platformAdminOrganizationData } = JSON.parse(configData);
        platformAdminOrganizationData.createdBy = platformUserId;
        platformAdminOrganizationData.lastChangedBy = platformUserId;

        const existPlatformAdminUser = await prisma.organisation.findMany({
            where: {
                name: platformAdminOrganizationData.name
            }
        });

        if (0 === existPlatformAdminUser.length) {
            const platformOrganization = await prisma.organisation.create({
                data: platformAdminOrganizationData
            });

            logger.log(platformOrganization);
        } else {
            logger.log('Already seeding in organization');
        }

    } catch (e) {
        logger.error('An error occurred seeding platformOrganization:', e);
    }
};

const createPlatformUserOrgRoles = async (): Promise<void> => {
    try {

        const userId = await prisma.user.findUnique({
            where: {
                email: `${CommonConstants.PLATFORM_ADMIN_EMAIL}`
            }
        });

        const orgId = await prisma.organisation.findFirst({
            where: {
                name: `${CommonConstants.PLATFORM_ADMIN_ORG}`
            }
        });

        const orgRoleId = await prisma.org_roles.findUnique({
            where: {
                name: `${CommonConstants.PLATFORM_ADMIN_ORG_ROLE}`
            }
        });

        if (!userId && !orgId && !orgRoleId) {
            const platformOrganization = await prisma.user_org_roles.create({
                data: {
                    userId: userId.id,
                    orgRoleId: orgRoleId.id,
                    orgId: orgId.id
                }
            });
            logger.log(platformOrganization);
        } else {
            logger.log('Already seeding in org_roles');
        }


    } catch (e) {
        logger.error('An error occurred seeding platformOrganization:', e);
    }
};

const createLedger = async (): Promise<void> => {
    try {
        const { ledgerData } = JSON.parse(configData);

        const ledgerIndyNamespace = ledgerData.map(ledger => ledger.indyNamespace);
        const existLedgerIndyNameSpace = await prisma.ledgers.findMany({
            where: {
                indyNamespace: {
                    in: ledgerIndyNamespace
                }
            }
        });

        if (0 === existLedgerIndyNameSpace.length) {

            const createLedger = await prisma.ledgers.createMany({
                data: ledgerData
            });

            logger.log(createLedger);
        } else {
            logger.log('Already seeding in ledgers');
        }


    } catch (e) {
        logger.error('An error occurred seeding createLedger:', e);
    }
};

const createEcosystemRoles = async (): Promise<void> => {
    try {
        const { ecosystemRoleData } = JSON.parse(configData);

        const ecosystemRoleDetails = ecosystemRoleData.map(ecosystemRole => ecosystemRole.name);
        const existEcosystemRole = await prisma.ecosystem_roles.findMany({
            where: {
                name: {
                    in: ecosystemRoleDetails
                }
            }
        });

        if (0 === existEcosystemRole.length) {
            const ecosystemRoles = await prisma.ecosystem_roles.createMany({
                data: ecosystemRoleData
            });

            logger.log(ecosystemRoles);
        } else {
            logger.log('Already seeding in ecosystem roles');
        }


    } catch (e) {
        logger.error('An error occurred seeding ecosystemRoles:', e);
    }
};

const createEcosystemConfig = async (): Promise<void> => {
    try {
        const { ecosystemConfigData } = JSON.parse(configData);

        const ecosystemConfigKey = ecosystemConfigData.map(ecosystemConfig => ecosystemConfig.key);
        const existEcosystemConfig = await prisma.ecosystem_config.findMany({
            where: {
                key: {
                    in: ecosystemConfigKey
                }
            }
        });


        if (0 === existEcosystemConfig.length) {
            const configDetails = await prisma.ecosystem_config.createMany({
                data: ecosystemConfigData
            });

            logger.log(configDetails);
        } else {
            logger.log('Already seeding in ecosystem config');
        }


    } catch (e) {
        logger.error('An error occurred seeding createEcosystemConfig:', e);
    }
};

const createLedgerConfig = async (): Promise<void> => {
    try {
        const { ledgerConfig } = JSON.parse(configData);

        const ledgerConfigList = await prisma.ledgerConfig.findMany();
        
        const checkDataIsEqual = (ledgerConfig, ledgerConfigList): boolean => {
            if (ledgerConfig.length !== ledgerConfigList.length) {
                return false;
            }
        
            for (let i = 0; i < ledgerConfig.length; i++) {
                const config1 = ledgerConfig[i];
                const config2 = ledgerConfigList.find(item => item.name === config1.name && JSON.stringify(item.details) === JSON.stringify(config1.details));
        
                if (!config2) {
                    return false;
                }
            }        
            return true;
        };

        if (0 === ledgerConfigList.length) {
            const configDetails = await prisma.ledgerConfig.createMany({
                data: ledgerConfig
            });
            logger.log('Ledger config created:', configDetails);

        } else if (!checkDataIsEqual(ledgerConfig, ledgerConfigList)) {
            await prisma.ledgerConfig.deleteMany({});
            const configDetails = await prisma.ledgerConfig.createMany({
                data: ledgerConfig
            });
            logger.log('Existing ledger config deleted and new ones created:', configDetails);
        } else {
            logger.log('Already seeding in ledger config');
        }
    } catch (e) {
        logger.error('An error occurred while configuring ledger:', e);
    }
};


async function main(): Promise<void> {

    await createPlatformConfig();
    await createOrgRoles();
    await createAgentTypes();
    await createPlatformUser();
    await createPlatformOrganization();
    await createPlatformUserOrgRoles();
    await createOrgAgentTypes();
    await createLedger();
    await createEcosystemRoles();
    await createEcosystemConfig();
    await createLedgerConfig();
}


main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        logger.error(`In prisma seed initialize`, e);
        await prisma.$disconnect();
        process.exit(1);
    });