import * as fs from 'fs';

import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CommonConstants } from '../../common/src/common.constant';

const prisma = new PrismaClient();
const logger = new Logger('Init seed DB');
let platformUserId = '';

const configData = fs.readFileSync(`${process.env.PWD}/prisma/data/credebl-master-table.json`, 'utf8');
const createPlatformConfig = async (): Promise<void> => {
    try {
        const { platformConfigData } = JSON.parse(configData);
        const platformConfig = await prisma.platform_config.create({
            data: platformConfigData
        });

        logger.log(platformConfig);
    } catch (e) {
        logger.error('An error occurred seeding platformConfig:', e);
    }
};

const createOrgRoles = async (): Promise<void> => {
    try {
        const { orgRoleData } = JSON.parse(configData);
        const orgRoles = await prisma.org_roles.createMany({
            data: orgRoleData
        });

        logger.log(orgRoles);
    } catch (e) {
        logger.error('An error occurred seeding orgRoles:', e);
    }
};

const createAgentTypes = async (): Promise<void> => {
    try {
        const { agentTypeData } = JSON.parse(configData);
        const agentTypes = await prisma.agents_type.createMany({
            data: agentTypeData
        });

        logger.log(agentTypes);
    } catch (e) {
        logger.error('An error occurred seeding agentTypes:', e);
    }
};

const createOrgAgentTypes = async (): Promise<void> => {
    try {
        const { orgAgentTypeData } = JSON.parse(configData);
        const orgAgentTypes = await prisma.org_agents_type.createMany({
            data: orgAgentTypeData
        });

        logger.log(orgAgentTypes);
    } catch (e) {
        logger.error('An error occurred seeding orgAgentTypes:', e);
    }
};

const createPlatformUser = async (): Promise<void> => {
    try {
        const { platformAdminData } = JSON.parse(configData);
        platformAdminData.email = process.env.PLATFORM_ADMIN_EMAIL;
        platformAdminData.username = process.env.PLATFORM_ADMIN_EMAIL;
        const platformUser = await prisma.user.create({
            data: platformAdminData
        });

        platformUserId = platformUser.id;

        logger.log(platformUser);
    } catch (e) {
        logger.error('An error occurred seeding platformUser:', e);
    }
};


const createPlatformOrganization = async (): Promise<void> => {
    try {
        const { platformAdminOrganizationData } = JSON.parse(configData);
        platformAdminOrganizationData.createdBy = platformUserId;
        platformAdminOrganizationData.lastChangedBy = platformUserId;
        const platformOrganization = await prisma.organisation.create({
            data: platformAdminOrganizationData
        });

        logger.log(platformOrganization);
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

        const platformOrganization = await prisma.user_org_roles.create({
            data: {
                userId: userId.id,
                orgRoleId: orgRoleId.id,
                orgId: orgId.id
            }
        });

        logger.log(platformOrganization);
    } catch (e) {
        logger.error('An error occurred seeding platformOrganization:', e);
    }
};

const createLedger = async (): Promise<void> => {
    try {
        const { ledgerData } = JSON.parse(configData);
        const createLedger = await prisma.ledgers.createMany({
            data: ledgerData
        });

        logger.log(createLedger);
    } catch (e) {
        logger.error('An error occurred seeding createLedger:', e);
    }
};

const createEcosystemRoles = async (): Promise<void> => {
    try {
        const { ecosystemRoleData } = JSON.parse(configData);
        const ecosystemRoles = await prisma.ecosystem_roles.createMany({
            data: ecosystemRoleData
        });

        logger.log(ecosystemRoles);
    } catch (e) {
        logger.error('An error occurred seeding ecosystemRoles:', e);
    }
};

const createEcosystemConfig = async (): Promise<void> => {
    try {
        const { ecosystemConfigData } = JSON.parse(configData);
        const configDetails = await prisma.ecosystem_config.createMany({
            data: ecosystemConfigData
        });

        logger.log(configDetails);
    } catch (e) {
        logger.error('An error occurred seeding createEcosystemConfig:', e);
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
