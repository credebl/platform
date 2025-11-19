import * as fs from 'fs';

import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CommonConstants } from '../../common/src/common.constant';
import * as CryptoJS from 'crypto-js';
import { exec } from 'child_process';
import * as util from 'util';
const execPromise = util.promisify(exec); 

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
    } catch (error) {
        logger.error('An error occurred seeding platformConfig:', error);
        throw error;
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

    } catch (error) {
        logger.error('An error occurred seeding orgRoles:', error);
        throw error;
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


    } catch (error) {
        logger.error('An error occurred seeding agentTypes:', error);
        throw error;
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


    } catch (error) {
        logger.error('An error occurred seeding orgAgentTypes:', error);
        throw error;
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

    } catch (error) {
        logger.error('An error occurred seeding platformUser:', error);
        throw error;
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

    } catch (error) {
        logger.error('An error occurred seeding platformOrganization:', error);
        throw error;
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


    } catch (error) {
        logger.error('An error occurred seeding platformOrganization:', error);
        throw error;
    }
};

const createLedger = async (): Promise<void> => {
    try {
      const { ledgerData } = JSON.parse(configData);
  
      const existingLedgers = await prisma.ledgers.findMany();
  
      if (0 === existingLedgers.length) {
        const createLedger = await prisma.ledgers.createMany({
          data: ledgerData
        });
        logger.log('All ledgers inserted:', createLedger);
      } else {
        const updatesNeeded = [];

        if (existingLedgers.length !== ledgerData.length) {
            updatesNeeded.push(ledgerData);
            if (0 < updatesNeeded.length) {
              await prisma.ledgers.deleteMany();
        
              const createLedger = await prisma.ledgers.createMany({
                data: ledgerData
              });
              logger.log('Updated ledgers:', createLedger);
            } else {
              logger.log('No changes in ledger data');
            }
        } else {
            logger.log('No changes in ledger data');
        }
      }
    } catch (error) {
      logger.error('An error occurred seeding createLedger:', error);
      throw error;
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


    } catch (error) {
        logger.error('An error occurred seeding ecosystemRoles:', error);
        throw error;
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


    } catch (error) {
        logger.error('An error occurred seeding createEcosystemConfig:', error);
        throw error;
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
    } catch (error) {
        logger.error('An error occurred while configuring ledger:', error);
        throw error;
    }
};

const createUserRole = async (): Promise<void> => {
    try {
        const { userRoleData } = JSON.parse(configData);

        const userRoleDetails = userRoleData.map(userRole => userRole.role);
        const existUserRole = await prisma.user_role.findMany({
            where: {
                role: {
                    in: userRoleDetails
                }
            }
        });

        if (0 === existUserRole.length) {
            const userRole = await prisma.user_role.createMany({
                data: userRoleData
            });

            logger.log(userRole);
        } else {
            logger.log('Already seeding in user role');
        }


    } catch (error) {
        logger.error('An error occurred seeding user role:', error);
        throw error;
    }
};

const migrateOrgAgentDids = async (): Promise<void> => {
    try {
        const orgAgents = await prisma.org_agents.findMany({
            where: {
                walletName: {
                    not: 'platform-admin'
                }
            }
        });

        const orgDids = orgAgents.map((agent) => agent.orgDid).filter((did) => null !== did && '' !== did);
        const existingDids = await prisma.org_dids.findMany({
            where: {
                did: {
                    in: orgDids
                }
            }
        });

        const filteredOrgAgents = orgAgents.filter(
            (agent) => null !== agent.orgDid && '' !== agent.orgDid
        );

        // If there are org DIDs that do not exist in org_dids table
        if (orgDids.length !== existingDids.length) {
            const newOrgAgents = filteredOrgAgents.filter(
                (agent) => !existingDids.some((did) => did.did === agent.orgDid)
            );

            const newDidRecords = newOrgAgents.map((agent) => ({
                orgId: agent.orgId,
                did: agent.orgDid,
                didDocument: agent.didDocument,
                isPrimaryDid: true,
                createdBy: agent.createdBy,
                lastChangedBy: agent.lastChangedBy,
                orgAgentId: agent.id
            }));

            const didInsertResult = await prisma.org_dids.createMany({
                data: newDidRecords
            });

            logger.log(didInsertResult);
        } else {
            logger.log('No new DIDs to migrate in migrateOrgAgentDids');
        }
    } catch (error) {
        logger.error('An error occurred during migrateOrgAgentDids:', error);
        throw error;
    }
};

const addSchemaType = async (): Promise<void> => {
    try {
        const emptyTypeSchemaList = await prisma.schema.findMany({
            where: {
              OR: [
                { type: null },
                { type: '' }
              ]
            }
        });
        if (0 < emptyTypeSchemaList.length) {
            const updatePromises = emptyTypeSchemaList.map((schema) => prisma.schema.update({
                    where: { id: schema.id },
                    data: { type: 'indy' }
                })
            );
           await Promise.all(updatePromises);

            logger.log('Schemas updated successfully');
        } else {
            logger.log('No schemas to update');
        }
    } catch (error) {
        logger.error('An error occurred during addSchemaType:', error);
        throw error;
    }
};

const importGeoLocationMasterData = async (): Promise<void> => {
    try {
      const scriptPath = process.env.GEO_LOCATION_MASTER_DATA_IMPORT_SCRIPT;
      const dbUrl = process.env.DATABASE_URL;
  
      if (!scriptPath || !dbUrl) {
        throw new Error('Environment variables GEO_LOCATION_MASTER_DATA_IMPORT_SCRIPT or DATABASE_URL are not set.');
      }
  
      const command = `${process.cwd()}/${scriptPath} ${dbUrl}`;
      const { stdout, stderr } = await execPromise(command);
  
      if (stdout) {
        logger.log(`Shell script output: ${stdout}`);
      }
      if (stderr) {
        logger.error(`Shell script error: ${stderr}`);
      }
    } catch (error) {
      logger.error('An error occurred during importGeoLocationMasterData:', error);
      throw error;
    }
  };

const encryptClientCredential = async (clientCredential: string): Promise<string> => {
    try {
        const encryptedToken = CryptoJS.AES.encrypt(JSON.stringify(clientCredential), process.env.CRYPTO_PRIVATE_KEY).toString();

        return encryptedToken;
    } catch (error) {
        logger.error('An error occurred during encryptClientCredential:', error);
        throw error;
    }
};

const updateClientCredential = async (): Promise<void> => {
    try {
      const scriptPath = process.env.UPDATE_CLIENT_CREDENTIAL_SCRIPT;
      const dbUrl = process.env.DATABASE_URL;
      const clientId = process.env.KEYCLOAK_MANAGEMENT_CLIENT_ID;
      const clientSecret = process.env.KEYCLOAK_MANAGEMENT_CLIENT_SECRET;

      if (!scriptPath || !dbUrl || !clientId || !clientSecret) {
        throw new Error('Environment variables UPDATE_CLIENT_CREDENTIAL_SCRIPT or DATABASE_URL or clientId or clientSecret are not set.');
      }
  
      const encryptedClientId = await encryptClientCredential(process.env.KEYCLOAK_MANAGEMENT_CLIENT_ID);
      const encryptedClientSecret = await encryptClientCredential(process.env.KEYCLOAK_MANAGEMENT_CLIENT_SECRET);

      const command = `${process.cwd()}/${scriptPath} ${dbUrl} ${encryptedClientId} ${encryptedClientSecret}`;
  
      const { stdout, stderr } = await execPromise(command);
  
      if (stdout) {
        logger.log(`Shell script output: ${stdout}`);
      }
      if (stderr) {
        logger.error(`Shell script error: ${stderr}`);
      }
          
    } catch (error) {
        logger.error('An error occurred during updateClientCredential:', error);
        throw error;
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
    await createUserRole();
    await migrateOrgAgentDids();
    await addSchemaType();
    await importGeoLocationMasterData();
    await updateClientCredential();
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (error) => {
        logger.error(`In prisma seed initialize`, error);
        await prisma.$disconnect();
        process.exit(1);
    });